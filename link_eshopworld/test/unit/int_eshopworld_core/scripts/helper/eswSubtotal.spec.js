var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');

var Money = require('../../../../mocks/dw.value.Money');
var ArrayList = require('../../../../mocks/dw.util.Collection');
var collections = require('../../../../mocks/dw.util.Collection');
var basketMgr = require('../../../../mocks/BasketMgr');

var rememberMeCookie = {
    'esw.LanguageIsoCode': {
        value: 'en_US'
    },
    'esw.location': {
        value: 'US'
    }
};

var request = {
    httpCookies: {
        'esw.currency': {
            value: 'USD'
        },
        'esw.LanguageIsoCode': {
            value: 'en_US'
        }
    },
    getHttpCookies: function () {
        return rememberMeCookie;
    }
};

global.request = request;


var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();

var productLineItems1 = new ArrayList([{
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
    custom: {},
    productID: 'someID',
    quantityValue: 2
}]);


var createApiBasket = function (isAvailable) {
    return {
        totalGrossPrice: new Money(isAvailable),
        totalTax: new Money(isAvailable),
        shippingTotalPrice: new Money(isAvailable),
        getAdjustedMerchandizeTotalPrice: function () {
            return new Money(isAvailable);
        },
        adjustedShippingTotalPrice: new Money(isAvailable),
        basePrice: { value: 'some value', currencyCode: 'USD' },
        quantity: { value: 'some value', currencyCode: 'USD' },
        getAdjustedPrice: function () {
            return {
                getValue: function () {
                    return 'some value';
                },
                currencyCode: 'USD'
            };
        },
        productLineItems: productLineItems1,
        couponLineItems: new ArrayList([
            {
                UUID: 1234567890,
                couponCode: 'some coupon code',
                applied: true,
                valid: true,
                priceAdjustments: new ArrayList([{
                    promotion: { calloutMsg: 'some call out message' }
                }])
            }
        ]),
        priceAdjustments: new ArrayList([{
            UUID: 10987654321,
            calloutMsg: 'some call out message',
            basedOnCoupon: false,
            price: { value: 'some value', currencyCode: 'USD' },
            lineItemText: 'someString',
            promotion: { calloutMsg: 'some call out message' }
        },
        {
            UUID: 10987654322,
            calloutMsg: 'price adjustment without promotion msg',
            basedOnCoupon: false,
            price: { value: 'some value', currencyCode: 'USD' },
            lineItemText: 'someString'
        }]),
        allShippingPriceAdjustments: new ArrayList([{
            UUID: 12029384756,
            calloutMsg: 'some call out message',
            basedOnCoupon: false,
            price: { value: 'some value', currencyCode: 'USD' },
            lineItemText: 'someString',
            promotion: { calloutMsg: 'some call out message' }
        }])
    };
};

describe('int_eshopworld_core/cartridge/scripts/helper/eswCalculationHelper.js', function () {
    var eswCoreHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCalculationHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {},
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getMoneyObject: function () {
                    return Money();
                },
                isEswRoundingsEnabled: function () {
                    return 'true';
                },
                applyRoundingModel: function () {
                    return 'price';
                }
            }
        },
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': {
            debug: function (text) {
                return text;
            },
            error: function (text) {
                return text;
            }
        },
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        }
                        return 'true';
                    }
                };
            }
        },
        'dw/util/Currency': {
            getCurrency: function () {
                return 'currency';
            }
        },
        'dw/util/StringUtils': {
            formatMoney: function () {
                return 'formatted money';
            }
        },
        '*/cartridge/scripts/util/collections': collections,
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants')
    }).getEswCalculationHelper;
    describe('Happy path', function () {
        it('it Should calculate basket total availablity', function () {
            let basket = createApiBasket();
            let basketSubtotal = eswCoreHelper.getSubtotalObject(basket, false, false, false);
            expect(basketSubtotal).to.be.false;
        });
        it('it Should calculate basket total value', function () {
            let basket = createApiBasket();
            let basketSubtotal = eswCoreHelper.getSubtotalObject(basket, false, false, false);
            expect(basketSubtotal).to.be.false;
        });
    });
    describe('Sad Path', function () {
        it('Should throw error', function () {
            let basket;
            let basketSubtotal = eswCoreHelper.getSubtotalObject(basket, null, null, null);
            expect(basketSubtotal).to.throw;
        });
    });
});
