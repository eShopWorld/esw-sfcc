var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var basketMgr = require('../../../../mocks/BasketMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var money = require('../../../../mocks/dw.value.Money');

describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3.js', function () {
    var serviceHelperV3 = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3', {
        '*/cartridge/scripts/helper/eswPwaCoreHelper': {
            getCountryDetailByParam: function () { return null; }
        },
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
                }
            }
        },
        'dw/system/Logger': Logger,
        'dw/util/StringUtils': '',
        'dw/web/URLUtils': '',
        'dw/util/Currency': '',
        'dw/order/BasketMgr': basketMgr,
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
    });
    describe('Happy path', function () {
        it('it Should calculate basket delivery discounts', function () {
            let deliveryDiscounts = serviceHelperV3.getDeliveryDiscounts(basketMgr.getCurrentBasket(), false);
            expect(deliveryDiscounts).to.have.property('ShippingDiscounts');
        });
    });
    describe('Sad Path', function () {
        it('Should return null', function () {
            let deliveryDiscounts = serviceHelperV3.getDeliveryDiscounts(null, false);
            expect(deliveryDiscounts).to.be.a('null');
        });
    });
});
