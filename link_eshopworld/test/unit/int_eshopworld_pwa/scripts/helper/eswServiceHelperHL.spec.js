var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');
// Sample data
const Basket = require('../../../../mocks/dw/order/Basket');
Basket.getPriceAdjustments = function () { return []; };
Basket.getAllProductLineItems = function () { return []; };
Basket.getAllShippingPriceAdjustments = function () { return []; };
Basket.calculateTotals = function () { return 0; };

const collections = require('../../../../mocks/dw.util.CollectionHelper');
const SiteMock = require('../../../../mocks/dw/system/Site');
const Money = require('../../../../mocks/dw.value.Money');
var session = require('../../../../mocks/dw/system/Session');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var Currency = require('../../../../mocks/dw/util/Currency');
const URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
const Logger = require('../../../../mocks/dw/system/Logger');
var ArrayList = require('../../../../mocks/dw.util.Collection');
const empty = require('../../../../mocks/dw.global.empty');

var stubTransaction = sinon.stub();
var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();
global.empty = empty(global);

global.request.httpParameters = {
    'country-code': ['en-IE']
};

let MoneyObj = {
    available: true,
    value: '10.99',
    getDecimalValue: function () { return '10.99'; },
    getCurrencyCode: function () { return ''; },
    subtract: function () { return new Money(true); },
    toFixed: '10.99'
};

describe('int_eshopworld_pwa/cartridge/scripts/helper/eswServiceHelperHL.js', function () {
    var serviceHelperV3 = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3', {
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () { return null; }
        },
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
                },
                getSubtotalObject: function () {
                    return {
                        available: true,
                        value: '10.99',
                        getDecimalValue: function () { return '10.99'; },
                        getCurrencyCode: function () { return 'USD'; },
                        subtract: function () { return new Money(isAvailable); }
                    };
                },
                isThresholdEnabled: function () {
                    return true;
                },
                getDeliveryDiscountsPriceFormat: function () {
                    return 14;
                },
                getDeliveryDiscountsCurrencyCode: function () {
                    return "EUR";
                }
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelper': '',
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
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
        'dw/util/Currency': Currency,
        'dw/util/StringUtils': StringUtils,
        '*/cartridge/scripts/util/collections': collections,
        'dw/order/BasketMgr': Basket
    });

    // Unit test
    it('returns delivery discounts', () => {
        Basket.defaultShipment = {
            shippingTotalNetPrice: 10,
            shippingPriceAdjustments: new ArrayList([{
                UUID: 12029384756,
                calloutMsg: 'some call out message',
                basedOnCoupon: false,
                price: { value: 'some value', currencyCode: 'usd' },
                lineItemText: 'someString',
                promotion: { calloutMsg: 'some call out message' },
                appliedDiscount: {
                    type: 'discount'
                },
                custom: {}
            }])
        };
        MoneyObj.value = {
            toFixed: function (amount) {
                return '10.99';
            }
        };
        const localizeObj = {
            applyCountryAdjustments: true,
            localizeCountryObj: {
                currencyCode: 'EUR',
                countryCode: 'en-IE'
            },
            applyRoundingModel: 'false'
        };
        let shopperCheckoutExperience = serviceHelperV3.getDeliveryDiscounts(Basket, false, localizeObj, {});
        expect(shopperCheckoutExperience).to.have.property('ShippingDiscounts');
    });
});