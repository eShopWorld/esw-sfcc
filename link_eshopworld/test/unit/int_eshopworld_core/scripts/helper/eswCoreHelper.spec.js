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
        isEswCatalogFeatureEnabled: function () { return true; },
        getCatalogUploadMethod: function () { return 'API'; }
    }).getEswHelper;
    describe('Happy path', function () {
        it('Should getPaVersion', function () {
            let paVersion = eswHelper.getPaVersion();
            chai.expect(paVersion).to.equals(Constants.UNKNOWN);
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
});
