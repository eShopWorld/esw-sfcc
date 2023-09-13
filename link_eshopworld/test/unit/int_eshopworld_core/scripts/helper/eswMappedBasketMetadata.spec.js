var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var collections = require('../../../../mocks/dw.util.Collection');
var basketMgr = require('../../../../mocks/BasketMgr');
var empty = require('../../../../mocks/dw.global.empty');
var CustomObjectMgr = require('../../../../mocks/dw/object/CustomObjectMgr');
var Request = require('../../../../mocks/dw/system/Request');
global.empty = empty(global);


var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
stubArrayList.size = function () {
    return 1;
};

global.request = Request;

describe('int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper.js', function () {
    var eswCoreHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreHelper', {
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
                    getCheckoutServiceName: function () {
                        return "some service";
                    },
                    getOrderDiscount: function () {
                        return "$10"
                    },
                    getSubtotalObject: function () {
                        return Money();
                    },
                    getMappedCustomerMetadata: function () {
                        return "eswMarketingOptIn|eswMarketingOptIn"
                    },
                    getUrlExpansionPairs: function () {
                        return "EXPENSAIN PAIRS"
                    },
                    getMetadataItems: function () {
                        return "some  items meta"
                    },
                    getSelectedInstance: function () {
                        return "some  selected instance"
                    },
                    getMappedBasketMetadata: function () {
                        return "some  site meta"
                    },
                    isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled: function () {
                        return "false"
                    },
                    getOverrideShipping: function () {
                        return "";
                    },
                    getAvailableCountry: function () {
                        return "some country"
                    },
                    getEShopWorldModuleEnabled : function () {
                        return true;
                    },
                    isESWSupportedCountry : function () {
                        return true;
                    },
                    checkIsEswAllowedCountry : function (param) {
                        return true;
                    },
                    getAvailableCountry : function () {
                        return true;
                    },
                    isCheckoutRegisterationEnabled : function () {
                        return true;
                    }
                }
            }
        },
        '*/cartridge/scripts/util/Constants': '',
        '*/cartridge/scripts/helper/serviceHelper': '',
        '*/cartridge/scripts/helpers/basketCalculationHelpers': '',
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger':  {
            debug: function (text) {
                return text;
            },
            error: function (text) {
                return text;
            }
        },
        'dw/object/CustomObjectMgr': CustomObjectMgr,
        checkIsEswAllowedCountry : function (param) {
            return true;
        },
        isESWSupportedCountry : function () {
            return true;
        },
        'dw/web/URLAction': function () {
            return "some url"
        },
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': {
			https: function() {
                return {};
            }
		},
        'dw/order/ShippingMgr': {
            getDefaultShippingMethod: function () {
                return defaultShippingMethod;
            },
            getShipmentShippingModel: function (shipment) {
                return createShipmentShippingModel(shipment);
            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return {}
                        } else {
                            return 'true';
                        }
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
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/helper/serviceHelperV3' : '',
    }).getEswHelper;
    describe('Happy path', function () {
        it("Should getPromoThresholdAmount", function () {
            let promotion = {
                custom: {
                    eswMinThresholdAmount: [
                        '3:,3,4,5'
                    ]
                }
            }
            let rebuildCartUponBackFromESW = eswCoreHelper.getPromoThresholdAmount(1, promotion);
            expect(rebuildCartUponBackFromESW).to.equal('0.1');
        });
    });
    describe("Sad Path", function () {
        it("Should throw error", function () {
            let promotion = undefined;
            let rebuildCartUponBackFromESW = eswCoreHelper.getPromoThresholdAmount(promotion);
            expect(rebuildCartUponBackFromESW).to.throw;
        });
    });
});