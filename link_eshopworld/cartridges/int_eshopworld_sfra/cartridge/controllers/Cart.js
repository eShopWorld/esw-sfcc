'use strict';

/**
 * @namespace Cart
 */

const server = require('server');
server.extend(module.superModule);

/**
 * Cart-Show : The Cart-Show endpoint renders the cart page with the current basket
 * @name esw/Cart-Show
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend(
    'Show',
    function (req, res, next) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        eswHelper.rebuildCartUponBackFromESW();
        return next();
    }
);

/**
 * Cart-AddCoupon : The Cart-AddCoupon endpoint is responsible for adding a coupon to a basket
 * @name Base/Cart-AddCoupon
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - couponCode - the coupon code to be applied
 * @param {querystringparameter} - csrf_token - hidden input field csrf token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.append(
    'AddCoupon',
    function (req, res, next) {
        let BasketMgr = require('dw/order/BasketMgr');
        let Transaction = require('dw/system/Transaction');
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        let CartModel = require('*/cartridge/models/cart');
        let cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        let currentBasket = BasketMgr.getCurrentBasket();
        Transaction.wrap(function () {
            if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                currentBasket.updateCurrency();
            }
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);

            basketCalculationHelpers.calculateTotals(currentBasket);
            eswHelper.removeThresholdPromo(currentBasket);
        });
        var basketModel = new CartModel(currentBasket);
        res.json(basketModel);
        return next();
    }
);
/**
 * Cart-UpdateQuantity : The Cart-UpdateQuantity endpoint handles updating the quantity of a product line item in the basket
 * @name Base/Cart-UpdateQuantity
 * @function
 * @memberof Cart
 * @param {querystringparameter} - pid - the product id
 * @param {querystringparameter} - quantity - the quantity to be updated for the line item
 * @param {querystringparameter} -  uuid - the universally unique identifier of the product object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.append('UpdateQuantity', function (req, res, next) {
    let BasketMgr = require('dw/order/BasketMgr');
    let Transaction = require('dw/system/Transaction');
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let CartModel = require('*/cartridge/models/cart');
    let cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    let currentBasket = BasketMgr.getCurrentBasket();
    Transaction.wrap(function () {
        if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
            currentBasket.updateCurrency();
        }
        cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
        basketCalculationHelpers.calculateTotals(currentBasket);
        eswHelper.removeThresholdPromo(currentBasket);
    });
    var basketModel = new CartModel(currentBasket);
    res.json(basketModel);
    return next();
}
);
module.exports = server.exports();
