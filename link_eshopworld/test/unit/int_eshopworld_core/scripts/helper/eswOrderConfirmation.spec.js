/* eslint-disable indent */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var ArrayList = require('../../../../mocks/dw.util.Collection');
var expect = chai.expect;
var sinon = require('sinon');

var basketMgr = require('../../../../mocks/BasketMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Currency = require('../../../../mocks/dw/util/Currency');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var Money = require('../../../../mocks/dw.value.Money');
var Logger = require('../../../../mocks/dw/system/Logger');
var Cookie = require('../../../../mocks/dw/web/Cookie');
var Transaction = require('../../../../mocks/dw/system/Transaction');
var cart = basketMgr.getCurrentBasket();
cart.priceAdjustments = new ArrayList([{
                            product: {
                                online: true,
                                availabilityModel: {
                                    getAvailabilityLevels: function () {
                                        return {
                                            notAvailable: {
                                                value: 0
                                            }
                                        };
                                    }
                                }
                            },
                            priceValue: {},
                            productID: 'someID',
                            quantityValue: 2,
                            custom: { thresholdDiscountType: 'fake type' }
                        }]);

cart.defaultShipment.shippingPriceAdjustments = new ArrayList([{
    basedOnCoupon: true
}]);
cart.getPriceAdjustments = function () {
    return new ArrayList([{
        basedOnCampaign: true,
        promotion: {
            enabled: true
        },
        campaign: {
            enabled: true
        }
    }]);
};
cart.getAllProductLineItems = function () {
    return new ArrayList([{
        getPriceAdjustments: function () {
            return new ArrayList([{
                basedOnCampaign: false,
                promotion: {
                    enabled: false
                },
                campaign: {
                    enabled: false
                }
            }]);
        },
        basedOnCampaign: true,
        promotion: {
            enabled: false
        },
        campaign: {
            enabled: false
        }
    }]);
};

var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();

describe('int_eshopworld_core\cartridge\scripts\helper\orderConfirmationHelper.js', function () {
    var getEswOcHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', {
        'dw/system/Logger':  Logger,
        'dw/web/Cookie': Cookie,
        'dw/system/Transaction': Transaction,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/value/Money': Money,
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    overridePrice: function () {
                        return false;
                    },
                    setAllAvailablePriceBooks: function () {},
                    setBaseCurrencyPriceBook: function () {}
                }
            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        } else {
                            return 'true';
                        }
                    }
                };
            }
        },
        '*/cartridge/scripts/models/CartModel': {
            get: function () {
                return;
            }
        },
        'dw/util/Currency': Currency,
        'dw/util/StringUtils': StringUtils,
        '*/cartridge/scripts/util/collections': collections,
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/helper/eswCalculationHelper': {
            getEswCalculationHelper: {
                getSubtotalObject: function () {
                    return Money(true, request.httpCookies['esw.currency'].value);
                },
                getMoneyObject: function () {
                    return Money
                }
            }
        },
        '*/cartridge/scripts/helper/serviceHelper': {
            applyShippingMethod: function () {
                return null;
            }
        }
    }).getEswOcHelper();
    describe('Happy path', function () {
        it("it Should set override pricebook", function () {
            let getFinalOrderTotalsObject = getEswOcHelper.setOverridePriceBooks('CAD', 'USD', {});
            expect(getFinalOrderTotalsObject).to.equal(undefined);
        });
    });
    describe('Happy path', function () {
        it("it Should set applicable shipping method", function () {
            let getFinalOrderTotalsObject = getEswOcHelper.setApplicableShippingMethods(cart, 'POST', 'CAD', global.request);
            expect(getFinalOrderTotalsObject).to.equal(undefined);
        });
    });
});