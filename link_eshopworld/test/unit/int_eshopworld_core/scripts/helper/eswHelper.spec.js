var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
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

describe('int_eshopworld_sfra/cartridge/scripts/helper/eswHelper.js', function () {
    var eswHelper = proxyquire('../../../../../cartridges/int_eshopworld_sfra/cartridge/scripts/helper/eswHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                // eslint-disable-next-line semi
                getOverridePriceBook: function () { return { countryCode: 'fake countryCode' } }
            }
        },
        '*/cartridge/scripts/util/collections': '',
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/system/Site': siteMock,
        'dw/util/StringUtils': StringUtils
    }).getEswHelper();
    describe('Happy path', function () {
        it('Should Get Overridden country matched array', function () {
            let overrideCountry = eswHelper.getOverrideCountry('fake country', 'fake code');
            expect(overrideCountry).to.be.an('array');
        });
    });
    describe('Sad Path', function () {
        it('Should throw error', function () {
            let overrideCountry = eswHelper.getOverrideCountry();
            expect(overrideCountry).to.throw;
        });
    });
});
