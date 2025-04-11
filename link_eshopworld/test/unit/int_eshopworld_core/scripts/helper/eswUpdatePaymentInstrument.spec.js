/* eslint-disable no-undef */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var basketMgr = require('../../../../mocks/BasketMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var OrderMgr = require('../../../../mocks/dw/order/OrderMgr');
var PaymentMgr = require('../../../../mocks/dw/order/PaymentMgr');

var paymentInstrument = [{
    creditCardHolder: 'fake card number',
    maskedCreditCardNumber: 'fake card number masked',
    creditCardType: 'test card type',
    creditCardExpirationMonth: 'fake month',
    creditCardExpirationYear: 'fake year',
    UUID: 'fake UUID',
    creditCardNumber: 'fake card number',
    raw: {},
    paymentTransaction: {
        paymentProcessor: ''
    },
    getPaymentMethod: function () {

    }
}];
PaymentMgr.getPaymentMethod = function () {
    return {
        getPaymentProcessor: function () {
            return 'PaymentProcessor';
        }
    };
};
var basket = basketMgr.getCurrentBasket();
basket.getPaymentInstruments = function () {
    return paymentInstrument;
};
basket.removePaymentInstrument = function () {};
basket.createPaymentInstrument = function () {
    basket.paymentInstruments = paymentInstrument;
};

// eslint-disable-next-line no-useless-escape
describe('int_eshopworld_core\cartridge\scripts\helper\serviceHelper.js', function () {
    var serviceHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {}
        },
        'dw/order/PaymentMgr': PaymentMgr,
        'dw/order/BasketMgr': '',
        'dw/system/Transaction': Transaction,
        'dw/order/OrderMgr': OrderMgr,
        '*/cartridge/scripts/helper/serviceHelperV3': '',
        'dw/system/Logger': Logger,
        'dw/util/StringUtils': '',
        'dw/web/URLUtils': '',
        'dw/util/Currency': '',
        '*/cartridge/scripts/util/collections': collections,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value === 'eswBaseCurrency') {
                            return 'some value';
                        }
                        return 'true';
                    }
                };
            }
        }
    });
    describe('Happy path', function () {
        it('it Should update Payment Instrument', function () {
            let updatedPaymentInstrument = serviceHelper.updatePaymentInstrument(basket);
            expect(updatedPaymentInstrument).to.be.undefined;
        });
    });
});
