/* eslint-disable no-undef */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const ArrayList = require('../../../../mocks/dw.util.Collection');
var basketMgr = require('../../../../mocks/BasketMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var OrderMgr = require('../../../../mocks/dw/order/OrderMgr');
var PaymentMgr = require('../../../../mocks/dw/order/PaymentMgr');
var Money = require('../../../../mocks/dw.value.Money');

var MonryObject = function (isAvailable, currency) {
    return {
        available: isAvailable,
        value: '10.99',
        getDecimalValue: function () { return '10.99'; },
        getCurrencyCode: function () { return currency; },
        subtract: function () { return new Money(isAvailable); },
        add: function () { return new Money(isAvailable); }
    };
};

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
basket.getCurrencyCode = function () {
    return {
        add: function() {
            return "";
        }
    };
};
basket.getTotalGrossPrice = function () {
    return {
        subtract: function() {
            return 10;
        }
    };
};
basket.getGiftCertificatePaymentInstruments = function () {
    return new ArrayList([{
        product: {
            online: true,
            availabilityModel: {
                getAvailabilityLevels: function () {
                    return {
                        notAvailable: {
                            value: 0
                        }
                    };
                }
            }
        },
        getPaymentTransaction: function () {
            return {
                getAmount: function () {
                    return new Money()
                }
            }
        },
        custom: {},
        productID: 'someID',
        quantityValue: 2,
        productCode: 'testId',
        name: 'testName',
        unitPrice: 'testPrice'
    }]);
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
        'dw/value/Money': MonryObject,
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
        it('it Should return gift certificate price', function () {
            let updatedPaymentInstrument = serviceHelper.getNonGiftCertificateAmount(basket);
            expect(updatedPaymentInstrument).to.be.equals(10);
        });
    });
    describe('Sad path', function () {
        it('it Should throw an error', function () {
            let updatedPaymentInstrument;
            try {
                updatedPaymentInstrument = serviceHelper.getNonGiftCertificateAmount();
            } catch (e) {
                expect(e).to.be.an.instanceof(TypeError);
            }
            expect(updatedPaymentInstrument).to.be.undefined;
        });
    });
});
