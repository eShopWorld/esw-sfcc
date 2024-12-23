
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

// Sample data
const Basket = require('../../../../mocks/dw/order/Basket');
Basket.getPriceAdjustments = function () { return []; };
Basket.getAllProductLineItems = function () { return []; };
Basket.getAllShippingPriceAdjustments = function () { return []; };
Basket.calculateTotals = function () { return 0; };

const collections = require('../../../../mocks/dw.util.CollectionHelper');
const SiteMock = require('../../../../mocks/dw/system/Site');
var Request = require('../../../../mocks/dw/system/Request');
const Money = require('../../../../mocks/dw.value.Money');
const Logger = require('../../../../mocks/dw/system/Logger'); 
global.request.httpParameters = {
    'country-code': ['en-IE']
};

describe('int_eshopworld_pwa/cartridge/scripts/helper/eswBasketHelperHL.js', function () {
    var eswBasketHelperHL = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCoreApiHelper.js', {
        'dw/system/Logger': Logger,
        'dw/system/Site': SiteMock,
        '*/cartridge/scripts/helper/eswPricingHelper': {},
        '*/cartridge/scripts/helper/eswCoreApiHelper': {},
        'dw/order/ShippingMgr': {
            getDefaultShippingMethod: function () {
                return 'defaultShippingMethod';
            },
            getShipmentShippingModel: function (shipment) {
                return shipment
            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCatalogUploadMethod: function () { return 'api'; },
                getCheckoutServiceName: function () { return 'testService'; },
                getCustomObjectDetails: function () { return {}; },
                queryAllCustomObjects: function () {
                    return [
                        { custom: 'GB' }
                    ];
                },
                getPricingAdvisorData: function () {
                    return {

                    };
                },
                formatTimeStamp: function () {
                    return 'YYYY-MM-DD';
                }
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelperHL': {
            getShopperCurrency: function () {
                return 'EUR';
            },
            isFixedPriceCountry: function () {
                return true;
            }

        },
        '*/cartridge/scripts/helper/eswHelperHL': {
            getSubtotalObject: function () {
                return {
                    available: true,
                    value: '10.99',
                    getDecimalValue: function () { return '10.99'; },
                    getCurrencyCode: function () { return 'EUR'; },
                    subtract: function () { return new Money(isAvailable); }
                };
            },
            getOrderDiscount: function () {
                return {
                    available: true,
                    value: '10.99',
                    getDecimalValue: function () { return '15.99'; },
                    getCurrencyCode: function () { return 'EUR'; },
                    subtract: function () { return new Money(isAvailable); }
                };
            },
            getFinalOrderTotalsObject: function () {
                return {
                    available: true,
                    value: '10.99',
                    getDecimalValue: function () { return '12.99'; },
                    getCurrencyCode: function () { return 'EUR'; },
                    subtract: function () { return new Money(isAvailable); }
                };
            },
            adjustThresholdDiscounts: function () {
                return {};
            },
            getEswCartShippingCost: function () {
                return {
                    available: true,
                    value: '5.00',
                    getDecimalValue: function () { return '5.00'; },
                    getCurrencyCode: function () { return 'EUR'; },
                    subtract: function () { return new Money(isAvailable); }
                };
            }
        },
        '*/cartridge/scripts/util/collections': collections
    });
    // Unit test
    it('Happy: Updates basket prices object', () => {
        Basket.custom = {
            eswSubTotal: '',
            eswOrderDiscount: '',
            eswOrderTotal: '',
            eswEstimatedShippingTotal: '',
            eswShopperCurrency: ''
        }
        eswBasketHelperHL.eswBasketPriceConversions(Basket);
    });
    it('sad: Updates basket prices object', () => {
        let inventoryResponse = eswBasketHelperHL.eswBasketPriceConversions(undefined);
        expect(inventoryResponse).to.throw;
    });
});
