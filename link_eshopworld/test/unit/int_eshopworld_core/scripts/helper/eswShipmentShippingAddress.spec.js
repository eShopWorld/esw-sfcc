/* eslint-disable no-undef */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var basketMgr = require('../../../../mocks/BasketMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var OrderMgr = require('../../../../mocks/dw/order/OrderMgr');
var basket = basketMgr.getCurrentBasket();
var defaultShipment = basket.defaultShipment;
defaultShipment.getShippingAddress = function () {
    return defaultShipment.shippingAddress;
};

// eslint-disable-next-line no-useless-escape
describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3.js', function () {
    var serviceHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {}
        },
        'dw/order/BasketMgr': '',
        'dw/system/Transaction': Transaction,
        'dw/order/OrderMgr': OrderMgr,
        '*/cartridge/scripts/helper/serviceHelperV3': '',
        'dw/system/Logger': Logger,
        'dw/util/StringUtils': '',
        'dw/web/URLUtils': '',
        'dw/util/Currency': '',
        '*/cartridge/scripts/util/collections': collections,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value === 'eswBaseCurrency') {
                            return 'some value';
                        }
                        return 'true';
                    }
                };
            }
        }
    });
    describe('Happy path', function () {
        it('it Should return shipping address', function () {
            let shipmentShippingAddress = serviceHelper.getShipmentShippingAddress(defaultShipment);
            expect(shipmentShippingAddress).to.have.property('firstName');
        });
    });
    describe('Sad Path', function () {
        it('Should return null', function () {
            let shipmentShippingAddress = serviceHelper.getShipmentShippingAddress();
            expect(shipmentShippingAddress).to.equal(null);
        });
    });
});
