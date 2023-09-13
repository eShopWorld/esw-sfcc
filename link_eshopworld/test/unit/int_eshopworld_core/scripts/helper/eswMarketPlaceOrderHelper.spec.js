var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');

var stubCookie = sinon.stub();
var stubURLUtils = sinon.stub();

var status = {
    OK: 'OK',
    ERROR: 'ERROR'
};

var transaction = {
    wrap: function (callBack) {
        return callBack.call();
    },
    begin: function () {},
    commit: function () {}
};

var TransactionMgr = require('../../../../mocks/dw/system/Transaction');
var LoggerMgr = require('../../../../mocks/dw/system/Logger');
var OrderMgr = require('../../../../mocks/dw/order/OrderMgr');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var integrationHelper = require('../../../../integration/integrationHelpers.spec');
var reqObj = integrationHelper.getRequest();

describe('int_eshopworld_core/cartridge/scripts/helper/marketPlaceOrderHelper.js', function () {
    var marketPlaceOrderHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/marketPlaceOrderHelper', {
        'dw/system/Transaction': TransactionMgr,
        'dw/web/Cookie': stubCookie,
        'dw/system/Logger': LoggerMgr,
        'dw/web/URLUtils': stubURLUtils,
        'dw/util/ArrayList': {},
        'dw/order/OrderMgr': OrderMgr,
        'dw/util/StringUtils': StringUtils,
        'dw/system/Status': status,
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    geteswImageType: function () { return 'fake Image'; },
                    eswInfoLogger: function () { return 'a logger function' }
                }
            }
        }
    });
    describe('Happy path', function () {
        it("Should build export json payload from order", function () {
            let returnResult = marketPlaceOrderHelper.prepareMarketPlaceOrderOrder(reqObj);
            expect(returnResult).to.include({parentBrandOrderReference: "fake-refrence"});
            
        });
    });

    describe("Sad Path", function () {
        it("Should respond null object from empty order", function () {
            reqObj = undefined;
            let returnResult = marketPlaceOrderHelper.prepareMarketPlaceOrderOrder();
            expect(returnResult).to.include({});
        });
    });
});