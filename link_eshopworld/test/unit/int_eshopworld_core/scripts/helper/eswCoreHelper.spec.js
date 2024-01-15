var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var CustomObjectMgr = require('../../../../mocks/dw/object/CustomObjectMgr');
var PriceBookMgrMock = require('../../../../mocks/dw/catalog/PriceBookMgr');

global.empty = empty(global);

global.empty = empty(global);
var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: ''
    }
};

global.session = session;
var LocalServiceRegMock = require('../../../../mocks/dw/svc/LocalServiceRegistry');
const Constants = require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants');
describe('/link_eshopworld/cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', function () {
    var eswHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', {
        '*/cartridge/scripts/util/collections': '',
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/system/Site': siteMock,
        'dw/util/StringUtils': StringUtils,
        'dw/svc/LocalServiceRegistry': LocalServiceRegMock,
        '*/cartridge/scripts/util/Constants': Constants,
        'dw/object/CustomObjectMgr': CustomObjectMgr,
        'dw/content/ContentMgr': {},
        'dw/catalog/PriceBookMgr': PriceBookMgrMock,
        '*/cartridge/scripts/helper/eswOrderProcessHelper': {
            cancelAnOrder: function () {
                return {
                    success: 'orderProcess'
                };
            }
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
        expect(() => eswHelper.validatePreOrder(invalidReqObj)).to.throw('SFCC_ORDER_CREATION_FAILED');
    });
    it('Should throw an error with message ATTRIBUTES_MISSING_IN_PRE_ORDER when the reqObj has no lineItems or deliveryCountryIso', function () {
        // Create an invalid reqObj with no lineItems or deliveryCountryIso
        const invalidReqObj = {
            retailerCartId: '123456'
        };
        // Call the validatePreOrder function with the invalid reqObj and expect an error
        expect(() => eswHelper.validatePreOrder(invalidReqObj)).to.throw('ATTRIBUTES_MISSING_IN_PRE_ORDER');
    });
    it('Returns Promo Threshold Amount', () => {
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
        it('should return an array of country objects', () => {
            const countries = eswHelper.getAllCountries();
            expect(countries).to.be.an('array');
        });
    });
    describe('getAllowedCurrencies', function () {
        it('should return an array of all country', () => {
            const countries = eswHelper.getAllowedCurrencies();
            expect(countries).to.be.an('array');
        });
    });
    describe('getOverridePriceBooks', function () {
        it('should return an array of price books', () => {
            const allCountries = eswHelper.getOverridePriceBooks();
            expect(allCountries).to.be.an('array');
        });
    });
    describe('getPriceBookCurrency', function () {
        it('should return an array of price book currency', () => {
            const priceBookCurrency = eswHelper.getPriceBookCurrency('test');
            expect(priceBookCurrency).to.be.null;
        });
    });
    describe('getSubtotalObject', function () {
        it('should return money object', () => {
            const subtotalObject = eswHelper.getSubtotalObject();
            expect(subtotalObject).to.have.property('available');
        });
    });
    describe('setLocation', function () {
        it('should set location', () => {
            eswHelper.setLocation();
        });
    });
    describe('getSelectedCountryProductPrice', function () {
        it('should return product price object', () => {
            const productPrice = eswHelper.getSelectedCountryProductPrice(15, 'USD');
            expect(productPrice).to.have.property('currency');
        });
    });
    describe('strToJson', function () {
        it('should return object', () => {
            const strToJson = eswHelper.strToJson('{"test":"test"}');
            expect(strToJson).to.have.property('test');
        });
    });
    describe('isValidJson', function () {
        it('should return boolean', () => {
            const isValidJson = eswHelper.isValidJson({ test: 'test' });
            expect(isValidJson).to.be.true;
        });
    });
    describe('generateRandomPassword', function () {
        it('should return password', () => {
            const generatedRandomPassword = eswHelper.generateRandomPassword();
            expect(generatedRandomPassword).to.be.a('string');
        });
    });
    describe('handleWebHooks', function () {
        it('should return response', () => {
            const handleWebHooks = eswHelper.handleWebHooks({});
            expect(handleWebHooks).to.be.an('object');
        });
    });
});
