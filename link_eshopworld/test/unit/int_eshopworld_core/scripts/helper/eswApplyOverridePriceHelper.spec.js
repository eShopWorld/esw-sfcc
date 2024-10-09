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
cart.shipments = [
    {shippingMethodID: ''}
]
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

describe('int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', function () {
    beforeEach(() => {
        var cookie = {
            httpCookies: {
                'esw.currency': {
                    value: 'CAD'
                },
                'esw.LanguageIsoCode': {
                    value: 'en_US'
                }
            }
        };

        global.request.httpCookies = cookie.httpCookies;
    });
    var eswCalculationHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper', {
        'dw/system/Logger':  Logger,
        'dw/web/Cookie': Cookie,
        'dw/system/Transaction': Transaction,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/value/Money': Money,
        'dw/content/ContentMgr': {},
        'dw/campaign/PromotionMgr': {},
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
        }
    }).getEswHelper;
    describe('Happy path', function () {
        it("it Should calculate and return override price", function () {
            let applyOverridePriceResponse = eswCalculationHelper.applyOverridePrice(10, 'US');
            expect(applyOverridePriceResponse).to.equal(10);
        });
    });
    describe('Happy path', function () {
        it("it Should calculate order discount", function () {
            let getOrderDiscount = eswCalculationHelper.getOrderDiscount(basketMgr.getCurrentBasket(), {});
            expect(getOrderDiscount.getCurrencyCode()).to.equal('CAD');
        });
    });
    describe('Happy path', function () {
        beforeEach(() => {
            var cookie = {
                httpCookies: {
                    'esw.currency': {
                        value: 'EUR'
                    },
                    'esw.LanguageIsoCode': {
                        value: 'en_US'
                    }
                }
            };
    
            global.request.httpCookies = cookie.httpCookies;
        });
        it("it Should calculate order discount for Dynamic Model", function () {
            let getOrderDiscount = eswCalculationHelper.getOrderDiscount(basketMgr.getCurrentBasket(), {});
            expect(getOrderDiscount.getCurrencyCode()).to.equal('EUR');
        });
    });
    describe("Sad Path", function () {
        it("Should throw error", function () {
            let getOrderDiscount = eswCalculationHelper.getOrderDiscount();
            expect(getOrderDiscount).to.equal(null);
        });
    });
    describe('Happy path', function () {
        it("it Should calculate order Total", function () {
            let getFinalOrderTotalsObject = eswCalculationHelper.getFinalOrderTotalsObject();
            expect(getFinalOrderTotalsObject).to.equal(null);
        });
    });
    describe("Sad Path", function () {
        it("Should throw error", function () {
            let getFinalOrderTotalsObject = eswCalculationHelper.getFinalOrderTotalsObject();
            expect(getFinalOrderTotalsObject).to.equal(null);
        });
    });
    describe("Sad Path", function () {
        it("Should throw error calculate price return numbered value", function () {
            let applyOverridePriceResponse = eswCalculationHelper.applyOverridePrice(null, false, false);
            expect(applyOverridePriceResponse).to.equal(0);
        });
    });
    describe('Happy path', function () {
        it("it Should confirm if delivery based coupon applied", function () {
            let getOrderDiscount = eswCalculationHelper.isDeliveryDiscountBasedOnCoupon(cart, '');
            expect(getOrderDiscount).to.equal(true);
        });
    });
    describe("Sad Path", function () {
        it("it Should confirm if delivery based coupon applied", function () {
            cart.defaultShipment.shippingPriceAdjustments = new ArrayList([{
                basedOnCoupon: false,
                basedOnCampaign: false,
                campaign: {
                    customerGroups: {
                        length: 0
                    }
                }
            }]);
            cart.getPriceAdjustments = function () {
                return new ArrayList([{
                    basedOnCoupon: false,
                    basedOnCampaign: false,
                    campaign: {
                        customerGroups: {
                            length: 0
                        }
                    }
                }]);
            };
            let getOrderDiscount = eswCalculationHelper.isDeliveryDiscountBasedOnCoupon(cart);
            expect(getOrderDiscount).to.equal(false);
        });
    });
    describe('Happy path', function () {
        it("it Should set base currency price Book", function () {
            global.session.setCurrency = function () {
                return;
            };
            eswCalculationHelper.setBaseCurrencyPriceBook('CAD');
        });
    });
});