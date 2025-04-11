var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');
var ArrayList = require('../../../../mocks/dw.util.CollectionHelper');
const URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
const getShipmentShippingAddressStub = sinon.stub();


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var CustomObjectMgr = require('../../../../mocks/dw/object/CustomObjectMgr');
var PriceBookMgrMock = require('../../../../mocks/dw/catalog/PriceBookMgr');
const Basket = require('../../../../mocks/dw/order/Basket');
const getShopperCurrencyStub = sinon.stub().returns('USD');

const RequestMock = require('../../../../mocks/dw/system/Request');

const localizeObj = {
    applyCountryAdjustments: true,
    localizeCountryObj: {
        currencyCode: 'EUR',
        countryCode: 'en-IE'
    },
    applyRoundingModel: 'false'
};
global.empty = empty(global);

global.empty = empty(global);
var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: ''
    }
};

var globalResponse = {
    setStatus: function () {
        return '401';
    }
};

let lineItemContainer = {};
lineItemContainer.shippingTotalPrice = {
    subtract: function () {
        return 10;
    }
};
lineItemContainer.adjustedShippingTotalPrice = 10;
lineItemContainer.getAdjustedMerchandizeTotalPrice = function (val) {
    if (!val) {
        return {
            subtract: function () {
                return 10;
            }
        };
    } else {
        return 10;
    }
};

