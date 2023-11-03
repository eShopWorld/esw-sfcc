'use strict';
var proxyquire = require('proxyquire').noCallThru();
var chai = require('chai');

var Order = require('../../../../mocks/dw/order/Order');
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
});
