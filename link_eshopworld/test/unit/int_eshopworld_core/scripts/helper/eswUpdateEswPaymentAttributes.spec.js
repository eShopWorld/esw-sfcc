'use strict';
var proxyquire = require('proxyquire').noCallThru();
var chai = require('chai');

var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var CustomerMgrMock = require('../../../../mocks/dw/customer/CustomerMgr');
var CustomObjectMgrMock = require('../../../../mocks/dw/object/CustomObjectMgr');

describe('int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper.js', function () {
    var orderConfirmationHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', {
        'dw/customer/CustomerMgr': CustomerMgrMock,
        'dw/object/CustomObjectMgr': CustomObjectMgrMock,
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    getMoneyObject: function () {
                        return Money();
                    },
                    isEswRoundingsEnabled: function () {
                        return 'true';
                    },
                    applyRoundingModel: function () {
                        return 'price';
                    }
                };
            }
        },
        'dw/system/Logger': Logger,
        '*/cartridge/scripts/util/collections': collections,
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
        }
    }).getEswOcHelper();
    describe('Success', function () {
        it('should updateEswPaymentAttributes', function () {
            let order = {
                paymentInstruments: [
                    {
                        creditCardHolder: 'someName',
                        maskedCreditCardNumber: 'someMaskedNumber',
                        creditCardType: 'someCardType',
                        creditCardExpirationMonth: 'someMonth',
                        creditCardExpirationYear: 'someYear',
                        UUID: 'someUUID',
                        creditCardNumber: 'someNumber',
                        paymentTransaction: {
                            custom: {
                                eswPaymentAmount: '',
                                eswPaymentMethodCardBrand: ''
                            }
                        }
                    }
                ]
            };
            let updateEswPaymentAttributes = orderConfirmationHelper.updateEswPaymentAttributes(order, 25, 'testCrad');
            chai.expect(updateEswPaymentAttributes).to.be.an('undefined');
        });
    });
});
