
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/plpPriceHook.js', function () {
    var plpPriceHook = proxyquire('../../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/ocapi/shop/hooks/plpPriceHook', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () {return {}},
            eswPdpPriceConversions: function () {return {}},
            eswPlpPriceConversions: function () {return {}},
        },
        'dw/system/Transaction': Transaction,
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () {
                return {};
            },
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getEShopWorldModuleEnabled: function () { return true; },
                eswPdpPriceConversions: function () { return {}; },
            }
        },

    });
    // Unit test
    it('modify product details response', function () {
        let modifyGETResponse = plpPriceHook.modifyGETResponse({}, {});
        expect(modifyGETResponse).to.be.an('object');
    });
});
