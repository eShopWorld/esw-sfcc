
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
const BasketMgr = require('../../../../../mocks/dw/order/BasketMgr');
const LoggerMock = require('../../../../../mocks/dw/system/Logger');

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/basketItemsModifyResponse.js', function () {
    var basketItemsModifyResponse = proxyquire('../../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/ocapi/shop/hooks/basketItemsModifyResponse', {
        'dw/system/Site': SiteMock,
        'dw/system/Logger': LoggerMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () { return {}; },
            basketModifyGETResponse_v2: function () { return {}; },
            getCountryDetailByParam: function () {
                return {};
            },
            deleteBasketItem: function () { return {}; },
            setOverridePriceBooks: function () { return true; },
            setSessionBaseCurrency: function () { return true; }
        },
        'dw/order/BasketMgr': BasketMgr,
        'dw/system/Transaction': Transaction,
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getEswHelper: {
                getCountryDetailByParam: function () {
                    return {};
                }
            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCountryDetailByParam: function () {
                    return {};
                },
                getCatalogUploadMethod: function () { return 'api'; },
                getEShopWorldModuleEnabled: function () { return true; },
                isEswEnabledEmbeddedCheckout: function () { return true; }
            }
        }

    });
    // Unit test
    it('modify basket response', function () {
        let modifyPOSTResponse = basketItemsModifyResponse.modifyPOSTResponse({}, {});
        expect(modifyPOSTResponse).to.be.an('object');
    });
    it('Modify basket response after patch', () => {
        let modifyPATCHResponse = basketItemsModifyResponse.modifyPATCHResponse({ custom: { eswPreOrderRequest: '' } }, {});
        expect(modifyPATCHResponse).to.be.an('object');
    });
    it('Modify response', function () {
        let modifyGETResponse_v2 = basketItemsModifyResponse.modifyGETResponse_v2({}, {});
        expect(modifyGETResponse_v2).to.be.an('object');
    });
    it('Before Editing the basket', function () {
        let basket = {
            custom: { eswShopperCurrency: '' },
            updateTotals: function () {}
        };
        let beforePATCH = basketItemsModifyResponse.beforePATCH(basket, {});
        expect(beforePATCH).to.be.an('object');
    });
    it('On deleting item call', function () {
        let modifyDELETEResponse = basketItemsModifyResponse.modifyDELETEResponse({}, {});
        expect(modifyDELETEResponse).to.be.an('object');
    });
    it('On deleting item call', () => {
        let modifyDELETEResponse = basketItemsModifyResponse.beforeGET({}, {});
        expect(modifyDELETEResponse).to.be.an('object');
    });
});
