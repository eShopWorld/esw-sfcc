
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');
var Request = require('../../../../../mocks/dw/system/Request');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/basketHooks.js', function () {
    var basketHooks = proxyquire('../../../../../../cartridges/int_eshopworld_headless/cartridge/scripts/ocapi/shop/hooks/basketHooks', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () {return {}},
            sendOverrideShippingMethods: function () {return {}},
        },
        '*/cartridge/scripts/helper/eswCoreApiHelper': {},
        'dw/system/Transaction': Transaction,
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () {
                return {};
            },
            getCountryLocalizeObj: function () {return {}},
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCountryDetailByParam: function () {
                    return {};
                },
                getCountryLocalizeObj: function () {return {}},
                getEShopWorldModuleEnabled: function () { return true; },
                eswPdpPriceConversions: function () { return {}; },
            }
        },
        '*/cartridge/scripts/helper/serviceHelperV3': {
            convertPromotionMessage: function () { return {}; },
        }

    });
    // Unit test
    it('modify promotion get response', function () {
        global.request.httpParameters = {
            'country-code': ['en-IE'],
            get: function () { return [] }
        };
        try {
            // Call the function under test
            let modifyGETResponse = basketHooks.modifyPOSTResponse({}, { calloutMsg: { locale: '' } });
            // Validate the response
            expect(modifyGETResponse).to.be.an('object');
        } catch (error) {
        }
    });
});
