
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/shippingHooks.js', function () {
    var shippingHooks = proxyquire('../../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/ocapi/shop/hooks/shippingHooks', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () {return {}},
            basketModifyPUTResponse: function () {return {}},
            updateShippingMethodSelection: function () {return {}},
        },
        'dw/system/Transaction': Transaction,
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () {
                return {};
            },
            getCountryLocalizeObj: function () {return {}},
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getEShopWorldModuleEnabled: function () { return true; },
                eswPdpPriceConversions: function () { return {}; },
            }
        },
        '*/cartridge/scripts/helper/serviceHelperV3': {
            convertPromotionMessage: function () { return {}; },
        }

    });
    // Unit test
    it('Modifiy shipping response', function () {
        let modifyGETResponse = shippingHooks.modifyPUTResponse({}, {});
        expect(modifyGETResponse).to.be.an('object');
    });
    // Unit test
    it('Modifiy shipping response', () => {
        let modifyGETResponse = shippingHooks.modifyGETResponse_v2({}, {});
        expect(modifyGETResponse).to.be.an('object');
    });
});
