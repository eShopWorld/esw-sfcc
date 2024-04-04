
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

// Sample data
const Basket = require('../../../../mocks/dw/order/Basket');
Basket.getPriceAdjustments = function () { return []; };
Basket.getAllProductLineItems = function () { return []; };
Basket.getAllShippingPriceAdjustments = function () { return []; };
Basket.calculateTotals = function () { return 0; };

const collections = require('../../../../mocks/dw.util.CollectionHelper');
const SiteMock = require('../../../../mocks/dw/system/Site');
const Money = require('../../../../mocks/dw.value.Money');
const URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
const Logger = require('../../../../mocks/dw/system/Logger');
var ArrayList = require('../../../../mocks/dw.util.Collection');
const empty = require('../../../../mocks/dw.global.empty');
global.empty = empty(global);

global.request.httpParameters = {
    'country-code': ['en-IE']
};

describe('int_eshopworld_pwa/cartridge/scripts/helper/eswServiceHelperHL.js', function () {
    var eswServiceHelperHL = proxyquire('../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/helper/eswServiceHelperHL', {
        'dw/system/Logger': Logger,
        'dw/system/Site': SiteMock,
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {
                getConvertedPrice: function () { return 1; },
                getConversionPreference: function () { return {}; }
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelperHL': {
            getShopperCurrency: function () {
                return 'EUR';
            },
            isFixedPriceCountry: function () {
                return true;
            },
            getConvertedPrice: function () {
                return 15;
            },
            getConversionPreference: function () {
                return {};
            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled: function () {
                    return true;
                },
                getEswSessionTimeout: function () {
                    return 15;
                },
                getMoneyObject: function () {
                    return Money();
                },
                isEswRoundingsEnabled: function () {
                    return 'true';
                },
                applyRoundingModel: function () {
                    return 'price';
                },
                getOverrideShipping: function () {
                    return '';
                },
                isThresholdEnabled: function () {
                    return false;
                },
                getSelectedCountryDetail: function (shopperCountry) {
                    if (shopperCountry) {
                        return {
                            name: 'test',
                            defaultCurrencyCode: 'EUR',
                            isFixedPriceModel: true
                        };
                    }
                    return null;
                },
                getOverridePriceBooks: function (country) {
                    if (country) {
                        return ['test-pricebook'];
                    }
                    return [];
                },
                getPricingAdvisorData: function () {
                    return { fxRates: [{ toShopperCurrencyIso: 'EUR', fromRetailerCurrencyIso: 'USD' }] };
                },
                getBaseCurrencyPreference: function () {
                    return 'USD';
                },
                getOrderProratedDiscount: function () {
                    return 0;
                }
            }
        },
        '*/cartridge/scripts/helper/eswHelperHL': {
            getSubtotalObject: function () {
                return {
                    available: true,
                    value: '10.99',
                    getDecimalValue: function () { return '10.99'; },
                    getCurrencyCode: function () { return 'EUR'; },
                    subtract: function () { return new Money(isAvailable); }
                };
            },
            getOrderDiscount: function () {
                return {
                    available: true,
                    value: '10.99',
                    getDecimalValue: function () { return '15.99'; },
                    getCurrencyCode: function () { return 'EUR'; },
                    subtract: function () { return new Money(isAvailable); }
                };
            },
            getFinalOrderTotalsObject: function () {
                return {
                    available: true,
                    value: '10.99',
                    getDecimalValue: function () { return '12.99'; },
                    getCurrencyCode: function () { return 'EUR'; },
                    subtract: function () { return new Money(isAvailable); }
                };
            },
            adjustThresholdDiscounts: function () {
                return {};
            },
            getEswCartShippingCost: function () {
                return {
                    available: true,
                    value: '5.00',
                    getDecimalValue: function () { return '5.00'; },
                    getCurrencyCode: function () { return 'EUR'; },
                    subtract: function () { return new Money(isAvailable); }
                };
            },
            getProductLineMetadataItems: function () {
                return {};
            },
            isReturnProhibited: function () {
                return false;
            }
        },
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () {
                return {};
            },
            getCountryLocalizeObj: function () {
                return {
                    applyRoundingModel: ''
                };
            }
        },
        'dw/order/BasketMgr': Basket,
        '*/cartridge/scripts/util/Constants': '',
        'dw/web/URLUtils': URLUtilsMock,
        '*/cartridge/scripts/util/collections': collections,
        'dw/campaign/Discount': {
            TYPE_FREE: null
        },
        '*/cartridge/scripts/helper/serviceHelperV3': {
        },
        '*/cartridge/scripts/helper/customizationHelper': {
            getProductImage: function () {
                return 'test image';
            }
        }
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
        const localizeObj = {
            applyCountryAdjustments: true,
            localizeCountryObj: {
                currencyCode: 'EUR',
                countryCode: 'en-IE'
            },
            applyRoundingModel: 'false'
        };
        let shopperCheckoutExperience = eswServiceHelperHL.getDeliveryDiscounts(Basket, false, localizeObj, {});
        expect(shopperCheckoutExperience).to.have.property('ShippingDiscounts');
    });
});
