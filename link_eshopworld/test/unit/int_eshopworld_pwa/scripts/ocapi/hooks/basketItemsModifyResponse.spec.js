
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/basketItemsModifyResponse.js', function () {
    var basketItemsModifyResponse = proxyquire('../../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/ocapi/shop/hooks/basketItemsModifyResponse', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () { return {}; },
            basketModifyGETResponse_v2: function () { return {}; },
            getCountryDetailByParam: function () {
                return {};
            },
            deleteBasketItem: function () { return {}; },
            setOverridePriceBooks: function () { return true; }
        },
        'dw/system/Transaction': Transaction,
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () {
                return {};
            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCatalogUploadMethod: function () { return 'api'; },
                getEShopWorldModuleEnabled: function () { return true; }
            }
        }

    });
    // Unit test
    it('modify basket response', () => {
        let modifyPOSTResponse = basketItemsModifyResponse.modifyPOSTResponse({}, {});
        expect(modifyPOSTResponse).to.be.an('object');
    });
    it('Mpdify basket response after patch', () => {
        let modifyPATCHResponse = basketItemsModifyResponse.modifyPATCHResponse({}, {});
        expect(modifyPATCHResponse).to.be.an('object');
    });
    it('Modify response', () => {
        let modifyGETResponse_v2 = basketItemsModifyResponse.modifyGETResponse_v2({}, {});
        expect(modifyGETResponse_v2).to.be.an('object');
    });
    it('Before Editing the basket', () => {
        let basket = {
            custom: { eswShopperCurrency: '' },
            updateTotals: function () {}
        };
        let beforePATCH = basketItemsModifyResponse.beforePATCH(basket, {});
        expect(beforePATCH).to.be.an('object');
    });
    it('On deleting item call', () => {
        let modifyDELETEResponse = basketItemsModifyResponse.modifyDELETEResponse({}, {});
        expect(modifyDELETEResponse).to.be.an('object');
    });
});
