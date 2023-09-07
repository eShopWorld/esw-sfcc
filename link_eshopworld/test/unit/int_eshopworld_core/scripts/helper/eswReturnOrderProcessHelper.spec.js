var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');

var stubCookie = sinon.stub();
var stubURLUtils = sinon.stub();

var dwOrderMock = require('../../../../mocks/dw/order/Order');
var CustomObjectMgrMock = require('../../../../mocks/dw/object/CustomObjectMgr');

var reqObj = {
    ReturnOrder: {
        AppeasementType: 'Order',
        FullAppeasement: false,
        Transaction: {
            Amount: 55.12,
            Currency: 'CAD'
        },
        BrandOrderReference: 'fakeid',
        TenantCode: 'PLUGUS',
        SettlementReference: '',
        TransactionDateTime: '2023-01-25T13:56:38.4197382Z',
        TransactionReference: 'b4352716-def1-4e49-a721-7aec393d3a6b',
        Reason: 'CSP',
        UserName: 'johndoe@eshopworld.com',
        ActionedBy: 'Retailer'
    },
    Code: 0,
    Message: null
};

var transaction = {
    wrap: function (callBack) {
        return callBack.call();
    },
    begin: function () { },
    commit: function () { }
};

describe('int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', function () {
    var eswOrderProcessHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswOrderProcessHelper', {
        'dw/system/Transaction': transaction,
        'dw/web/Cookie': stubCookie,
        'dw/system/Logger': {
            debug: function (text) {
                return text;
            },
            error: function (text) {
                return text;
            }
        },
        'dw/web/URLUtils': stubURLUtils,
        'dw/object/CustomObjectMgr': CustomObjectMgrMock,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        }
                        return 'true';
                    }
                };
            }
        },
        'dw/order/Order': dwOrderMock,
        'dw/order/OrderMgr': {
            getOrder: function (text) {
                return {
                    custom: {
                        eswRmaJson: '',
                        eswIsReturned: ''
                    }
                };
            }
        }
    });
    describe('Happy path', function () {
        it('Should update order with return response', function () {
            let returnResult = eswOrderProcessHelper.markOrderAsReturn();
            expect(returnResult.ResponseCode).to.equal(400);
        });
    });
    describe('Sad Path', function () {
        it('Should throw error with false response', function () {
            reqObj = undefined;
            let returnResult = eswOrderProcessHelper.markOrderAsReturn(reqObj);
            expect(returnResult.ResponseCode).to.equal(400);
        });
    });
});
