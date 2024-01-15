/* eslint-disable no-undef */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var basketMgr = require('../../../../mocks/BasketMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var money = require('../../../../mocks/dw.value.Money');
var Transaction = require('../../../../mocks/dw/system/Transaction');
var OrderMgr = require('../../../../mocks/dw/order/OrderMgr');
var session = require('../../../../mocks/dw/system/Session');
session.privacy.orderNo = 'fake order no';
global.session = session;

// eslint-disable-next-line no-useless-escape
describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3.js', function () {
    var serviceHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
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
                strToJson: function () {
                    return '';
                }
            }
        },
        'dw/system/Transaction': Transaction,
        'dw/order/OrderMgr': OrderMgr,
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
            let failOrder = serviceHelper.failOrder();
            expect(failOrder).to.equal(true);
        });
    });
    describe('Sad Path', function () {
        it('Should return true', function () {
            let failOrder = serviceHelper.failOrder();
            expect(failOrder).to.equal(true);
        });
    });
});