global.session = session;
global.response = globalResponse;
global.dw = {
    system: {
        HookMgr: {
            callHook: function () {
                return null;
            }
        }
    }
};
var LocalServiceRegMock = require('../../../../mocks/dw/svc/LocalServiceRegistry');
const Constants = require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants');
describe('/link_eshopworld/cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', function () {
    var eswHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', {
        '*/cartridge/scripts/util/collections': ArrayList,
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': {
            https: sinon.stub().returns({
                toString: sinon.stub().returns('https://mocked-url')
            })
        },
        checkRedirect: function () {},
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        } else {
                            return undefined;
                        }
                    }
                };
            }
        },
        '*/cartridge/scripts/helper/eckoutHelper': {
            'eswEmbCheckoutHelper': {
                getEswEmbCheckoutScriptPath: function () {
                    return true;
                }
            }
        },
        '*/cartridge/scripts/helper/serviceHelper': {
            failOrder: function () { return ''; },
            getShipmentShippingAddress: function () { return {
                setFirstName: sinon.stub(),
                setLastName: sinon.stub(),
                setCountryCode: sinon.stub(),
                setCity: sinon.stub()
            }; },
            getNonGiftCertificateAmount: function () { return ''; }
        },
        'dw/util/StringUtils': StringUtils,
        'dw/svc/LocalServiceRegistry': LocalServiceRegMock,
        '*/cartridge/scripts/util/Constants': Constants,
        'dw/object/CustomObjectMgr': CustomObjectMgr,
        'dw/content/ContentMgr': {},
        'dw/catalog/PriceBookMgr': PriceBookMgrMock,
        'dw/web/URLAction': function () {
            return 'some url';
        },
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    getRedirect: function () { return {}; },
                    getEShopWorldModuleEnabled: function () { return true; },
                    getOverrideCountry: function () { return 'country list'; },
                    getAvailableCountry: function () { return 'country'; },
                    getCurrentEswCurrencyCode: function () { return 'currency'; },
                    getOverridePriceBooks: function () { return {}; }
                };
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
                    },
                    getPreorderServiceV2: function () { return '' },
                };
            }
        },
        'dw/web/URLParameter': '',
        '*/cartridge/scripts/helper/eswOrderProcessHelper': {
            cancelAnOrder: function () {
                return {
                    success: 'orderProcess'
                };
            }
        },
        getBaseCurrencyPreference: function () {
            return 'EUR';
        },
        isEswCatalogFeatureEnabled: function () { return true; },
        '*/cartridge/scripts/helper/eswCalculationHelper': {
            getEswCalculationHelper: {
                getSubtotalObject: function () {
                    return Money(true, request.httpCookies['esw.currency'].value);
                },
                getMoneyObject: function () {
                    return Money;
                }
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {
                getShopperCurrency: function () {
                    return getShopperCurrencyStub;
                }
            }
        },
        '*/cartridge/scripts/jwt/eswJwtHelpers': {
            eswPricingHelper: function () {
                return true;
            }
        },
        getCatalogUploadMethod: function () { return 'API'; }
    }).getEswHelper;
    describe('Happy path', function () {
        it('Should getPaVersion', function () {
            let paVersion = eswHelper.getPaVersion();
            chai.expect(paVersion).to.equals(Constants.UNKNOWN);
        });
        it('should not throw an error when the reqObj has retailerCartId, lineItems, and deliveryCountryIso', function () {
            // Create a valid reqObj
            const validReqObj = {
                retailerCartId: '123456',
                lineItems: [{ sku: 'ABC', quantity: 1 }],
                deliveryCountryIso: 'US'
            };
            // Call the validatePreOrder function with the valid reqObj
            expect(() => eswHelper.validatePreOrder(validReqObj)).to.not.throw();
        });
        it('Should check if same geo IP country', function () {
            it('Should check if geo location and cookie are same', function () {
                global.request = {
                    geolocation: {
                        countryCode: 'IE'
                    },
                    httpCookies: { 'esw.location': { value: 'IE' } }
                };
                eswHelper.checkIsEswAllowedCountry = function () { return true; };
                let isSameGeoLocation = eswHelper.isSameGeoIpCountry();
                chai.expect(isSameGeoLocation).to.deep.equal({ isSameCountry: true, geoLocation: 'IE' });
            });
            it('Should check if geo location and cookie are different', function () {
                global.request = {
                    geolocation: {
                        countryCode: 'GB'
                    },
                    httpCookies: { 'esw.location': { value: 'IE' } }
                };
                eswHelper.checkIsEswAllowedCountry = function () { return true; };
                let isSameGeoLocation = eswHelper.isSameGeoIpCountry();
                chai.expect(isSameGeoLocation).to.deep.equal({ isSameCountry: true, geoLocation: 'IE' });
            });
            it('Should check if geo location and cookie are different but country not supported', function () {
                global.request = {
                    geolocation: {
                        countryCode: 'GB'
                    },
                    httpCookies: { 'esw.location': { value: 'IE' } }
                };
                eswHelper.checkIsEswAllowedCountry = function () { return true; };
                let isSameGeoLocation = eswHelper.isSameGeoIpCountry();
                chai.expect(isSameGeoLocation).to.deep.equal({ isSameCountry: true, geoLocation: null });
            });
            it('Should check if geo location and cookie are different but country is supported', function () {
                global.request = {
                    geolocation: {
                        countryCode: 'GB'
                    },
                    httpCookies: { 'esw.location': { value: 'AU' } }
                };
                eswHelper.checkIsEswAllowedCountry = function () { return true; };
                let isSameGeoLocation = eswHelper.isSameGeoIpCountry();
                chai.expect(isSameGeoLocation).to.deep.equal({ isSameCountry: true, geoLocation: 'GB' });
            });
        });
    });
    it('Returns basket subtotal amount', function () {
        Basket.quantity = {
            value: 10
        };
        let subtotalObject = eswHelper.getSubtotalObject(Basket, true, true, true, localizeObj);
        expect(subtotalObject).to.have.property('available');
    });
    it('Should return undefined on isEswCatalogApiMethod', function () {
        let result = eswHelper.isEswCatalogApiMethod();
        chai.expect(result).to.be.undefined;
    });
    it('Should throw an error with message SFCC_ORDER_CREATION_FAILED when the reqObj has no retailerCartId', function () {
        // Create an invalid reqObj with no retailerCartId
        const invalidReqObj = {
            lineItems: [{ sku: 'ABC', quantity: 1 }],
            deliveryCountryIso: 'US'
        };
        // Stub the session.privacy.eswRetailerCartIdNullException property
        eswHelper.getCheckoutServiceName = function () { return 'EswCheckoutV3Service'; };
        expect(() => eswHelper.validatePreOrder(invalidReqObj)).to.throw('SFCC_ORDER_CREATION_FAILED');
    });
    it('Should throw an error with message ATTRIBUTES_MISSING_IN_PRE_ORDER when the reqObj has no lineItems or deliveryCountryIso', function () {
        // Create an invalid reqObj with no lineItems or deliveryCountryIso
        const invalidReqObj = {
            retailerCartId: '123456'
        };
        // Call the validatePreOrder function with the invalid reqObj and expect an error
        eswHelper.getCheckoutServiceName = function () { return 'EswCheckoutV3Service'; };
        expect(() => eswHelper.validatePreOrder(invalidReqObj)).to.throw('ATTRIBUTES_MISSING_IN_PRE_ORDER');
    });
    it('Returns Promo Threshold Amount', function () {
        let promotion = {
            custom: {
                eswMinThresholdAmount: [
                    '3:2'
                ]
            }
        };
        let promoThresholdAmount = eswHelper.getPromoThresholdAmount(10, promotion);
        chai.expect(promoThresholdAmount).to.equals('2');
    });
    describe('getCatalogUploadMethod()', function () {
        it('should return `API` if the service URL contains `/RetailerCatalog`', function () {
            const serviceUrl = 'https://esw.example.com/RetailerCatalog/v4/RetailerCatalog';
            const uploadMethod = eswHelper.getCatalogUploadMethod(serviceUrl);

            expect(uploadMethod).to.equal(Constants.UNKNOWN);
        });
        it('should return `SFTP` if the service URL does not contain `/RetailerCatalog`', function () {
            const serviceUrl = 'https://esw.example.com/v4';
            const uploadMethod = eswHelper.getCatalogUploadMethod(serviceUrl);
            expect(uploadMethod).to.equal(Constants.UNKNOWN);
        });
        it('should return `UNKNOWN` if the service URL is empty or undefined', function () {
            const serviceUrl = '';
            const uploadMethod = eswHelper.getCatalogUploadMethod(serviceUrl);
            expect(uploadMethod).to.equal(Constants.UNKNOWN);
        });
    });
    describe('getEShopWorldModuleEnabled()', function () {
        it('should return boolean response`', function () {
            const uploadMethod = eswHelper.getEShopWorldModuleEnabled();

            expect(uploadMethod).to.equal(undefined);
        });
    });
    describe('getEswCatalogFeedProductCustomAttrFieldMapping()', function () {
        it('should return boolean response`', function () {
            const uploadMethod = eswHelper.getEswCatalogFeedProductCustomAttrFieldMapping();

            expect(uploadMethod).to.equal(undefined);
        });
    });
    describe('getAllCountries', function () {
        it('should return an array of country objects', function () {
            const countries = eswHelper.getAllCountries();
            expect(countries).to.be.an('array');
        });
    });
    describe('getAllowedCurrencies', function () {
        it('should return an array of all country', function () {
            const countries = eswHelper.getAllowedCurrencies();
            expect(countries).to.be.an('array');
        });
    });
    describe('getOverridePriceBooks', function () {
        it('should return an array of price books', function () {
            const allCountries = eswHelper.getOverridePriceBooks();
            expect(allCountries).to.be.an('array');
        });
    });
    describe('getPriceBookCurrency', function () {
        it('should return an array of price book currency', function () {
            const priceBookCurrency = eswHelper.getPriceBookCurrency('test');
            expect(priceBookCurrency).to.be.null;
        });
    });
    describe('getSubtotalObject', function () {
        it('should return money object', function () {
            const subtotalObject = eswHelper.getSubtotalObject();
            expect(subtotalObject).to.have.property('available');
        });
    });
    describe('setLocation', function () {
        it('should set location', function () {
            eswHelper.setLocation();
        });
    });
    describe('getSelectedCountryProductPrice', function () {
        it('should return product price object', function () {
            const productPrice = eswHelper.getSelectedCountryProductPrice(15, 'USD');
            expect(productPrice).to.have.property('currency');
        });
    });
    describe('strToJson', function () {
        it('should return object', function () {
            const strToJson = eswHelper.strToJson('{"test":"test"}');
            expect(strToJson).to.have.property('test');
        });
    });
    describe('isValidJson', function () {
        it('should return boolean', function () {
            const isValidJson = eswHelper.isValidJson({ test: 'test' });
            expect(isValidJson).to.be.true;
        });
    });
    describe('generateRandomPassword', function () {
        it('should return password', function () {
            const generatedRandomPassword = eswHelper.generateRandomPassword();
            expect(generatedRandomPassword).to.be.a('string');
        });
    });
    describe('handleWebHooks', function () {
        global.dw = {
            system: {
                Logger: {
                    getLogger: sinon.stub().returns({
                        debug: sinon.spy(),
                        info: sinon.spy(),
                        error: sinon.spy(),
                    }),
                },
            },
        };
        it('should return response', function () {
            global.request.httpHeaders = {
                get: sinon.stub(),
                authorization: ''
            };
            const handleWebHooks = eswHelper.handleWebHooks({});
            expect(handleWebHooks).to.be.an('object');
        });
    });
    describe('orderLevelDiscountTotal', function () {
        it('should return response', function () {
            const orderLevelDiscountTotal = eswHelper.getOrderLevelDiscountTotal(lineItemContainer);
            expect(orderLevelDiscountTotal).to.be.an('object');
        });
    });
    describe('ShippingLevelDiscountTotal', function () {
        it('should return response', function () {
            const shippingLevelDiscountTotal = eswHelper.getShippingLevelDiscountTotal(lineItemContainer);
            expect(shippingLevelDiscountTotal).to.be.an('object');
        });
    });
    describe('getDiscounts', function () {
        it('should return Discounts', function () {
            const discounts = eswHelper.getDiscounts(lineItemContainer);
            expect(discounts).to.be.an('Array');
        });
    });
    describe('beautifyJsonAsString', function () {
        it('should return beautifyJsonAsString', function () {
            const beautifyJsonAsString = eswHelper.beautifyJsonAsString({ test_object: 'test object' });
            expect(beautifyJsonAsString).to.be.an('string');
        });
    });
    describe('isEswCheckoutOnlyPackagesExportEnabled', function () {
        it('should return EswCheckoutOnlyPackagesExportEnabled', function () {
            const isEswCheckoutOnlyPackagesExportEnabled = eswHelper.isEswCheckoutOnlyPackagesExportEnabled();
            expect(isEswCheckoutOnlyPackagesExportEnabled).to.be.an('undefined');
        });
    });
    describe('getCustomObjectDetails', function () {
        it('should return CustomObjectDetails', function () {
            const customObjectDetails = eswHelper.getCustomObjectDetails('test', 'testId');
            expect(customObjectDetails).to.be.an('object');
        });
    });
    describe('queryAllCustomObjects', function () {
        it('should return queryAllCustomObjects', function () {
            const customObjectDetails = eswHelper.queryAllCustomObjects('testObjId', {}, 'sortingRule');
            expect(customObjectDetails).to.be.an('object');
        });
    });
    describe('shortenName object', function () {
        it('should return shortenName', function () {
            const shortenName = eswHelper.shortenName('testObjId');
            expect(shortenName).to.be.an('string');
        });
    });
    describe('checkRedirect', function () {
        it.skip('should return checkRedirect if available', function () {
            global.request.getLocale = function () {
                return '';
            };
            global.session.clickStream = {
                last: {
                    pipelineName: ''
                }
            };
            const checkRedirect = eswHelper.checkRedirect('testObjId');
            expect(checkRedirect).to.be.an('string');
        });
        it('should return response', function () {
            const ShippingLevelDiscountTotal = eswHelper.getShippingLevelDiscountTotal(lineItemContainer);
            expect(ShippingLevelDiscountTotal).to.be.an('object');
        });
    });
    describe('getSfCountryUrlParam', function () {
        it('should return the correct country URL parameter', function () {
            let RequestObj = new RequestMock('&country=US');
            // Call the function with the mock HTTP parameter map
            const result = eswHelper.getSfCountryUrlParam(RequestObj.getHttpParameters());

            // Check that the result is correct
            expect(result).to.deep.equal({ countryUrlParamKey: undefined, countryUrlParamVal: '' });
        });
    });
    describe('getSgCountryUrlParams', function () {
        it('should return the correct country URL parameter', function () {
            // Set up a mock HTTP parameter map
            let RequestObj = new RequestMock('&country=US');

            // Call the function with the mock HTTP parameter map
            const result = eswHelper.getSgCountryUrlParams(RequestObj.getHttpParameters());

            // Check that the result is correct
            expect(result).to.deep.equal({ countryUrlParamKey: null, countryUrlParamVal: null });
        });
    });
    describe('EswSplitPaymentDetails', function () {
        lineItemContainer.getPaymentInstruments = function () {
            return [];
        };
        it('should return EswSplitPaymentDetails', function () {
            const ShippingLevelDiscountTotal = eswHelper.EswSplitPaymentDetails(lineItemContainer);
            expect(ShippingLevelDiscountTotal).to.be.an('array');
        });
    });
    describe('getOrderLevelDiscountTotal', function () {
        let lineItemContainer = {};
        lineItemContainer.getAdjustedMerchandizeTotalPrice = function () {
            return 5;
        };
        lineItemContainer.getAdjustedMerchandizeTotalPrice = function () {
            return {
                subtract: function () {
                    return 10;
                }
            };
        };
        it('should return getOrderLevelDiscountTotal', function () {
            const orderLevelDiscount = eswHelper.getOrderLevelDiscountTotal(lineItemContainer, false);
            expect(orderLevelDiscount).to.be.an('object');
        });
        // Unit test
        it('Return country locale', function () {
            let countryByTimeZone = eswHelper.getLocaleCountry('en-IE');
            expect(countryByTimeZone).to.equals('IE');
        });
        it('return country details', function () {
            const httpParams = 'en-IE';
            let countryDetailByParam = eswHelper.getCountryDetailByParam(httpParams);
            expect(countryDetailByParam).to.have.property('countryCode');
        });
    });
    describe('updateShopperBasketCurrency', function () {
        it('should update the session currency and call basket.updateCurrency when conditions are met', function () {
            const selectedCountryDetail = {
                defaultCurrencyCode: 'EUR'
            };
            eswHelper.updateShopperBasketCurrency(selectedCountryDetail, '');
        });
        it('should not update currency if selectedCountryDetail is null', function () {
            let result = eswHelper.updateShopperBasketCurrency(null, '');
            expect(result).to.be.undefined;
        });
    });
    describe('setEmbededCheckoutOverridePriceBooks', function () {
        it('should not update the basket with override price books when country-code is provided', function () {
            // Mock dependencies
            const basketMock = {};
            const requestMock = {
                httpParameters: {
                    'country-code': ['US']
                }
            };
            const priceBookMock = {
                id: 'testPriceBook'
            };
    
            // Stub functions
            const getPriceBookStub = sinon.stub().returns(priceBookMock);
            const setApplicablePriceBooksStub = sinon.stub();
            const getOverridePriceBooksStub = sinon.stub().returns(['testPriceBook']);
    
            // Mock dw/catalog/PriceBookMgr
            const PriceBookMgrMock = {
                getPriceBook: getPriceBookStub,
                setApplicablePriceBooks: setApplicablePriceBooksStub
            };
    
            // Mock eswHelper
            const eswHelperMock = {
                getOverridePriceBooks: getOverridePriceBooksStub
            };
    
            // Add the mocked function
            eswHelper.getOverridePriceBooks = eswHelperMock.getOverridePriceBooks;
    
            // Run the function
            eswHelper.setEmbededCheckoutOverridePriceBooks(basketMock, requestMock);
    
            // Assertions
            chai.expect(setApplicablePriceBooksStub.calledOnce).to.be.false;
        });
    
        it('should update the basket if country-code is missing', function () {
            // Mock dependencies
            const basketMock = {};
            const requestMock = {
                httpParameters: {}
            };
    
            // Stub functions
            const getOverridePriceBooksStub = sinon.stub().returns([]);
    
            // Mock eswHelper
            const eswHelperMock = {
                getOverridePriceBooks: getOverridePriceBooksStub
            };
    
            // Add the mocked function
            eswHelper.getOverridePriceBooks = eswHelperMock.getOverridePriceBooks;
    
            // Run the function
            eswHelper.setEmbededCheckoutOverridePriceBooks(basketMock, requestMock);
    
            // Assertions
            chai.expect(getOverridePriceBooksStub.calledOnce).to.be.true;
        });
    });
    describe('handleEmbededCheckoutEswBasketAttributes', function () {
        it.skip('should update the basket attributes when valid parameters are provided', function () {
            // Mock dependencies
            const basketMock = {
                getDefaultShipment: sinon.stub().returns({}),
                createBillingAddress: sinon.stub().returns({
                    setFirstName: sinon.stub(),
                    setLastName: sinon.stub(),
                    setCountryCode: sinon.stub(),
                    setCity: sinon.stub()
                }),
                createPaymentInstrument: sinon.stub(),
                setCustomerEmail: sinon.stub(),
                getCustomerEmail: sinon.stub().returns(null),
            };
            const requestMock = {
                httpParameters: {
                    'country-code': ['US'],
                    'currency-code': ['USD']
                }
            };
            const shippingAddressMock = {
                setFirstName: sinon.stub(),
                setLastName: sinon.stub(),
                setCountryCode: sinon.stub(),
                setCity: sinon.stub()
            };
            const billingAddressMock = {
                setFirstName: sinon.stub(),
                setLastName: sinon.stub(),
                setCountryCode: sinon.stub(),
                setCity: sinon.stub()
            };
    
            // Stubs and mocks
            const getShipmentShippingAddressStub = sinon.stub().returns(shippingAddressMock);
            const getNonGiftCertificateAmountStub = sinon.stub().returns(100);
            const checkIsEswAllowedCountryStub = sinon.stub().returns(true);
            const getShopperCurrencyStub = sinon.stub().returns('USD');
    
            // Mock modules
            const eswServiceHelperMock = {
                getShipmentShippingAddress: getShipmentShippingAddressStub,
                getNonGiftCertificateAmount: getNonGiftCertificateAmountStub
            };
            const pricingHelperMock = {
                eswPricingHelper: {
                    getShopperCurrency: getShopperCurrencyStub
                }
            };
    
            // Mock hooks
            const hookMgrMock = {
                callHook: sinon.stub()
            };
    
            // Replace dependencies with mocks
    
            // Add the mocked function
            eswHelper.checkIsEswAllowedCountry = checkIsEswAllowedCountryStub;
    
            // Run the function
            eswHelper.handleEmbededCheckoutEswBasketAttributes(basketMock);
        });
    
        it('should not update basket attributes if country-code is invalid', function () {
            // Mock dependencies
            const basketMock = {
                getDefaultShipment: sinon.stub().returns({}),
                createBillingAddress: sinon.stub(),
                createPaymentInstrument: sinon.stub(),
                setCustomerEmail: sinon.stub(),
            };
            const requestMock = {
                httpParameters: {
                    'country-code': ['INVALID']
                }
            };
    
            // Stubs
            const getShipmentShippingAddressStub = sinon.stub();
            const checkIsEswAllowedCountryStub = sinon.stub().returns(false);
    
            // Mock modules
            const eswServiceHelperMock = {
                getShipmentShippingAddress: getShipmentShippingAddressStub
            };
    
            // Add the mocked function
            eswHelper.checkIsEswAllowedCountry = checkIsEswAllowedCountryStub;
    
            // Run the function
            eswHelper.handleEmbededCheckoutEswBasketAttributes(basketMock);
    
            // Assertions
            chai.expect(getShipmentShippingAddressStub.called).to.be.false;
            chai.expect(basketMock.createBillingAddress.called).to.be.false;
            chai.expect(basketMock.createPaymentInstrument.called).to.be.false;
            chai.expect(basketMock.setCustomerEmail.called).to.be.false;
        });
    });

    describe('getEswEmbCheckoutScriptPath Function', () => {

        it('should return the correct embedded checkout script path when ESW is enabled', () => {
            // Mock the helper and function call
            const mockEmbCheckoutHelper = {
                getEswEmbCheckoutScriptPath: sinon.stub().returns('/scripts/esw/checkout.js')
            };
            
            // Mock the `isEswEnabledEmbeddedCheckout` method to return true
            const mockContext = {
                isEswEnabledEmbeddedCheckout: sinon.stub().returns(true),
            };
    
            // Call the function
            eswHelper.getEswEmbCheckoutScriptPath(mockContext);
        });
    });
    describe('generatePreOrderUsingBasket Function', () => {

        it('should return REDIRECT status when user is not authenticated and redirect preference is not "Cart"', () => {
            // Mock required modules and functions
            const mockEswHelper = {
                getRedirect: sinon.stub().returns({ value: 'Checkout' }),
                setOAuthToken: sinon.stub(),
            };
            const mockEswCoreService = {
                getPreorderServiceV2: sinon.stub().returns({
                    call: sinon.stub().returns({ status: 'OK' })
                })
            };
            const mockEswServiceHelper = {
                preparePreOrder: sinon.stub().returns({
                    shopperCheckoutExperience: {}
                })
            };
            const mockBasketMgr = {
                getCurrentBasket: sinon.stub().returns({
                    UUID: 'basket-12345'
                })
            };
            const mockOrderMgr = {
                createOrderNo: sinon.stub().returns('order-12345')
            };
            const mockSession = {
                privacy: {
                    guestCheckout: null,
                    confirmedOrderID: null,
                    TargetLocation: null
                }
            };
            const mockCustomer = {
                authenticated: false
            };
            const mockURLUtils = {
                https: sinon.stub().returns({
                    toString: sinon.stub().returns('https://mocked-url')
                })
            };
    
            // Call the function
            const result = eswHelper.generatePreOrderUsingBasket.call({});
    
            // Assertions
            expect(result.status).to.equal('REDIRECT');
        });
    
    });
});
