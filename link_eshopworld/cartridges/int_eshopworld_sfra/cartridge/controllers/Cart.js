'use strict';

/**
 * @namespace Cart
 */

const server = require('server');
server.extend(module.superModule);

const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * Cart-MiniCart : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Base/Cart-MiniCart
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.include
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend('MiniCart', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Base/Cart-AddProduct
 * @function
 * @memberof Cart
 * @param {httpparameter} - pid - product ID
 * @param {httpparameter} - quantity - quantity of product
 * @param {httpparameter} - options - list of product options
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend('AddProduct', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-Get : The Cart-Get endpoints is responsible for returning the current basket in JSON format
 * @name Base/Cart-Get
 * @function
 * @memberof Cart
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('Get', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

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
        eswHelper.setEnableMultipleFxRatesCurrency(req);
        eswHelper.rebuildCartUponBackFromESW();
        return next();
    }
);

/**
 * Cart-RemoveProductLineItem : The Cart-RemoveProductLineItem endpoint removes a product line item from the basket
 * @name Base/Cart-RemoveProductLineItem
 * @function
 * @memberof Cart
 * @param {querystringparameter} - pid - the product id
 * @param {querystringparameter} - uuid - the universally unique identifier of the product object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('RemoveProductLineItem', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

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
server.prepend('UpdateQuantity', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-SelectShippingMethod : The Cart-SelectShippingMethod endpoint is responsible for assigning a shipping method to the shipment in basket
 * @name Base/Cart-SelectShippingMethod
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {querystringparameter} - methodID - ID of the selected shipping method
 * @param {querystringparameter} - shipmentUUID - UUID of the shipment object
 * @param {httpparameter} - methodID - ID of the selected shipping method
 * @param {httpparameter} - shipmentUUID - UUID of the shipment object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend('SelectShippingMethod', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-MiniCartShow : The Cart-MiniCartShow is responsible for getting the basket and showing the contents when you hover over minicart in header
 * @name Base/Cart-MiniCartShow
 * @function
 * @memberof Cart
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend('MiniCartShow', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

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
server.prepend('AddCoupon', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-RemoveCouponLineItem : The Cart-RemoveCouponLineItem endpoint is responsible for removing a coupon from a basket
 * @name Base/Cart-RemoveCouponLineItem
 * @function
 * @memberof Cart
 * @param {querystringparameter} - code - the coupon code
 * @param {querystringparameter} - uuid - the UUID of the coupon line item object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('RemoveCouponLineItem', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-AddBonusProducts : The Cart-AddBonusProducts endpoint handles adding bonus products to basket
 * @name Base/Cart-AddBonusProducts
 * @function
 * @memberof Cart
 * @param {querystringparameter} - pids - an object containing: 1. totalQty (total quantity of total bonus products) 2. a list of bonus products with each index being an object containing pid (product id of the bonus product), qty (quantity of the bonus product), a list of options of the bonus product
 * @param {querystringparameter} - uuid - UUID of the mian product
 * @param {querystringparameter} - pliuud - UUID of the bonus product line item
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend('AddBonusProducts', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-EditBonusProduct : The Cart-EditBonusProduct endpoint is responsible for editing the bonus products in a basket
 * @name Base/Cart-EditBonusProduct
 * @function
 * @memberof Cart
 * @param {querystringparameter} - duuid - discount line item UUID
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('EditBonusProduct', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-GetProduct : The Cart-GetProduct endpoint handles showing the product details in a modal/quickview for editing a product in basket on cart page
 * @name Base/Cart-GetProduct
 * @function
 * @memberof Cart
 * @param {querystringparameter} - uuid - UUID of the product line item (to edit)
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('GetProduct', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-EditProductLineItem : The Cart-EditProductLineItem endpoint edits a product line item in the basket on cart page
 * @name Base/Cart-EditProductLineItem
 * @function
 * @memberof Cart
 * @param {httpparameter} - uuid - UUID of product line item being edited
 * @param {httpparameter} - pid - Product ID
 * @param {httpparameter} - quantity - Quantity
 * @param {httpparameter} - selectedOptionValueId - ID of selected option
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend('EditProductLineItem', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

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
