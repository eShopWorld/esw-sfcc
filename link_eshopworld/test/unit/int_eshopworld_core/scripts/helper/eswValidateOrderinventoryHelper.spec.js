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

describe('int_eshopworld_core/cartridge/scripts/helper/eswValidateOrderinventoryHelper.js', function () {
    var orderConfirmationHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', {
        'dw/customer/CustomerMgr': CustomerMgrMock,
        'dw/value/Money': MoneyMock,
        'dw/order/PaymentMgr': PaymentMgrMock,
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
        it('it Should calculate order items inventory', function () {
            let inventoryResponse = orderConfirmationHelper.validateEswOrderInventory(Order);
            expect(inventoryResponse).to.be.true;
        });
    });
    describe('Sad Path', function () {
        it('Should throw error', function () {
            var err = new TypeError('Cannot read properties of undefined');
            let inventoryResponse = orderConfirmationHelper.validateEswOrderInventory();
            expect(inventoryResponse).to.throw;
        });
    });
});
