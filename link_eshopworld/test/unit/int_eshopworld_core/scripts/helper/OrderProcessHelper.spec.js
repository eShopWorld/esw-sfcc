var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');

var stubCookie = sinon.stub();
var stubURLUtils = sinon.stub();

var dwOrderMock = require('../../../../mocks/dw/order/Order');
var CustomObjectMgrMock = require('../../../../mocks/dw/object/CustomObjectMgr');
var cancelOrderReqObj = {
    Code: 0,
    Message: null,
    Request: {
        BrandOrderReference: 'STG00002808',
        TenantCode: 'PAZPAZ',
        SettlementReference: null,
        TransactionDateTime: '2023-03-28T11:57:27.417Z',
        TransactionReference: '7fb1471e-ca03-49de-aedd-090b6b54c0b1',
        Reason: null,
        UserName: 'smooney@eshopworld.com',
        ActionedBy: 'Retailer'
    },
    RefundAmounts: [
        {
            Name: 'Items',
            Value: {
                Amount: 554.17,
                Currency: 'EUR'
            }
        },
        {
            Name: 'ItemDuties',
            Value: {
                Amount: 0,
                Currency: 'EUR'
            }
        },
        {
            Name: 'ItemTaxes',
            Value: {
                Amount: 110.83,
                Currency: 'EUR'
            }
        },
        {
            Name: 'Delivery',
            Value: {
                Amount: 11.67,
                Currency: 'EUR'
            }
        },
        {
            Name: 'DeliveryDuties',
            Value: {
                Amount: 0,
                Currency: 'EUR'
            }
        },
        {
            Name: 'DeliveryTaxes',
            Value: {
                Amount: 2.33,
                Currency: 'EUR'
            }
        },
        {
            Name: 'Total',
            Value: {
                Amount: 679,
                Currency: 'EUR'
            }
        }
    ],
    RefundAmountsInRetailerCurrency: [
        {
            Name: 'Items',
            Value: {
                Amount: 554.17,
                Currency: 'EUR'
            }
        },
        {
            Name: 'ItemDuties',
            Value: {
                Amount: 0,
                Currency: 'EUR'
            }
        },
        {
            Name: 'ItemTaxes',
            Value: {
                Amount: 110.83,
                Currency: 'EUR'
            }
        },
        {
            Name: 'Delivery',
            Value: {
                Amount: 11.67,
                Currency: 'EUR'
            }
        },
        {
            Name: 'DeliveryDuties',
            Value: {
                Amount: 0,
                Currency: 'EUR'
            }
        },
        {
            Name: 'DeliveryTaxes',
            Value: {
                Amount: 2.33,
                Currency: 'EUR'
            }
        },
        {
            Name: 'Total',
            Value: {
                Amount: 679,
                Currency: 'EUR'
            }
        }
    ]
};
var returnReqObj = {
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

var appeasedReqObj = {
    Request: {
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
        UserName: 'johandoe@eshopworld.com',
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

describe('int_eshopworld_core/cartridge/scripts/helper/eswOrderProcessHelper.js', function () {
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
    describe('OrderReturn', function () {
        describe('Happy path', function () {
            it('Should update order with return response', function () {
                let returnResult = eswOrderProcessHelper.markOrderAsReturn(returnReqObj);
                expect(returnResult.ResponseCode).to.equal(400);
            });
        });
        describe('Sad Path', function () {
            it('Should throw error with false response', function () {
                let returnResult = eswOrderProcessHelper.markOrderAsReturn(undefined);
                expect(returnResult.ResponseCode).to.equal(400);
            });
        });
    });

    describe('OrderAppeasement', function () {
        describe('Happy path', function () {
            it('Should update order appeasement status with request JSON', function () {
                let returnResult = eswOrderProcessHelper.markOrderAppeasement(appeasedReqObj);
                expect(returnResult).to.include({ ResponseCode: '200' });
            });
        });
        describe('Sad Path', function () {
            it('Should throw error with error response', function () {
                appeasedReqObj = undefined;
                let returnResult = eswOrderProcessHelper.markOrderAppeasement(appeasedReqObj);
                expect(returnResult).to.include({ ResponseCode: '400' });
            });
        });
    });

    describe('CancelOrder', function () {
        describe('Sad Path', function () {
            it('Should throw error', function () {
                let returnResult = eswOrderProcessHelper.cancelAnOrder(cancelOrderReqObj);
                expect(returnResult.ResponseCode).to.equal('400');
            });
        });
    });
});
