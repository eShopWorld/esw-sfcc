var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');

var Money = require('../../../../mocks/dw.value.Money');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var basket = require('../../../../mocks/dw/order/Basket');
var Money = require('../../../../mocks/dw.value.Money');
var session = require('../../../../mocks/dw/system/Session');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var Currency = require('../../../../mocks/dw/util/Currency');
var Logger = require('../../../../mocks/dw/system/Logger');

var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();
global.session = session;

describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3.js', function () {
    var serviceHelperV3 = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3', {
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
                        return "price";
                    },
                    getSubtotalObject: function () {
                        return {
                            available: true,
                            value: '10.99',
                            getDecimalValue: function () { return '10.99'; },
                            getCurrencyCode: function () { return 'USD'; },
                            subtract: function () { return new Money(isAvailable); }
                        };
                    },
                    isThresholdEnabled: function () {
                        return true;
                    },
                }
            }
        },
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger':  Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        } else {
                            return 'true';
                        }
                    }
                };
            }
        },
        'dw/util/Currency': Currency,
        'dw/util/StringUtils': StringUtils,
        '*/cartridge/scripts/util/collections': collections,
        'dw/order/BasketMgr': basket,
    });
    describe('Happy path', function () {
        it("it Should calculate cart discount price info", function () {
            let cartDiscountPriceInfo = serviceHelperV3.getCartDiscountPriceInfo(basket, 0);
            expect(cartDiscountPriceInfo).to.own.include({});
        });
        it("it Should calculate price discount price info", function () {
            let ProductUnitPriceInfo = serviceHelperV3.getProductUnitPriceInfo(basket.productLineItems);
            expect(ProductUnitPriceInfo).to.be.a('null');
        });
    });
    describe("Sad Path", function () {
        it("Should throw error calculate price discount return null", function () {
            let basketSubtotal = serviceHelperV3.getCartDiscountPriceInfo(null, null, null, null);
            expect(basketSubtotal).to.be.a('null');
        });
        it("Should throw error prodct price discount return null", function () {
            let ProductUnitPriceInfo = serviceHelperV3.getProductUnitPriceInfo(null);
            expect(ProductUnitPriceInfo).to.be.a('null');
        });
    });
});