
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const Basket = require('../../../../mocks/dw/order/Basket');
const SiteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var LocalServiceRegMock = require('../../../../mocks/dw/svc/LocalServiceRegistry');
const collections = require('../../../../mocks/dw.util.CollectionHelper');
var PaymentMgr = require('../../../../mocks/dw/order/PaymentMgr');

describe('int_eshopworld_pwa/cartridge/scripts/helper/eswCheckoutHelperHL.js', function () {
    var eswCheckoutHelperHL = proxyquire('../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/helper/eswCheckoutHelperHL', {
        'dw/system/Site': SiteMock,
        'dw/system/Logger': Logger,
        'dw/web/URLUtils': '',
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () {
                return {};
            },
            getCountryLocalizeObj: function () {
                return {};
            },
            getPwaShopperUrl: function () {
                return 'test url';
            }
        },
        '*/cartridge/scripts/services/EswCoreService': {
            getEswServices: function () {
                return {
                    getOAuthService: function () {
                        return {
                            call: function () {
                                return {};
                            }
                        };
                    }
                };
            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getMoneyObject: function () {
                    return Money();
                },
                getCheckoutServiceName: function () {
                    return 'testService';
                },
                isEswRoundingsEnabled: function () {
                    return 'true';
                },
                applyRoundingModel: function () {
                    return 'price';
                },
                getClientID: function () {
                    return 'testId';
                },
                getClientSecret: function () {
                    return 'testsecret';
                },
                getOverrideShipping: function () {
                    return '';
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
                getPricingSynchronizationId: function () {
                    return 'testId';
                },
                getPwaUrlExpansionPairs: function () {
                    return {};
                },
                getMetadataItems: function () {
                    return {};
                },
                getSelectedInstance: function () {
                    return '';
                },
                isCheckoutRegisterationEnabled: function () {
                    return false;
                }
            }
        },
        'dw/svc/LocalServiceRegistry': LocalServiceRegMock,
        '*/cartridge/scripts/helper/eswServiceHelperHL': {
            getLineItemsV3: function () {
                return {};
            },
            getShopperCheckoutExperience: function () {
                return {
                    registration: {
                        showRegistration: '',
                        registrationUrl: ''
                    }
                };
            }
        },
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/helper/serviceHelperV3': {},
        '*/cartridge/scripts/helper/serviceHelper': {},
        '*/cartridge/scripts/helper/eswPricingHelperHL': {},
        'dw/order/PaymentMgr': PaymentMgr,
        '*/cartridge/scripts/helper/eswHelperHL': {
            getOrderDiscount: function () {
                return '';
            }
        }
    });
    // Unit test
    it('call Esw Checkout API', () => {
        // service call not happening due to due response is not
        Basket.custom = {};
        let callEswCheckoutAPI = eswCheckoutHelperHL.callEswCheckoutAPI(Basket, 'en-IE', 'EUR', {});
        expect(callEswCheckoutAPI).to.be.null;
    });
    it('set Esw Basket Attributes', () => {
        const localizeObj = {
            applyCountryAdjustments: true,
            localizeCountryObj: {
                currencyCode: 'EUR',
                countryCode: 'en-IE'
            },
            applyRoundingModel: 'false'
        };
        Basket.productQuantityTotal = 0;
        let eswBasketAttributes = eswCheckoutHelperHL.setEswBasketAttributes(Basket, localizeObj, {});
        expect(eswBasketAttributes).to.be.undefined;
    });
    it('set Esw order Attributes', () => {
        const localizeObj = {
            applyCountryAdjustments: true,
            localizeCountryObj: {
                currencyCode: 'EUR',
                countryCode: 'en-IE'
            },
            applyRoundingModel: 'false'
        };
        Basket.paymentInstruments = [{
            getPaymentMethod: function () {
                return 'paymentInstruments';
            },
            paymentTransaction: {
                paymentProcessor: ''
            }
        }];
        let eswOrderAttributes = eswCheckoutHelperHL.setEswOrderAttributes(Basket, localizeObj, {});
        expect(eswOrderAttributes).to.be.undefined;
    });
    it('set Override Shipping Methods', () => {
        const localizeObj = {
            applyCountryAdjustments: true,
            localizeCountryObj: {
                currencyCode: 'EUR',
                countryCode: 'en-IE'
            },
            applyRoundingModel: 'false'
        };
        let overrideShippingMethods = eswCheckoutHelperHL.setOverrideShippingMethods(Basket, localizeObj, {});
        expect(overrideShippingMethods).to.be.undefined;
    });
});
