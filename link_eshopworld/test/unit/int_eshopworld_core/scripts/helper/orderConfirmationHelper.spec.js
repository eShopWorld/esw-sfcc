'use strict';
var proxyquire = require('proxyquire').noCallThru();
var chai = require('chai');

var Order = require('../../../../mocks/dw/order/Order');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var CustomerMgrMock = require('../../../../mocks/dw/customer/CustomerMgr');
var CustomObjectMgrMock = require('../../../../mocks/dw/object/CustomObjectMgr');
var MoneyMock = require('../../../../mocks/dw/value/Money');
var PaymentMgrMock = require('../../../../mocks/dw/order/PaymentMgr');

let ocPayload = {
    lineItems: [],
    paymentDetails: [
        {
            isOverCounter: true
        }
    ]
};

let dwOrder = {
    setPaymentStatus: function (status) {
        return '';
    },
    setExportStatus: function (status) {
        return '';
    },
    setConfirmationStatus: function (status) {
        return '';
    },
    paymentInstruments: [
        {
            paymentTransaction: {
                custom: {
                    eswPaymentAmount: '',
                    eswPaymentMethodCardBrand: ''
                }
            }
        }
    ],
    custom: {
        eswKonbiniPayloadJson: true
    }
};

describe('int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper.js', function () {
    var orderConfirmationHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', {
        'dw/customer/CustomerMgr': CustomerMgrMock,
        'dw/order/Order': Order,
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
    describe('Success', function () {
        it('should updateOrderLevelAttrV3', function () {
            let orderModified = Order;
            orderModified.custom = { eswShopperCurrencyOrderDiscountsInfo: 12, eswRetailerCurrencyOrderDiscountsInfo: 10 };
            let updateOrderAttrResult = orderConfirmationHelper.updateOrderLevelAttrV3({
                cartDiscountPriceInfo: {
                    price: {
                        retailer: {
                            currency: 'EUR',
                            amount: '309.05'
                        },
                        shopper: {
                            currency: 'CAD',
                            amount: '478.16'
                        }
                    },
                    discounts: [
                        {
                            title: 'QA_order_amount_off',
                            description: 'QA_order_amount_off',
                            discount: {
                                retailer: {
                                    currency: 'EUR',
                                    amount: '13.77'
                                },
                                shopper: {
                                    currency: 'CAD',
                                    amount: '21.30'
                                }
                            },
                            beforeDiscount: {
                                retailer: {
                                    currency: 'EUR',
                                    amount: '322.81'
                                },
                                shopper: {
                                    currency: 'CAD',
                                    amount: '499.46'
                                }
                            }
                        }
                    ]
                }
            }, orderModified);
            chai.expect(updateOrderAttrResult.eswShopperCurrencyOrderDiscountsInfo).to.equal('[{"title":"QA_order_amount_off","description":"QA_order_amount_off","discount":{"shopper":{"currency":"CAD","amount":"21.30"}},"beforeDiscount":{"shopper":{"currency":"CAD","amount":"499.46"}}}]');
            chai.expect(updateOrderAttrResult.eswRetailerCurrencyOrderDiscountsInfo).to.equal('[{"title":"QA_order_amount_off","description":"QA_order_amount_off","discount":{"retailer":{"currency":"EUR","amount":"13.77"}},"beforeDiscount":{"retailer":{"currency":"EUR","amount":"322.81"}}}]');
        });
        it('should getItemDiscountsInfo for shopper', function () {
            let itemDiscount = orderConfirmationHelper.getItemDiscountsInfo([{
                title: 'QA_product_promo_fixed_price',
                description: 'QA_product_promo_fixed_price',
                discount: {
                    retailer: {
                        currency: 'EUR',
                        amount: '26.98'
                    },
                    shopper: {
                        currency: 'CAD',
                        amount: '41.54'
                    }
                },
                beforeDiscount: {
                    retailer: {
                        currency: 'EUR',
                        amount: '33.90'
                    },
                    shopper: {
                        currency: 'CAD',
                        amount: '52.19'
                    }
                }
            }], 'shopper', 'ProductLevelDiscount');
            chai.expect(JSON.stringify(itemDiscount)).to.equal('[{"title":"QA_product_promo_fixed_price","description":"QA_product_promo_fixed_price","discount":{"shopper":{"currency":"CAD","amount":"41.54"}},"beforeDiscount":{"shopper":{"currency":"CAD","amount":"52.19"}}}]');
        });
        it('should getItemDiscountsInfo for retailer', function () {
            let itemDiscount = orderConfirmationHelper.getItemDiscountsInfo([{
                title: 'QA_product_promo_fixed_price',
                description: 'QA_product_promo_fixed_price',
                discount: {
                    retailer: {
                        currency: 'EUR',
                        amount: '26.98'
                    },
                    shopper: {
                        currency: 'CAD',
                        amount: '41.54'
                    }
                },
                beforeDiscount: {
                    retailer: {
                        currency: 'EUR',
                        amount: '33.90'
                    },
                    shopper: {
                        currency: 'CAD',
                        amount: '52.19'
                    }
                }
            }], 'retailer', 'ProductLevelDiscount');
            chai.expect(JSON.stringify(itemDiscount)).to.equal('[{"title":"QA_product_promo_fixed_price","description":"QA_product_promo_fixed_price","discount":{"retailer":{"currency":"EUR","amount":"26.98"}},"beforeDiscount":{"retailer":{"currency":"EUR","amount":"33.90"}}}]');
        });
    });
    describe('processKonbiniOrderConfirmation', function () {
        describe('Happy path', function () {
            it('Should return boolean', function () {
                let returnResult = orderConfirmationHelper.processKonbiniOrderConfirmation(ocPayload, dwOrder);
                chai.expect(returnResult).to.equal(false);
            });
        });
        describe('Sad path', function () {
            it('Should return boolean', function () {
                let returnResult = orderConfirmationHelper.processKonbiniOrderConfirmation();
                chai.expect(returnResult).to.equal(false);
            });
        });
    });
});
