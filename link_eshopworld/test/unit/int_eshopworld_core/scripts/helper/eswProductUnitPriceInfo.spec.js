var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var collections = require('../../../../mocks/dw.util.Collection');
var basketMgr = require('../../../../mocks/BasketMgr');
var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
global.empty = empty(global);
basketMgr.currentBasket = {};

var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();

let item = {
    basePrice: {
        value: '$10'
    },
    quantity: {
        value: 1
    },
    priceAdjustment: [
        {
            appliedDiscount: {
                type: 'FIXED_PRICE',
                fixedPrice: '$10',
                quantity: 1
            }
        }
    ]
};

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: ''
    }
};

global.session = session;

describe('int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', function () {
    var eswCoreHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3', {
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
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': {
            debug: function (text) {
                return text;
            },
            error: function (text) {
                return text;
            }
        },
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
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
        },
        'dw/util/Currency': {
            getCurrency: function () {
                return 'currency';
            }
        },
        'dw/util/StringUtils': {
            formatMoney: function () {
                return 'formatted money';
            }
        },
        '*/cartridge/scripts/util/collections': {
            forEach: function () {
                return collections.forEach;
            }
        },
        'dw/order/BasketMgr': basketMgr
    });
    describe('Happy path', function () {
        it('it Should Get product unit price', function () {
            let productPriceInfo = eswCoreHelper.getProductUnitPriceInfo(item);
            expect(productPriceInfo).to.have.property('price');
        });
    });
    describe('Sad Path', function () {
        it('Should throw error', function () {
            let item;
            let productPriceInfo = eswCoreHelper.getProductUnitPriceInfo(item);
            expect(productPriceInfo).to.throw;
        });
    });
});
