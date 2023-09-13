/* eslint-disable quotes */
/* eslint-disable object-curly-spacing */
/* eslint-disable comma-spacing */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var collections = require('../../../../mocks/dw.util.Collection');
var basketMgr = require('../../../../mocks/BasketMgr');
var empty = require('../../../../mocks/dw.global.empty');
var Session = require('../../../../mocks/dw/system/Session');

var reqPayload = {
    contactDetails: [{
        contactDetailsType: 'isDelivery',
        email: 'test@this.getCustomerEmail.com',
        country: 'US',
        metadataItems: 'eswMarketingOptIn|eswMarketingOptIn'
    }],
    retailerPromoCodes: [],
    cartDiscountPriceInfo: {
        price: {
            currency: 'some code',
            amount: 23.05
        },
        discounts: ['some object']
    },
    pricingSynchronizationId: null,
    deliveryCountryIso: 'US',
    retailerCheckoutExperience: {
        metadataItems: []
    },
    shopperCheckoutExperience: {
        useDeliveryContactDetailsForPaymentContactDetails: true,
        emailMarketingOptIn: true,
        registeredProfileId: 'customer number',
        shopperCultureLanguageIso: 'iso test code',
        expressPaymentMethod: null,
        metadataItems: [],
        registration: '',
        sessionTimeout: 'timeout time'
    },
    deliveryOptions: null,
    lineItems: [],
    shopperCurrencyIso: "USD"
};

var reqPayload2 = {
    contactDetails: [{
        contactDetailsType: 'isDelivery',
        email: 'test@this.getCustomerEmail.com',
        country: 'US',
        metadataItems: 'eswMarketingOptIn|eswMarketingOptIn'
    }],
    retailerPromoCodes: [],
    cartDiscountPriceInfo: {
        price: {
            currency: 'some code',
            amount: 23.05
        },
        discounts: ['some object']
    },
    pricingSynchronizationId: null,
    deliveryCountryIso: 'US',
    retailerCheckoutExperience: {
        metadataItems: []
    },
    shopperCheckoutExperience: {
        useDeliveryContactDetailsForPaymentContactDetails: true,
        emailMarketingOptIn: true,
        registeredProfileId: 'customer number',
        shopperCultureLanguageIso: 'iso test code',
        expressPaymentMethod: null,
        metadataItems: [],
        registration: '',
        sessionTimeout: 'timeout time'
    },
    deliveryOptions: null,
    lineItems: [],
    shopperCurrencyIso: "CAD"
};

global.empty = empty(global);
Session.getCurrency = function () {
    return {
        currencyCode: 'USD'
    };
};
global.session = Session;

var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();

describe.skip('int_eshopworld_core/cartridge/scripts/helper/serviceHelper.js', function () {
    afterEach(() => {
        delete global.session.getCurrency();
        Session.getCurrency = function () {
            return {
                currencyCode: 'CAD'
            };
        };
        global.session = Session;
    });
    var preparePreOrder = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelper', {
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    getMoneyObject: function () {
                        return Money();
                    },
                    isEswRoundingsEnabled: function () {
                        return 'true';
                    },
                    applyRoundingModel: function () {
                        return 'price';
                    },
                    getCheckoutServiceName: function () {
                        return ['EswCheckoutV3Service'];
                    },
                    getOrderDiscount: function () {
                        return '$10'
                    },
                    getSubtotalObject: function () {
                        return Money();
                    },
                    getMappedCustomerMetadata: function () {
                        return 'eswMarketingOptIn|eswMarketingOptIn'
                    },
                    getUrlExpansionPairs: function () {
                        return null;
                    },
                    getMetadataItems: function () {
                        return null;
                    },
                    getSelectedInstance: function () {
                        return ''
                    },
                    getMappedBasketMetadata: function () {
                        return 'some  site meta'
                    },
                    isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled: function () {
                        return 'false'
                    },
                    getOverrideShipping: function () {
                        return '';
                    },
                    getAvailableCountry: function () {
                        return 'some country'
                    }
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
        'dw/web/URLAction': function () {
            return 'some url'
        },
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': {
			https: function() {
                return {};
            }
		},
        'dw/order/ShippingMgr': {
            getDefaultShippingMethod: function () {
                return defaultShippingMethod;
            },
            getShipmentShippingModel: function (shipment) {
                return createShipmentShippingModel(shipment);
            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return {}
                        } else {
                            return 'true';
                        }
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
        '*/cartridge/scripts/util/collections': {
            forEach: function () {
                return collections.forEach;
            }
        },
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/helper/serviceHelperV3': {
            getLineItemsV3: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return {}
                        } else {
                            return 'true';
                        }
                    },
                    lineItems: []
                };
            },
            getCartDiscountPriceInfo: function () {
                return {
                    price: {
                        currency: 'some code',
                        amount: 23.05
                    },
                    discounts: ['some object']
                };
            },
            getShopperCheckoutExperience: function () {
                return {
                    useDeliveryContactDetailsForPaymentContactDetails: true,
                    emailMarketingOptIn: true,
                    registeredProfileId: 'customer number',
                    shopperCultureLanguageIso: 'iso test code',
                    expressPaymentMethod: null,
                    metadataItems: [],
                    registration: '',
                    sessionTimeout: 'timeout time'
                };
            },
            getRetailerCheckoutMetadataItems: function () {
                return [];
            }
        }
    });
    describe('Happy path', function () {
        it('Should prepare pre order V3 payload', function () {
            let prderPayload = preparePreOrder.preparePreOrder();
            expect(prderPayload).to.deep.equal(reqPayload);
        });
        it('it Should have checkout experience V3', function () {
            let prderPayload = preparePreOrder.preparePreOrder();
            expect(prderPayload).to.deep.equal(reqPayload2);
        });
    });
    describe('Sad Path', function () {
        it('V3 Should throw error', function () {
            let prderPayload = preparePreOrder.preparePreOrder();
            expect(prderPayload).to.throw;
        });
    });
});