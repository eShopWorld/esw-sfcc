var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');
var ArrayList = require('../../../../mocks/dw.util.CollectionHelper');
const URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
const Transaction = require('../../../../mocks/dw/system/Transaction');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var CustomObjectMgr = require('../../../../mocks/dw/object/CustomObjectMgr');
var PriceBookMgrMock = require('../../../../mocks/dw/catalog/PriceBookMgr');
const Basket = require('../../../../mocks/dw/order/Basket');


const RequestMock = require('../../../../mocks/dw/system/Request');

const localizeObj = {
    applyCountryAdjustments: true,
    localizeCountryObj: {
        currencyCode: 'EUR',
        countryCode: 'en-IE'
    },
    applyRoundingModel: 'false'
};
var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: ''
    }
};

var globalResponse = {
    setStatus: function () {
        return '401';
    }
};

let lineItemContainer = {};
lineItemContainer.shippingTotalPrice = {
    subtract: function () {
        return 10;
    }
};
lineItemContainer.adjustedShippingTotalPrice = 10;
lineItemContainer.getAdjustedMerchandizeTotalPrice = function (val) {
    if (!val) {
        return {
            subtract: function () {
                return 10;
            }
        };
    } else {
        return 10;
    }
};

global.dw = {
    system: {
        Logger: {
            getLogger: sinon.stub().returns({
                info: sinon.stub(),
                error: sinon.stub(),
            }),
        },
    },
};
const EncodingMock = {
    toHex: function (params) {}
};
var LocalServiceRegMock = require('../../../../mocks/dw/svc/LocalServiceRegistry');
const Constants = require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants');
describe('/link_eshopworld/cartridges/int_eshopworld_core/cartridge/scripts/jwt/jwkToPemHelper.js', function () {
    var jwkToPemHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/jwt/jwkToPemHelper.js', {
        '*/cartridge/scripts/util/collections': ArrayList,
        'dw/system/Transaction': Transaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/crypto/Encoding': {},
        checkRedirect: function () {},
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCatalogUploadMethod: function () { return 'api'; },
                beautifyJsonAsString: function () {
                    return null;
                },
                getCustomObjectDetails: function () { return {
                    custom: {
                        validationKeys: JSON.stringify([{ kid: 'key1', kty: 'RSA' }, { kid: 'key2', kty: 'RSA' }])
                    },
                    getCustom: function () { return {configReport: ''} }
                }; },
                fetchJwksFromEsw: function () {
                    return [{kid: 'key1'}, {kid: 'key2'}];
                }
            }
        },
        '*/cartridge/scripts/jwt/sign.js': {},
        '*/cartridge/scripts/jwt/verify.js': {},
        '*/cartridge/scripts/jwt/decode.js': {
            decodeJWT: function (params) {
                return ['key1', 'key2'];
            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        } else {
                            return undefined;
                        }
                    }
                };
            }
        },
        '*/cartridge/scripts/services/EswCoreService': {
            getEswServices: function () {
                return {
                    getJwksFromEswService: function () {
                        return {
                            call: function () {
                                return {
                                    status: 'OK',
                                    object: { keys: ['key1', 'key2'] }
                                };
                            }
                        };
                    }
                };
            }
        },
        'dw/util/StringUtils': StringUtils,
        'dw/svc/LocalServiceRegistry': LocalServiceRegMock,
        '*/cartridge/scripts/util/Constants': Constants,
        'dw/object/CustomObjectMgr': {
            createCustomObject: function () { return {
                custom: { validationKeys: '' }
            }},
            remove: function (params) {}
        },
        'dw/content/ContentMgr': {},
        'dw/catalog/PriceBookMgr': PriceBookMgrMock,
        'dw/web/URLAction': function () {
            return 'some url';
        },
        'dw/web/URLParameter': '',
        '*/cartridge/scripts/helper/eswOrderProcessHelper': {
            cancelAnOrder: function () {
                return {
                    success: 'orderProcess'
                };
            }
        },
        getBaseCurrencyPreference: function () {
            return 'EUR';
        },
        isEswCatalogFeatureEnabled: function () { return true; },
        '*/cartridge/scripts/helper/eswCalculationHelper': {
            getEswCalculationHelper: {
                getSubtotalObject: function () {
                    return Money(true, request.httpCookies['esw.currency'].value);
                },
                getMoneyObject: function () {
                    return Money;
                }
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {

            }
        },
        '*/cartridge/scripts/jwt/eswJwtHelpers': {
            eswPricingHelper: function () {
                return true;
            }
        },
        '*/cartridge/scripts/jwt/jwtHelper': {
            isValidJWT: function () {
                return true;
            }
        },
        'dw/crypto/Encoding': {
            fromBase64: function (params) {
                return {
                    toString: function () {
                        return JSON.stringify({ 'FJSNF': 'FKNKJ' });
                    }
                };
            },
            toHex: function (params) {
                return 'ff'
            }, // Ensure this is part of the mock
            toBase64: function (params) {
                return 'SGVsbG8sIHdvcmxkIQ=='
            },
            fromHex: sinon.stub(),
        },
        getCatalogUploadMethod: function () { return 'API'; }
    });
    describe('getRSAPublicKey', function () {
        const modulus_b64 = "AK8XhF0/WxXvp+m5lgfPTO08k30FVcTYr/mX3PbD9giDOg1OpM6Jz5kIXs7QJjODkkTwrpg+YUN2KfACFP3DQk==";
        const exponent_b64 = "AQAB";
        // Unit test
        it('return keys response', function () {
            let getRSAPublicKey = jwkToPemHelper.getRSAPublicKey(modulus_b64, exponent_b64);
            expect(getRSAPublicKey).to.be.an('string');
        });
    });
});
