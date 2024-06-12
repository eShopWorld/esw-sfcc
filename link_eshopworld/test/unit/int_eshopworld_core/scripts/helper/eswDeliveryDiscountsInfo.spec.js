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
        'dw/system/Logger': Logger,
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants'),
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
        it('should getDeliveryDiscountsInfo from provided currency', function () {
            let deliveryOptions = {
                deliveryOptionPriceInfo: {
                    discounts: [{
                        title: '',
                        description: '',
                        discount: {
                            shopper: ''
                        },
                        beforeDiscount: {
                            shopper: ''
                        }
                    }]
                }
            };
            let deliveryDiscount = orderConfirmationHelper.getDeliveryDiscountsInfo(deliveryOptions, 'shopper');
            chai.expect(JSON.stringify(deliveryDiscount)).to.equal('[{"deliveryOptionsPriceInfo":{"discounts":[[{"title":"","description":"","discount":{"shopper":""},"beforeDiscount":{"shopper":""}}]]}}]');
        });
    });
    describe('Sad Path', function () {
        it('should getDeliveryDiscountsInfo from provided undefined', function () {
            let deliveryOptions = null;
            let deliveryDiscount = orderConfirmationHelper.getDeliveryDiscountsInfo(deliveryOptions);
            chai.expect(deliveryDiscount).to.be.an('array').that.is.empty;
        });
    });
});
