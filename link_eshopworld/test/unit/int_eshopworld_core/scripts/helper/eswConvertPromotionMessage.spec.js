/* eslint-disable no-undef */
let chai = require('chai');
let proxyquire = require('proxyquire').noCallThru();
let expect = chai.expect;

let basketMgr = require('../../../../mocks/BasketMgr');
let collections = require('../../../../mocks/dw.util.CollectionHelper');
let Logger = require('../../../../mocks/dw/system/Logger');
let money = require('../../../../mocks/dw.value.Money');

let getEswCalculationHelper = {
    getEswCalculationHelper: {
        getMoneyObject: function () {
            return money();
        }
    }
};

// eslint-disable-next-line no-useless-escape
describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3.js', function () {
    let serviceHelperV3 = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3', {
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
                    strToJson: function () {
                        return '';
                    }
                };
            }
        },
        '*/cartridge/scripts/helper/eswCalculationHelper': function () {
            return getEswCalculationHelper;
        },
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
        it('it Should convert promotion messaage', function () {
            let convertPromotionMessage = serviceHelperV3.convertPromotionMessage('<span class="esw-price">C$35</span>');
            expect(convertPromotionMessage).to.equal('C$35');
        });
    });
    describe('Sad Path', function () {
        it('Should return null', function () {
            let convertPromotionMessage = serviceHelperV3.convertPromotionMessage();
            expect(convertPromotionMessage).to.be.a('null');
        });
    });
});
