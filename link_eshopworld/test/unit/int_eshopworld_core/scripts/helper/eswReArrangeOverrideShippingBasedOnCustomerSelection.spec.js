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

let isOverrideCountry = [
    {
        countryCode: 'US',
        shippingMethod: {
            ID: ['STD', 'EXP2', 'POST'] // Sample list of shipping methods for the country
        }
    }
];

let isOverrideCountryNegative = [
    {
        countryCode: 'US',
        shippingMethod: {
            ID: ['STD', 'POST'] // Sample list of shipping methods for the country
        }
    }
];

// Define the expected result
const expectedResult = [
    {
        countryCode: 'US',
        shippingMethod: {
            ID: ['EXP2', 'STD', 'POST'] // Expecting 'EXP2' to be at the front
        }
    }
];

// Mock selected shipping method to rearrange
let selectedShippingMethod = 'EXP2';

// eslint-disable-next-line no-useless-escape
describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelper.js', function () {
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
                getProductLineMetadataItemsPreference: function () {
                    return 'someattribute|someattribute';
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
        it('reset index of shipping', function () {
            let reArrangeOverrideShippingBasedOnCustomerSelection = serviceHelper.reArrangeOverrideShippingBasedOnCustomerSelection(isOverrideCountry, selectedShippingMethod);
            expect(reArrangeOverrideShippingBasedOnCustomerSelection).to.deep.equal(expectedResult);
        });
    });
    describe('Sad path', function () {
        it('send same response', function () {
            let reArrangeOverrideShippingBasedOnCustomerSelection = serviceHelper.reArrangeOverrideShippingBasedOnCustomerSelection(isOverrideCountryNegative, selectedShippingMethod);
            expect(reArrangeOverrideShippingBasedOnCustomerSelection).to.deep.equal([
                {
                    countryCode: 'US',
                    shippingMethod: {
                        ID: ['STD', 'POST'] // Sample list of shipping methods for the country
                    }
                }
            ]);
        });
    });
});
