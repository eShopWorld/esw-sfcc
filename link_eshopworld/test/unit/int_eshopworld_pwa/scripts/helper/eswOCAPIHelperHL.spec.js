
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');
var stubArrayList = sinon.mock();

const SiteMock = require('../../../../mocks/dw/system/Site');
const Basket = require('../../../../mocks/dw/order/Basket');
const Transaction = require('../../../../mocks/dw/system/Transaction');
var Money = require('../../../../mocks/dw.value.Money');
const ShippingMgr = require('../../../../mocks/dw/order/ShippingMgr');
var basketMgr = require('../../../../mocks/BasketMgr');
const LoggerMock = require('../../../../mocks/dw/system/Logger');
const collections = require('../../../../mocks/dw.util.CollectionHelper');
var orderMgrMock = require('../../../../mocks/dw/order/OrderMgr');
const empty = require('../../../../mocks/dw.global.empty');

var URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
var ResourceMock = require('../../../../mocks/dw/web/Resource');
global.empty = empty(global);
global.request.httpParameters = {
    'country-code': ['en-IE']
};
global.request.httpParameterMap = {
    'country-code': ['en-IE'],
    'requestBodyAsString': JSON.stringify({})
};
const localizeObj = {
    applyCountryAdjustments: true,
    localizeCountryObj: {
        currencyCode: 'EUR',
        countryCode: 'en-IE'
    },
    applyRoundingModel: 'false'
};

