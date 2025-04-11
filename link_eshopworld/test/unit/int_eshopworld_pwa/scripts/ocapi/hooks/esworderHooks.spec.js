
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/orderHooks.js', function () {
    var orderHooks = proxyquire('../../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/ocapi/shop/hooks/orderHooks', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () {return {}},
            basketModifyGETResponse_v2: function () {return {}},
            getCountryDetailByParam: function () {
                return {};
            },
            deleteBasketItem: function () {return {}},
            handleEswPreOrderCall: function () {return {}},
            setOverridePriceBooks: function () {return {}},
            handleEswOrderAttributes: function () {return {}},
            handleEswBasketAttributes: function () {return {}},
            handleEswOrdersHistoryCall: function () {return {}},
            handleEswOrderDetailCall: function () {return {}},
        },
        'dw/system/Transaction': Transaction,
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () {
                return {};
            },
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCatalogUploadMethod: function () { return 'api'; },
                getEShopWorldModuleEnabled: function () { return true; },
                isEswEnabledEmbeddedCheckout: function () { return true; }
            }
        },

    });
    // Unit test
    it('modify basket before calling server', function () {
        let beforePOST = orderHooks.beforePOST({}, {});
        expect(beforePOST).to.be.an('object');
    });
    it('modify basket after calling server', function () {
        let afterPOST = orderHooks.afterPOST({}, {});
        expect(afterPOST).to.be.an('object');
    });
    it('modify basket post response', function () {
        let modifyPOSTResponse = orderHooks.modifyPOSTResponse({}, {});
        expect(modifyPOSTResponse).to.be.an('object');
    });
    it('modify basket get response', function () {
        let modifyGETResponse = orderHooks.modifyGETResponse_v2({}, {});
        expect(modifyGETResponse).to.be.an('object');
    });
    it('modify basket response', function () {
        let modifyGETResponse = orderHooks.modifyGETResponse({}, {});
        expect(modifyGETResponse).to.be.an('object');
    });
});
