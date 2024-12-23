var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var Order = require('../../../../mocks/dw/order/Order');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var CustomerMgrMock = require('../../../../mocks/dw/customer/CustomerMgr');
var CustomObjectMgrMock = require('../../../../mocks/dw/object/CustomObjectMgr');
var MoneyMock = require('../../../../mocks/dw/value/Money');
var PaymentMgrMock = require('../../../../mocks/dw/order/PaymentMgr');

const cartItem = [
    {
        product: {
            productID: 'prod001',
            shopperCurrencyProductPriceInfo: {
                price: 'USD100',
                beforeDiscount: 'USD120',
                discountAmount: 'USD20'
            },
            retailerCurrencyProductPriceInfo: {
                price: 'EUR85',
                beforeDiscount: 'EUR100',
                discountAmount: 'EUR15'
            },
            hsCode: '123456',
            isReturnProhibited: true
        },
        retailerCurrencyItemAdministration: 'EUR5',
        shopperCurrencyItemAdministration: 'USD6',
        retailerCurrencyItemDuty: 'EUR3',
        shopperCurrencyItemDuty: 'USD4',
        retailerCurrencyItemOtherTaxes: 'EUR2',
        shopperCurrencyItemOtherTaxes: 'USD2.50',
        retailerCurrencyItemSubTotal: 'EUR90',
        shopperCurrencyItemSubTotal: 'USD100',
        retailerCurrencyItemDelivery: 'EUR10',
        shopperCurrencyItemDelivery: 'USD12',
        retailerCurrencyItemDeliveryDuty: 'EUR1.50',
        shopperCurrencyItemDeliveryDuty: 'USD2',
        retailerCurrencyItemDeliveryTaxes: 'EUR1',
        shopperCurrencyItemDeliveryTaxes: 'USD1.20',
        retailerCurrencyItemUplift: 'EUR0.50',
        shopperCurrencyItemUplift: 'USD0.75',
        retailerCurrencyItemTaxes: 'EUR3',
        shopperCurrencyItemTaxes: 'USD3.50',
        retailerCurrencyItemCashOnDelivery: 'EUR7',
        shopperCurrencyItemCashOnDelivery: 'USD8',
        retailerCurrencyItemCashOnDeliveryTaxes: 'EUR0.70',
        shopperCurrencyItemCashOnDeliveryTaxes: 'USD0.80'
    }
];

const lineItem = {
    productID: 'prod001',
    custom: {} // Custom attributes that will be updated by the function
};

const obj = {
    orderId: 'ORD123456',
    shopperCurrencyCode: 'USD',
    retailerCurrencyCode: 'EUR'
};

describe('int_eshopworld_core/cartridge/scripts/helper/eswValidateOrderinventoryHelper.js', function () {
    var orderConfirmationHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', {
        'dw/customer/CustomerMgr': CustomerMgrMock,
        'dw/value/Money': MoneyMock,
        'dw/order/PaymentMgr': PaymentMgrMock,
        'dw/order/Order': Order,
        'dw/object/CustomObjectMgr': CustomObjectMgrMock,
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
    describe('Happy path', function () {
        it('it Should update EswOrderItemAttributesV2', function () {
            let updateEswOrderItemAttributesV2 = orderConfirmationHelper.updateEswOrderItemAttributesV2(obj, lineItem, cartItem);
            expect(updateEswOrderItemAttributesV2).to.be.undefined;
        });
    });
});
