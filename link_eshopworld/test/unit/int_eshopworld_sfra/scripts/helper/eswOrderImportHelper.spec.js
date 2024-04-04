
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

// Sample data
const Basket = require('../../../../mocks/dw/order/Basket');
Basket.getPriceAdjustments = function () { return []; };
Basket.getAllProductLineItems = function () { return []; };
Basket.getAllShippingPriceAdjustments = function () { return []; };
Basket.calculateTotals = function () { return 0; };

const SiteMock = require('../../../../mocks/dw/system/Site');
const CookieMock = require('../../../../mocks/dw/web/Cookie');

const BasketMgr = require('../../../../mocks/dw/order/BasketMgr');
const Transaction = require('../../../../mocks/dw/system/Transaction');
const ShippingMgr = require('../../../../mocks/dw/order/ShippingMgr');
const OrderMgr = require('../../../../mocks/dw/order/OrderMgr');
const Logger = require('../../../../mocks/dw/system/Logger');
const Order = require('../../../../mocks/dw/order/Order');
const Quantity = require('../../../../mocks/dw/value/Quantity');
const collections = require('../../../../mocks/dw.util.CollectionHelper');

describe('int_eshopworld_sfra/cartridge/scripts/helper/eswOrderImportHelper.js', function () {
    var orderImportHelper = proxyquire('../../../../../cartridges/int_eshopworld_sfra/cartridge/scripts/helper/eswOrderImportHelper', {
        'dw/system/Site': SiteMock,
        'dw/web/Cookie': CookieMock,
        'dw/order/BasketMgr': BasketMgr,
        'dw/system/Transaction': Transaction,
        'dw/order/ShippingMgr': ShippingMgr,
        'dw/order/OrderMgr': OrderMgr,
        'dw/system/Logger': Logger,
        'dw/order/Order': Order,
        'dw/value/Quantity': Quantity,
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            calculateTotals: function () { return 0; }
        },
        '*/cartridge/scripts/helpers/basketCalculationHelpers': {
            calculateTotals: function () { return 0; }
        }
    });
    // Unit test
    it('should removeShippingAndProductPriceAdjustments removes all price adjustments from the basket', () => {
        let updatedBasket = orderImportHelper.removeShippingAndProductPriceAdjustments(Basket);
        expect(JSON.stringify(updatedBasket)).to.be.undefined;
    });
    it('should removeAllCreatedBaskets', function () {
        let createdBaskets = orderImportHelper.removeAllCreatedBaskets();
        expect(createdBaskets).to.be.undefined;
    });
    it('should getMatchingLineItem', function () {
        let matchedLi = orderImportHelper.getMatchingLineItem('null');
        expect(matchedLi).to.be.undefined;
    });
    it('should updateLineItemMarketPlaceAttributes', function () {
        let updatedLI = orderImportHelper.updateLineItemMarketPlaceAttributes();
        expect(updatedLI).to.be.false;
    });
    it('should validateShipmentsRecalculateBasketTotals', function () {
        let validatedBasket = orderImportHelper.updateLineItemMarketPlaceAttributes(Basket, {});
        expect(validatedBasket).to.be.false;
    });
    it('should updateEswOrderAttributes', function () {
        let eswOrderAttr = orderImportHelper.updateEswOrderAttributes(Order, {});
        expect(eswOrderAttr).to.be.undefined;
    });
    it('should handleOrderRequest', function () {
        let orderRequest = orderImportHelper.handleOrderRequest(Order, '');
        expect(orderRequest).to.be.an('object');
    });
});
