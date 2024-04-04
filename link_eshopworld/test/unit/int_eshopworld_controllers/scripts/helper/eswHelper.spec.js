var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var PriceBookMgrMock = require('../../../../mocks/dw/catalog/PriceBookMgr');
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

describe('int_eshopworld_controllers/cartridge/scripts/helper/eswHelper.js', function () {
    var eswHelper = proxyquire('../../../../../cartridges/int_eshopworld_controllers/cartridge/scripts/helper/eswHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                // eslint-disable-next-line semi
                getOverridePriceBook: function () { return { countryCode: 'fake countryCode' } },
                getOverridePriceBooks: function () { return {}; },
                getEShopWorldModuleEnabled: function () { return true; },
                isESWSupportedCountry: function () { return true; }
            }
        },
        '*/cartridge/scripts/helper/serviceHelper': {
            failOrder: function () { return ''; }
        },
        'dw/catalog/PriceBookMgr': PriceBookMgrMock,
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
    describe('isEswOrderHistory', function () {
        it('Should return boolean', function () {
            let isEswOrderHistory = eswHelper.isEswOrderHistory({orderNo: 'test001'});
            expect(isEswOrderHistory).to.equal(true);
        });
    });
    describe('overridePrice', function () {
        it('Should return boolean', function () {
            let overridePrice = eswHelper.overridePrice('EUR');
            expect(overridePrice).to.equal(false);
        });
    });
    describe('rebuild Cart', function () {
        it('Should return null', function () {
            let rebuildCart = eswHelper.rebuildCart();
            expect(rebuildCart).to.equal(undefined);
        });
    });
});
