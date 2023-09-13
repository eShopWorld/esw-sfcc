/* eslint-disable no-undef */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var basketMgr = require('../../../../mocks/BasketMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var money = require('../../../../mocks/dw.value.Money');
var Transaction = require('../../../../mocks/dw/system/Transaction');
var ProductLineItem = require('../../../../mocks/dw/order/ProductLineItem');
ProductLineItem.custom = {};

// eslint-disable-next-line no-useless-escape
describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelper.js', function () {
    var serviceHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelper', {
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
                    }
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
        it('it Should failr order', function () {
            let productLineMetadataItems = serviceHelper.getProductLineMetadataItems(ProductLineItem);
            expect(productLineMetadataItems).to.equal(null);
        });
    });
    describe('Sad Path', function () {
        it('Should return true', function () {
            let productLineMetadataItems = serviceHelper.getProductLineMetadataItems();
            expect(productLineMetadataItems).to.equal(null);
        });
    });
});
