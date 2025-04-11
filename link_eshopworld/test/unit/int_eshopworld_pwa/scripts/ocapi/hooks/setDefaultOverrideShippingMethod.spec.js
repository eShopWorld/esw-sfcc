
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');
var Transaction = require('../../../../../mocks/dw/system/Transaction');
const URLUtilsMock = require('../../../../../mocks/dw/web/URLUtils');

// Mock basket object
let basket = {
    // Add properties required by eswHelperHL and other helper functions
    items: [ /* Mock items in the basket */ ],
    defaultShipment: {
        shippingMethod: { ID: 'standard' },
        setShippingMethod: function(methodID) {
            this.shippingMethod.ID = methodID;
        }
    },
    // Other properties related to the basket
};

global.request.httpParameters = {
    'country-code': ['en-IE']
};

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop/setOverridePriceBook.js', function () {
    var eswOCAPIHelperHL = proxyquire('../../../../../../cartridges/int_eshopworld_headless/cartridge/scripts/helper/eswOCAPIHelperHL', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            basketItemsModifyResponse: function () {return {}},
            eswPdpPriceConversions: function () {return {}},
            setOverridePriceBooks: function () {return {}},
            setDefaultOverrideShippingMethod: function () {return {}},
        },
        '*/cartridge/scripts/util/Constants': require('../../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants'),
        'dw/web/URLUtils': URLUtilsMock,
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {
                getShopperCurrency: function (param) {
                    return 'EUR';
                },
                getConvertedPrice: function () {
                    return 1;
                },
                isShippingCostConversionEnabled: function () {
                    return true;
                },
                getConversionPreference: function () {
                }
            }
        },
        '*/cartridge/scripts/helper/eswCheckoutHelperHL': {
            setEswOrderAttributes: function () {
                return {};
            },
            setOverrideShippingMethods: function () {
                return {};
            },
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
                checkIsEswAllowedCountry: function (param) {
                    return true;
                },
            }
        },
        '*/cartridge/scripts/helper/serviceHelperV3': {
            convertPromotionMessage: function () { return {}; },
        }

    });
    // Unit test
    it('handle ESW handleEswOrderAttributes', function () {
        let handleEswOrderAttributesResponse = eswOCAPIHelperHL.handleEswOrderAttributes(basket);
        expect(handleEswOrderAttributesResponse).to.be.an('undefined');
    });
});