// Example order object
const order = {
    shipments: [
        {
            getID: () => 'shipment_1',  // Mocking a function to get the shipment ID
            productLineItems: [
                { productID: 'product_1' },  // Product IDs that match ESW package items
                { productID: 'product_2' }
            ]
        },
        {
            getID: () => 'shipment_2',
            productLineItems: [
                { productID: 'product_3' }
            ]
        }
    ]
};
describe('int_eshopworld_pwa/cartridge/scripts/helper/eswOCAPIHelperHL.js', function () {
    var eswOCAPIHelperHL = proxyquire('../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/helper/eswOCAPIHelperHL', {
        'dw/system/Site': SiteMock,
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/helper/eswCheckoutHelperHL': '',
        'dw/system/Logger': LoggerMock,
        'dw/util/ArrayList': stubArrayList,
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants'),
        '*/cartridge/scripts/helper/serviceHelperV3': {
            getLineItemsV3: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return {};
                        }
                        return 'true';
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
        },
        'dw/web/Resource': ResourceMock,
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants'),
        'dw/order/OrderMgr': orderMgrMock,
        '*/cartridge/scripts/helper/eswCoreApiHelper': {},
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () {
                return {
                    name: '',
                    countryCode: 'EUR'
                };
            },
            getContentAsset: function () {
                return '';
            },
            getCustomerCustomObject: function () {
                return {};
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelper': {
            getConvertedPrice: function () {
                return 1;
            },
            isShippingCostConversionEnabled: function () {
                return true;
            }
        },
        '*/cartridge/scripts/helper/eswHelperHL': {
            isProductRestricted: function () {
                return false;
            },
            isReturnProhibited: function () {
                return false;
            },
            applyShippingMethod: function () {
                return '';
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelperHL': '',
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCountryDetailByParam: function () {
                    return { countryCode: 'CA' };
                },
                getCountryLocalizeObj: function () {
                    return {};
                },
                checkIsEswAllowedCountry: function () {
                    return true;
                },
                getOverrideShipping: function () {
                    return [];
                },
                getMoneyObject: function () {
                    return Money;
                },
                removeThresholdPromo: function () {
                    return {};
                }
            }
        },
        '*/cartridge/scripts/helper/customizationHelper': {
            getDefaultShippingMethodID: function () {
                return 'defaultMethod';
            }
        },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': {
            calculateTotals: function () { return 0; },
            getMoneyObject: function () {
                return Money;
            }
        },
        'dw/system/Transaction': Transaction,
        'dw/order/ShippingMgr': ShippingMgr,
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/helpers/emailHelpers': {
            emailTypes: {
                registration: 'newtestAccount'
            },
            sendEmail: function () {
                return '';
            }
        },
        'dw/web/URLUtils': URLUtilsMock
    });
    // Unit test
    it('esw Pdp Price Conversions', function () {
        const scriptProduct = {
            price: '',
            priceMax: '',
            pricePerUnit: '',
            c_eswRestrictedProduct: '',
            c_eswRestrictedProductMsg: '',
            c_eswReturnProhibited: '',
            c_eswReturnProhibitedMsg: ''
        };
        let pdpPriceConversions = eswOCAPIHelperHL.eswPdpPriceConversions(scriptProduct, { price: 10 });
        expect(pdpPriceConversions).to.be.undefined;
    });
    it('esw plp Price Conversions', function () {
        let plpPriceConversions = eswOCAPIHelperHL.eswPlpPriceConversions({ price: 10 });
        expect(plpPriceConversions).to.be.undefined;
    });
    it('override price books', function () {
        let overridePriceBooks = eswOCAPIHelperHL.setOverridePriceBooks(Basket);
        expect(overridePriceBooks).to.be.undefined;
    });
    it('handle ESW orders response', function () {
        let handleEswPreOrderCall = eswOCAPIHelperHL.handleEswPreOrderCall(Basket, { c_eswPreOrderResponseStatus: '', c_eswPreOrderResponse: '' });
        expect(handleEswPreOrderCall).to.be.undefined;
    });
    it('handle basket ESW attributes', function () {
        let handleEswBasketAttributes = eswOCAPIHelperHL.handleEswBasketAttributes(Basket);
        expect(handleEswBasketAttributes).to.be.undefined;
    });
    it('handle order ESW attributes', function () {
        let handleEswOrderAttributes = eswOCAPIHelperHL.handleEswOrderAttributes(Basket);
        expect(handleEswOrderAttributes).to.be.undefined;
    });
    it('set override shipping methods', function () {
        ShippingMgr.getDefaultShippingMethod = function () {
            return {
                getID: function () {
                    return 'default';
                }
            };
        };
        let setDefaultOverrideShippingMethod = eswOCAPIHelperHL.setDefaultOverrideShippingMethod(Basket);
        expect(setDefaultOverrideShippingMethod).to.be.undefined;
    });
    it('modify basket items ocapi response', function () {
        global.request.httpParameters = {
            get: function () {
                return '';
            }
        };
        let basketItemsModifyResponse = eswOCAPIHelperHL.basketItemsModifyResponse(Basket, {}, '');
        expect(basketItemsModifyResponse).to.be.undefined;
    });
    it('modify order history call', function () {
        let handleEswOrdersHistoryCall = eswOCAPIHelperHL.handleEswOrdersHistoryCall({ count: 1, data: [Basket] });
        expect(handleEswOrdersHistoryCall).to.be.undefined;
    });
    it('update product prices', function () {
        const productItems = [{
            price: '',
            basePrice: '',
            priceAfterItemDiscount: '',
            priceAfterOrderDiscount: '',
            priceAdjustments: [],
            c_eswRestrictedProduct: '',
            c_eswReturnProhibited: '',
            c_eswReturnProhibitedMsg: ''
        }];
        let updateProductPrices = eswOCAPIHelperHL.updateProductPrices(productItems);
        expect(updateProductPrices).to.be.undefined;
    });
    it('update tracking number', function () {
        const shipments = [{
            trackingNumber: ''
        }];
        let updateTrackingNumber = eswOCAPIHelperHL.updateTrackingNumber(shipments, 'trackingnumber-73128');
        expect(updateTrackingNumber).to.be.undefined;
    });
    it('Calculated SubTotal', function () {
        const productItems = [{
            c_eswShopperCurrencyItemPriceInfo: 7,
            price: '',
            basePrice: '',
            priceAfterItemDiscount: '',
            priceAfterOrderDiscount: '',
            priceAdjustments: [],
            c_eswRestrictedProduct: '',
            c_eswReturnProhibited: '',
            c_eswReturnProhibitedMsg: '',
            quantity: 1
        }];
        let calculatedSubTotal = eswOCAPIHelperHL.getCalculatedSubTotal(productItems);
        expect(calculatedSubTotal).to.be.equals(7);
    });
    it('handle Esw Order Detail Call', function () {
        let handleEswOrderAttributes = eswOCAPIHelperHL.handleEswOrderDetailCall(Basket);
        expect(handleEswOrderAttributes).to.be.undefined;
    });
    it('handle Customer Post registration Response', function () {
        SiteMock.current = {
            getCustomPreferenceValue: function () {
                return '';
            }
        };
        const customer = {
            profile: {
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe'
            }
        };
        let handleCustomerPostResponse = eswOCAPIHelperHL.handleCustomerPostResponse(customer, { customer: customer });
        expect(handleCustomerPostResponse).to.be.undefined;
    });
    it.skip('adjust Threshold Discounts', function () {
        Basket.getAllShippingPriceAdjustments = function () {
            return [];
        };
        Basket.defaultShipment = {
            shippingAddress: {
                firstName: 'Amanda',
                lastName: 'Jones',
                address1: '65 May Lane',
                address2: '',
                city: 'Allston',
                postalCode: '02135',
                countryCode: { value: 'us' },
                phone: '617-555-1234',
                stateCode: 'MA',

                setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
                setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
                setAddress1: function (address1Input) { this.address1 = address1Input; },
                setAddress2: function (address2Input) { this.address2 = address2Input; },
                setCity: function (cityInput) { this.city = cityInput; },
                setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
                setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
                setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
                setPhone: function (phoneInput) { this.phone = phoneInput; }
            },
            getShippingLineItems: function name() {
                return new ArrayList([{}]);
            }
        };
        Basket.getAllLineItems = function () {
            return new ArrayList([{}]);
        };
        Basket.updateTotals = function () {
            return '';
        };
        let adjustThresholdDiscounts = eswOCAPIHelperHL.adjustThresholdDiscounts(Basket, localizeObj, {});
        chai.expect(adjustThresholdDiscounts).to.be.undefined;
    });
    describe('Happy Path', function () {
        it('handle Esw update EswPackage JSON', function () {
            // Example orderResponse object with ESW package JSON
            const orderResponse = {
                c_eswPackageJSON: JSON.stringify([
                    { productLineItem: 'product_1', packageInfo: 'Package info for product 1' },
                    { productLineItem: 'product_2', packageInfo: 'Package info for product 2' },
                    { productLineItem: 'product_3', packageInfo: 'Package info for product 3' }
                ])
            };
            eswOCAPIHelperHL.updateEswPackageJSON(order, orderResponse);
            expect(orderResponse).to.have.property('c_eswPackageJSON');
        });
    });
    describe('Sad Path', function () {
        it('handle Esw update EswPackage JSON', function () {
            // Example orderResponse object with ESW package JSON
            const orderResponse = {};
            eswOCAPIHelperHL.updateEswPackageJSON(order, orderResponse);
            expect(orderResponse).to.be.an('object');
        });
    });
    describe('updateShippingMethodSelection', function () {
        it('should set the default shipping method ID based on override country shipping methods', function () {
            // Mock dependencies
            const eswCoreHelper = {
                getCountryDetailByParam: () => ({ countryCode: 'US' }),
                getOverrideShipping: () => JSON.stringify([
                    {
                        countryCode: 'US',
                        shippingMethod: {
                            ID: ['POST_STANDARD', 'POST_EXPRESS']
                        }
                    }
                ])
            };

            const mockShippingMethodResult = {
                defaultShippingMethodId: null,
                applicableShippingMethods: [
                    { id: 'GROUND' },
                    { id: 'AIR' }
                ]
            };

            // Call the function
            eswOCAPIHelperHL.updateShippingMethodSelection.call({ eswCoreHelper }, mockShippingMethodResult);

            // Assertions
            expect(mockShippingMethodResult.defaultShippingMethodId).to.equal('GROUND');
        });
    });
    describe('Sad Path', function () {
        it('handle return undeined', () => {
            let result = eswOCAPIHelperHL.updateShippingMethodSelection.call();
            expect(result).to.be.undefined;
        });
    });
    describe('basketModifyBasketAfterCouponDelete', function () {
        it('should calculate totals and adjust discounts for fixed price model', function () {
            const mockBasket = {
                getAdjustedMerchandizeTotalPrice: function () { return []; },
                getAllShippingPriceAdjustments: function () { return []; }
            };

            const mockCountryDetail = { isFixedPriceModel: true };
            const mockCountryLocalizeObj = { applyRoundingModel: false };

            const basketCalculationHelpers = {
                calculateTotals: sinon.stub()
            };

            const OCAPIHelper = {
                adjustThresholdDiscounts: sinon.stub()
            };

            const removeThresholdPromo = sinon.stub();

            // Inline function to mimic country detail fetching
            const getCountryDetailByParam = () => mockCountryDetail;
            const getCountryLocalizeObj = () => mockCountryLocalizeObj;

            // Call the function
            eswOCAPIHelperHL.basketModifyBasketAfterCouponDelete(mockBasket);
        });
    });
});
