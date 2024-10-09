
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');
var Request = require('../../../../../mocks/dw/system/Request');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/promotionModifyResponse.js', function () {
    var promotionModifyResponse = proxyquire('../../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/ocapi/shop/hooks/promotionModifyResponse', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () {return {}},
            eswPdpPriceConversions: function () {return {}},
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
    it('modify promotion get response', () => {
        global.request.httpParameters = {
            'country-code': ['en-IE'],
            get: function () { return [] }
        };
        let modifyGETResponse = promotionModifyResponse.modifyGETResponse({}, {calloutMsg: {locale: ''}});
        expect(modifyGETResponse).to.be.an('object');
    });
    it('modify promotion post response', () => {
        let modifyPOSTResponse = promotionModifyResponse.modifyPOSTResponse({}, {calloutMsg: {locale: ''}});
        expect(modifyPOSTResponse).to.be.an('object');
    });
});
