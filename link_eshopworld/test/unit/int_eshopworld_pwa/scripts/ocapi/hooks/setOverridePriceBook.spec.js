
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/setOverridePriceBook.js', function () {
    var setOverridePriceBook = proxyquire('../../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/ocapi/shop/hooks/setOverridePriceBook', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () {return {}},
            eswPdpPriceConversions: function () {return {}},
            setOverridePriceBooks: function () {return {}},
            setDefaultOverrideShippingMethod: function () {return {}},
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
    it('Modifiy pricebook api call before getting the response', () => {
        let modifyGETResponse = setOverridePriceBook.beforeGET({}, {});
        expect(modifyGETResponse).to.be.an('object');
    });
    it('Modifiy pricebook api call before calling the server', () => {
        let modifyGETResponse = setOverridePriceBook.beforePOST({}, {});
        expect(modifyGETResponse).to.be.an('object');
    });
});
