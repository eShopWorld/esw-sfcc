'use strict';
var proxyquire = require('proxyquire').noCallThru();
var chai = require('chai');

var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var CustomerMgrMock = require('../../../../mocks/dw/customer/CustomerMgr');
var CustomObjectMgrMock = require('../../../../mocks/dw/object/CustomObjectMgr');
var MoneyMock = require('../../../../mocks/dw/value/Money');
var PaymentMgrMock = require('../../../../mocks/dw/order/PaymentMgr');

describe('int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper.js', function () {
    var orderConfirmationHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', {
        'dw/customer/CustomerMgr': CustomerMgrMock,
        'dw/object/CustomObjectMgr': CustomObjectMgrMock,
        'dw/order/PaymentMgr': PaymentMgrMock,
        'dw/value/Money': MoneyMock,
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getMoneyObject: function () {
                    return Money();
                },
                isEswRoundingsEnabled: function () {
                    return 'true';
                },
                applyRoundingModel: function () {
                    return 'price';
                }
            }
        },
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants'),
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
