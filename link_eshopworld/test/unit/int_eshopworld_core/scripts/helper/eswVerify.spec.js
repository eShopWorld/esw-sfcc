var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');
var ArrayList = require('../../../../mocks/dw.util.CollectionHelper');
const URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
const BytesMock = require('../../../../mocks/dw/util/Bytes');
const MacMock = require('../../../../mocks/dw/crypto/Mac');


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
describe('/link_eshopworld/cartridges/int_eshopworld_core/cartridge/scripts/jwt/verify.js', function () {
    var verify = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/jwt/verify.js', {
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
        '*/cartridge/scripts/jwt/decode': {
            decodeJWT: function (params) {
                var options = {};
                return {
                    header: {
                        alg: 'HS256',
                        type: 'JWT',
                        kid: options.kid
                    }
                }
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
        'dw/crypto/Mac': MacMock,
        '*/cartridge/scripts/jwt/eswJwtHelpers': {
            eswPricingHelper: function () {
                return true;
            }
        },
        '*/cartridge/scripts/jwt/jwtHelper': {
            isValidJWT: function () {
                return true;
            },
            toBase64UrlEncoded: function () {
                return 'SGVsbG8gd29ybGQh';
            },
            SUPPORTED_ALGORITHMS: ['RS256', 'RS384', 'RS512', 'HS256', 'HS384', 'HS512', 'PS256', 'PS384'],
            JWTAlgoToSFCCMapping: {
                RS256: 'SHA256withRSA',
                RS512: 'SHA512withRSA',
                RS384: 'SHA384withRSA',
                PS256: 'SHA256withRSA/PSS',
                PS384: 'SHA384withRSA/PSS'
            }
        },
        'dw/util/Bytes': BytesMock,
        'dw/crypto/Signature': {},
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
    describe('verifyJWT', function () {
        const jwtToken = "header.base64.payload.signature";  // This is a dummy JWT string (simplified example)
        const options = {
            publicKeyOrSecret: "public-key-example",  // Public key or secret key for verification (as a string)
            ignoreExpiration: false,  // Don't ignore expiration
            audience: "example-audience",  // Expected audience of the token
            issuer: "example-issuer"  // Expected issuer of the token
        };
        // Unit test
        it('return verifyJWT response', function () {
            let verifyJWT = verify.verifyJWT(jwtToken, options)
            expect(verifyJWT).to.be.not.null;
        });
    });
});
