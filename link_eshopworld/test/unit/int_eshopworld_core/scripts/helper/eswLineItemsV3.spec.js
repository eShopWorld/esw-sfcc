/* eslint-disable no-undef */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var ArrayList = require('../../../../mocks/dw.util.Collection');
var basketMgr = require('../../../../mocks/BasketMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var money = require('../../../../mocks/dw.value.Money');
var Transaction = require('../../../../mocks/dw/system/Transaction');

var productLineItems1 = new ArrayList([{
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
    custom: {},
    productID: 'someID',
    quantityValue: 2
}]);

basketMgr.productLineItems = productLineItems1;

// eslint-disable-next-line no-useless-escape
describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3.js', function () {
    var serviceHelperV3 = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3', {
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    getMoneyObject: function () {
                        return money();
                    },
                    isEswRoundingsEnabled: function () {
                        return 'true';
                    },
                    applyRoundingModel: function () {
                        return 'price';
                    },
                    isThresholdEnabled: function () {
                        return true;
                    },
                    getProductLineMetadataItemsPreference: function () {
                        return 'someattribute|someattribute';
                    },
                    getOrderDiscount: function () {
                        return money()
                    },
                }
            }
        },
        'dw/system/Transaction': Transaction,
        'dw/order/OrderMgr': '',
        '*/cartridge/scripts/helper/serviceHelperV3': '',
        'dw/system/Logger': Logger,
        'dw/util/StringUtils': '',
        'dw/web/URLUtils': '',
        'dw/util/Currency': {
            getCurrency: function () {
                return {
                    symbol: '$'
                };
            }
        },
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/util/collections': collections,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function () {}
                };
            }
        }
    });
    describe('Happy path', function () {
        it('it Should return lineitems V3', function () {
            let lineItemsV3 = serviceHelperV3.getLineItemsV3(basketMgr);
            expect(lineItemsV3).to.have.property('lineItems');
        });
    });
    describe('Happy path', function () {
        it('it Should return lineitems V3 Object', function () {
            let lineItemsV3 = serviceHelperV3.getLineItemsV3();
            expect(lineItemsV3).to.have.property('finalCartSubtotal');
        });
    });
});
