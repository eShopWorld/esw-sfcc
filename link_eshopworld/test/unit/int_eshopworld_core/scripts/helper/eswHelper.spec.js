var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');

var Currency = require('../../../../mocks/dw/util/Currency');
var Money = require('../../../../mocks/dw.value.Money');
var Transaction = require('../../../../mocks/dw/system/Transaction');
var empty = require('../../../../mocks/dw.global.empty');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
global.empty = empty(global);

let basketMgr = {
    getCurrentOrNewBasket: function() {
        return {
            updateCurrency: function () {
                return '';
            }
        }
    }
}

var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();
var hookMgr = {
    callHook: function () {}
};

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: ''
    }
};

let req = {
    session: {
        setCurrency: function () {
            return '';
        }
    },
    setLocale: function () {
    }
};

global.session = session;

describe('int_eshopworld_sfra/cartridge/scripts/helper/eswHelper.js', function () {
    var eswHelper = proxyquire('../../../../../cartridges/int_eshopworld_sfra/cartridge/scripts/helper/eswHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                // eslint-disable-next-line semi
                getOverridePriceBook: function () { return { countryCode: 'fake countryCode' } },
                overridePriceCore: function () { return {}; },
                getEShopWorldModuleEnabled: function () { return false; },
                getAvailableCountry: function () {
                    return 'USD';
                },
                setAllAvailablePriceBooks: function () {},
                setBaseCurrencyPriceBook: function () {},
                getBaseCurrencyPreference: function () {
                    return 'USD';
                },
                createCookie: function () {}
            }
        },
        'dw/util/Currency': Currency,
        'dw/order/BasketMgr': basketMgr,
        'dw/system/HookMgr': hookMgr,
        '*/cartridge/scripts/helper/serviceHelper': {},
        '*/cartridge/scripts/util/collections': '',
        'dw/system/Transaction': Transaction,
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
    describe('overridePrice', function () {
        it('return overridePrice book pbject', function () {
            let overrideCountry = eswHelper.overridePrice();
            expect(overrideCountry).to.be.an('object');
        });
    });
    describe('rebuildCart', function () {
        it('return cart rebuild result', function () {
            let rebuildCart = eswHelper.rebuildCart('fakeID');
            expect(rebuildCart).to.be.an('undefined');
        });
    });
    describe('isProductRestricted', function () {
        let testproductId = ['eswProductRestrictedCountries']
        it('return Product Restricted', function () {
            let isProductRestricted = eswHelper.isProductRestricted(testproductId, 'EUR');
            expect(isProductRestricted).to.equals(false);
        });
    });
    describe('setDefaultCurrencyLocal', function () {
        it('return DefaultCurrencyLocal', function () {
            let defaultCurrencyLocal = eswHelper.setDefaultCurrencyLocal(req);
            expect(defaultCurrencyLocal).to.equals(undefined);
        });
    });
    describe('setBaseCurrencyPriceBook', function () {
        it('set Base Currency PriceBook', function () {
            let baseCurrencyPriceBook = eswHelper.setBaseCurrencyPriceBook(req, 'EUR');
            expect(baseCurrencyPriceBook).to.equals(undefined);
        });
    });
});
