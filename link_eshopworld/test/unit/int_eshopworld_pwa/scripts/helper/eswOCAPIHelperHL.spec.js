
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../mocks/dw/system/Site');
const Basket = require('../../../../mocks/dw/order/Basket');
const Transaction = require('../../../../mocks/dw/system/Transaction');
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
        'dw/web/Resource': ResourceMock,
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
                    return {countryCode: 'CA'};
                },
                getCountryLocalizeObj: function () {
                    return {};
                },
                checkIsEswAllowedCountry: function () {
                    return true;
                },
                getOverrideShipping: function () {
                    return [];
                }
            }
        },
        '*/cartridge/scripts/helper/customizationHelper': {
            getDefaultShippingMethodID: function () {
                return 'defaultMethod';
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
    it('esw Pdp Price Conversions', () => {
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
    it('esw plp Price Conversions', () => {
        let plpPriceConversions = eswOCAPIHelperHL.eswPlpPriceConversions({ price: 10 });
        expect(plpPriceConversions).to.be.undefined;
    });
    it('override price books', () => {
        let overridePriceBooks = eswOCAPIHelperHL.setOverridePriceBooks(Basket);
        expect(overridePriceBooks).to.be.undefined;
    });
    it('handle ESW orders response', () => {
        let handleEswPreOrderCall = eswOCAPIHelperHL.handleEswPreOrderCall(Basket, { c_eswPreOrderResponseStatus: '', c_eswPreOrderResponse: '' });
        expect(handleEswPreOrderCall).to.be.undefined;
    });
    it('handle basket ESW attributes', () => {
        let handleEswBasketAttributes = eswOCAPIHelperHL.handleEswBasketAttributes(Basket);
        expect(handleEswBasketAttributes).to.be.undefined;
    });
    it('handle order ESW attributes', () => {
        let handleEswOrderAttributes = eswOCAPIHelperHL.handleEswOrderAttributes(Basket);
        expect(handleEswOrderAttributes).to.be.undefined;
    });
    it('set override shipping methods', () => {
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
    it('modify basket items ocapi response', () => {
        global.request.httpParameters = {
            get: function () {
                return '';
            }
        };
        let basketItemsModifyResponse = eswOCAPIHelperHL.basketItemsModifyResponse(Basket, {}, '');
        expect(basketItemsModifyResponse).to.be.undefined;
    });
    it('modify order history call', () => {
        let handleEswOrdersHistoryCall = eswOCAPIHelperHL.handleEswOrdersHistoryCall({ count: 1, data: [Basket] });
        expect(handleEswOrdersHistoryCall).to.be.undefined;
    });
    it('update product prices', () => {
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
    it('update tracking number', () => {
        const shipments = [{
            trackingNumber: ''
        }];
        let updateTrackingNumber = eswOCAPIHelperHL.updateTrackingNumber(shipments, 'trackingnumber-73128');
        expect(updateTrackingNumber).to.be.undefined;
    });
    it('Calculated SubTotal', () => {
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
    it('handle Esw Order Detail Call', () => {
        let handleEswOrderAttributes = eswOCAPIHelperHL.handleEswOrderDetailCall(Basket);
        expect(handleEswOrderAttributes).to.be.undefined;
    });
    it('handle Customer Post registration Response', () => {
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
    it.skip('adjust Threshold Discounts', () => {
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
        it('handle Esw update EswPackage JSON', () => {
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
        it('handle Esw update EswPackage JSON', () => {
            // Example orderResponse object with ESW package JSON
            const orderResponse = {};
            eswOCAPIHelperHL.updateEswPackageJSON(order, orderResponse);
            expect(orderResponse).to.be.an('object');
        });
    });
});
