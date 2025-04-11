var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
global.empty = empty(global);

var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();

var urlUtilsMock = {
    https: function (a, b, id) {
        return 'testURl';
    }
};

describe('int_eshopworld_sfra/cartridge/scripts/helper/preOrderRequestHelper.js', function () {
    var preOrderRequestHelper = proxyquire('../../../../../cartridges/int_eshopworld_sfra/cartridge/scripts/helper/preOrderRequestHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                // eslint-disable-next-line semi
                getOverridePriceBook: function () { return { countryCode: 'fake countryCode' } }
            }
        },
        '*/cartridge/scripts/util/collections': '',
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': urlUtilsMock,
        'dw/system/Site': siteMock,
        'dw/util/StringUtils': StringUtils,
        '*/cartridge/scripts/helper/serviceHelper': '',
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    getRedirect: function () {
                        return {
                            value: false
                        }
                    }
                }
            }
        },
        '*/cartridge/scripts/services/EswCoreService': {
            getEswServices: function () {
                return {
                    getPreorderServiceV2: function () {
                        return {
                            getOAuthService: function () {
                            }
                        }
                     },
                    getOAuthService: function () {
                    }
                }
            }
        }
    });
    describe('handlePreOrderRequestV2', function () {
        var session = {
            getCurrency: function () {
                return 'USD';
            },
            privacy: {
                fxRate: ''
            },
            customer: {
                authenticated: false
            }
        };
        
        global.session = session;
        it('Should Get order status', function () {
            let handlePreOrderRequestV2 = preOrderRequestHelper.handlePreOrderRequestV2();
            expect(handlePreOrderRequestV2).to.have.property('status');
        });
    });
    describe('preOrderRequest', function () {
        var session = {
            getCurrency: function () {
                return 'USD';
            },
            privacy: {
                fxRate: ''
            },
            customer: {
                authenticated: false
            }
        };

        global.session = session;
        let res = { redirect: function () { return 'testURl'; } };
        it('Should Get order status', function () {
            preOrderRequestHelper.preOrderRequest('', res);
        });
    });
});
