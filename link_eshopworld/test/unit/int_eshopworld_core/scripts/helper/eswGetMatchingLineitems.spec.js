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
collections.find = function (collection, match, scope) {
    var result = null;

    if (collection) {
        var iterator = collection.iterator();
        while (iterator.hasNext()) {
            var item = iterator.next();
            if (scope ? match.call(scope, item) : match(item)) {
                result = item;
                break;
            }
        }
    }

    return result;
};


var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();

global.request = Request;

describe('int_eshopworld_core/cartridge/scripts/helper/eswOrderImportHelper.js', function () {
    var eswOrderImportHelper = proxyquire('../../../../../cartridges/int_eshopworld_sfra/cartridge/scripts/helper/eswOrderImportHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
        },
        '*/cartridge/scripts/helper/serviceHelper': '',
        '*/cartridge/scripts/helpers/basketCalculationHelpers': '',
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/order/OrderMgr': '',
        'dw/order/Order': '',
        'dw/value/Quantity': '',
        '*/cartridge/scripts/checkout/checkoutHelpers': '',
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
        '*/cartridge/scripts/util/collections': collections,
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/helper/serviceHelperV3' : '',
    });
    describe('Happy path', function () {
        it("Should get matching lineitems", function () {
            let matchingLineItem = eswOrderImportHelper.getMatchingLineItem('someID');
            expect(matchingLineItem).to.have.property('productID');
        });
    });
    describe("Sad Path", function () {
        it("Should throw error", function () {
            let basket = undefined;
            let matchingLineItem = eswOrderImportHelper.getMatchingLineItem(basket);
            expect(matchingLineItem).to.throw;
        });
    });
});