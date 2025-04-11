var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');
var ArrayList = require('../../../../mocks/dw.util.CollectionHelper');
const URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
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
global.empty = empty(global);

global.empty = empty(global);
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

global.session = session;
global.response = globalResponse;
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
var LocalServiceRegMock = require('../../../../mocks/dw/svc/LocalServiceRegistry');
const Constants = require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants');
describe('/link_eshopworld/cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', function () {
    var eswHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', {
        '*/cartridge/scripts/util/collections': ArrayList,
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        checkRedirect: function () {},
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBasicAuthEnabled') {
                            return true;
                        } else if (value == 'eswBaseCurrency') {
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
        'dw/object/CustomObjectMgr': CustomObjectMgr,
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
        getCatalogUploadMethod: function () { return 'API'; },
        getCatalogUploadMethod: function () { return 'API'; }
    }).getEswHelper;
    describe('Happy Path', function () {
        // Unit test
        it('Fetch JWKS Keys', function () {
            let fetchJwksFromEsw = eswHelper.fetchJwksFromEsw();
            expect(fetchJwksFromEsw).to.be.an('Array');
        });
    });
    describe('Sad Path', function () {
        // Unit test
        it('return null', function () {
            global.dw = {};
            let fetchJwksFromEsw = eswHelper.fetchJwksFromEsw();
            expect(fetchJwksFromEsw).to.be.an('null');
        });
    });
    describe('validate auth Happy Path', function () {
        // Unit test
        it('return boolean', function () {
            global.request.httpHeaders = {
                get: sinon.stub(),
                authorization: {
                    equals: function () {
                        return true;
                    }
                }
            };
            let isValidEswAuthorization = eswHelper.isValidEswAuthorization();
            expect(isValidEswAuthorization).to.be.true;
        });
    });
    describe('validate auth Sad Path', function () {
        // Negative test: Missing authorization header
        it('should return false when authorization header is missing', function () {
            global.request.httpHeaders = {
                get: function () {
                    return null;
                },
                authorization: {
                    equals: function () {
                        return false;
                    }
                }
            };
            let isValidEswAuthorization = eswHelper.isValidEswAuthorization();
            expect(isValidEswAuthorization).to.be.false;
        });
    });
});
