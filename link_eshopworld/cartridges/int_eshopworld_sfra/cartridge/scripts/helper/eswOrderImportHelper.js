'use strict';

/**
 * Helper script support ESW Pre Order Request.
 **/

const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const ShippingMgr = require('dw/order/ShippingMgr');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Order = require('dw/order/Order');
const Quantity = require('dw/value/Quantity');

const collections = require('*/cartridge/scripts/util/collections');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

 /**
 * @description removes applied price adjustments from basket
 * @param  {dw.order.Basket} basket - Current users's basket
 * @returns {dw.order.Basket} basket - Current users's basket
 */
function removeShippingAndProductPriceAdjustments(basket) {
    // Removing order level price adjustments
    let orderPriceAdjustments = basket.getPriceAdjustments();
    collections.forEach(orderPriceAdjustments, function (orderPriceAdjustment) {
        basket.removePriceAdjustment(orderPriceAdjustment);
    });

    // Removing product price adjustments from line items
    collections.forEach(basket.getAllProductLineItems(), function (productLineItem) {
        collections.forEach(productLineItem.getPriceAdjustments(), function (priceAdjustment) {
            productLineItem.removePriceAdjustment(priceAdjustment);
        });
    });

    // Removing shipping price adjustments
    collections.forEach(basket.getAllShippingPriceAdjustments(), function (shippingPriceAdjustment) {
        basket.removeShippingPriceAdjustment(shippingPriceAdjustment);
    });

    basketCalculationHelpers.calculateTotals(basket, true);
    return basket;
}

/**
 * Remove all previously created baskets.
 */
function removeAllCreatedBaskets() {
    let basket = BasketMgr.getCurrentBasket();
    if (basket && basket.productQuantityTotal > 0) {
        basket = removeShippingAndProductPriceAdjustments(basket);
        let productLineItems = basket.getAllProductLineItems();
        for (let i = 0; i < productLineItems.length; i++) {
            let item = productLineItems[i];
            basket.removeProductLineItem(item);
            let shipmentToRemove = item.shipment;
            if (shipmentToRemove) {
                basket.removeShipment(shipmentToRemove);
            }
        }
        basketCalculationHelpers.calculateTotals(basket);
    }
}

/**
 * Function is used to return matching line item from current basket
 * @param  {string} lineItem - lineItem ID
 * @returns {dw.order.LineItem} lineItem - Current lineItem
 */
function getMatchingLineItem(lineItem) {
    let currentBasket = BasketMgr.getCurrentBasket();
    let matchingLineItem;
    if (currentBasket != null) {
        matchingLineItem = collections.find(currentBasket.productLineItems, function (item) {
            return item.productID === lineItem;
        });
    }
    return matchingLineItem;
}

/**
 * Function is used to update market place custom attribute to SFCC order item
 * @param  {dw.order.LineItem} matchingLineItem - matchingLineItem
 * @param {Object} item - Current item
 * @returns {boolean} boolean
 */
function updateLineItemMarketPlaceAttributes(matchingLineItem, item) {
    try {
        /* eslint-disable no-param-reassign */
        matchingLineItem.custom.estimatedDeliveryDateFromRetailer = item.estimatedDeliveryDateFromRetailer ? item.estimatedDeliveryDateFromRetailer : '';
        matchingLineItem.custom.customsDescription = item.product.customsDescription ? item.product.customsDescription : '';
        matchingLineItem.custom.hsCode = item.product.hsCode ? item.product.hsCode : '';
        matchingLineItem.custom.countryOfOriginIso = item.product.countryOfOriginIso ? item.product.countryOfOriginIso : '';
        matchingLineItem.custom.isReturnProhibited = item.product.isReturnProhibited ? item.product.isReturnProhibited : false;
        matchingLineItem.custom.metadataItems = item.metadataItems ? JSON.stringify(item.metadataItems) : '';
        matchingLineItem.custom.productUnitPriceInfo = item.product.productUnitPriceInfo ? JSON.stringify(item.product.productUnitPriceInfo) : {};
        // eslint-disable-next-line radix
        matchingLineItem.custom.lineItemId = item.lineItemId ? parseInt(item.lineItemId) : 0;
        return true;
    } catch (error) {
        Logger.error('Error while updating lineitem custom attributes Error: ' + error.toString());
        return false;
    }
}

/**
 * Remove all previously created baskets.
 * @param {Object} lineItems - lineItems
 * @param {dw.order.Basket} basket - basket
 * @returns {boolean} boolean
 */
function addItemsToBasket(lineItems, basket) {
    let cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    let childProducts = [],
        options = [],
        result,
        item,
        product;
    try {
        for (let i = 0; i < lineItems.length; i++) {
            item = lineItems[i];
            let matchingLineItem;
            product = item.product;
            result = cartHelper.addProductToCart(
                basket,
                product.productCode,
                item.quantity,
                childProducts,
                options
            );
            if (!result.error) {
                matchingLineItem = getMatchingLineItem(product.productCode);
                if (matchingLineItem) {
                    updateLineItemMarketPlaceAttributes(matchingLineItem, item);
                }
            }
        }
        if (!result.error) {
            cartHelper.ensureAllShipmentsHaveMethods(basket);
            basketCalculationHelpers.calculateTotals(basket);
        }
        return true;
    } catch (error) {
        Logger.error('Error while adding lineitem items to basket Error: ' + error.toString());
        return false;
    }
}

/**
 * add Customer's address to current basket
 * @param {Object} contactDetails - contactDetails
 * @param {dw.order.Basket} basket - basket
 */
function addBasketShipment(contactDetails, basket) {
    basket.setCustomerEmail(contactDetails.email);
    // Create Basket Shipping Address
    let shipment = basket.getDefaultShipment();
    let shippingAddress = shipment.createShippingAddress();
    shippingAddress.setFirstName(contactDetails.firstName);
    shippingAddress.setLastName(contactDetails.lastName);
    shippingAddress.setAddress1(contactDetails.address1);
    shippingAddress.setAddress2(contactDetails.address2);
    shippingAddress.setCity(contactDetails.city);
    shippingAddress.setPostalCode(contactDetails.postalCode);
    shippingAddress.setStateCode(contactDetails.region);
    shippingAddress.setCountryCode(contactDetails.country);
    shippingAddress.setPhone(contactDetails.telephone);
}

/**
 * Apply price adjustment on current basket to keep order total zero
 * @param {dw.order.Basket} basket - basket
 */
function applyPriceAdjustments(basket) {
    // eslint-disable-next-line no-param-reassign
    basket = removeShippingAndProductPriceAdjustments(basket);
    let PercentageDiscount = require('dw/campaign/PercentageDiscount');
    collections.forEach(basket.getAllProductLineItems(), function (productLineItem) {
        productLineItem.createPriceAdjustment('ExternalLineItemPromotion', new PercentageDiscount(100.00));
    });
    collections.forEach(basket.getDefaultShipment().getShippingLineItems(), function (shippingLineItem) {
        shippingLineItem.createShippingPriceAdjustment('ExternalShippingPromotion', new PercentageDiscount(100.00));
    });
    basket.createPriceAdjustment('ExternalBasketPromotion', new PercentageDiscount(100.00));
    basketCalculationHelpers.calculateTotals(basket);
}

/**
 * add Customer's billing address to current basket
 * @param {Object} billingDetails - billingDetails
 * @param {dw.order.Basket} basket - basket
 */
function addBillingAddress(billingDetails, basket) {
    // Create Basket Billing Address
    let billingAddress = basket.createBillingAddress();
    billingAddress.setFirstName(billingDetails.firstName);
    billingAddress.setLastName(billingDetails.lastName);
    billingAddress.setAddress1(billingDetails.address1);
    billingAddress.setAddress2(billingDetails.address2);
    billingAddress.setCity(billingDetails.city);
    billingAddress.setPostalCode(billingDetails.postalCode);
    billingAddress.setStateCode(billingDetails.stateCode);
    billingAddress.setCountryCode(billingDetails.country);
    billingAddress.setPhone(billingDetails.telephone);
}

/**
 * add Customer's address to current basket
 * @param {dw.order.Basket} basket - basket
 * @returns {dw.order.Order} order - order
 */
function createOrder(basket) {
    let orderResponse = { error: false, order: null };
    // Create order and handle error case
    try {
        orderResponse.order = OrderMgr.createOrder(basket);
    } catch (e) {
        Logger.error('Error while creating order and Error is : ' + e.toString());
        orderResponse.error = true;
    }
    return orderResponse;
}

/**
 * Validate shipments and recaluculate basket
 * @param {dw.order.Basket} basket - basket
 * @param {Object} req - req
 * @returns {dw.order.Basket} basket - basket
 */
function validateShipmentsRecalculateBasketTotals(basket, req) {
    let shipments = basket.shipments;
    let defaultShipment = basket.defaultShipment;
    // combine multiple shipments into a single one
    collections.forEach(shipments, function (shipment) {
        if (!shipment.default) {
            collections.forEach(shipment.productLineItems, function (lineItem) {
                lineItem.setShipment(defaultShipment);
            });
            basket.removeShipment(shipment);
        }
    });

    let defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
    defaultShipment.setShippingMethod(defaultShippingMethod);
    COHelpers.ensureNoEmptyShipments(req);
    COHelpers.recalculateBasket(basket);
    return basket;
}

/**
 * updated ESW order custom attributes
 * @param {dw.order.Order} order - order
 * @param {Object} obj - obj
 */
function updateEswOrderAttributes(order, obj) {
    try {
        Transaction.wrap(function () {
            order.custom.nonCheckoutEcommerce = true;
            order.custom.parentBrandOrderReference = obj.parentBrandOrderReference;
            order.custom.transactionReference = obj.transactionReference ? obj.transactionReference : '';
            order.custom.shopperCurrencyIso = obj.shopperCurrencyIso;
            order.custom.retailerCurrencyIso = obj.retailerCurrencyIso;
            order.custom.deliveryCountryIso = obj.deliveryCountryIso ? obj.deliveryCountryIso : '';
            order.custom.deliveryOption = obj.deliveryOption ? JSON.stringify(obj.deliveryOption) : '';
            order.custom.metadataItems = obj.metadataItems ? JSON.stringify(obj.metadataItems) : '';
            order.custom.retailerInvoice = obj.retailerInvoice ? JSON.stringify(obj.retailerInvoice) : '';
            order.custom.shopperExperience = obj.shopperExperience ? JSON.stringify(obj.shopperExperience) : '';
            order.custom.orderPayment = obj.payment ? JSON.stringify(obj.payment) : '';
            order.custom.orderType = obj.orderType ? obj.orderType : '';
            order.custom.contactDetails = obj.contactDetails ? JSON.stringify(obj.contactDetails) : '';
            order.custom.originDetails = obj.originDetails ? JSON.stringify(obj.originDetails) : '';
            order.custom.transactionDateTime = obj.transactionDateTime ? obj.transactionDateTime : '';
            order.custom.actionedByUser = obj.actionedByUser ? obj.actionedByUser : '';
            order.custom.actionedBy = obj.actionedBy && obj.actionedBy !== 'None' ? obj.actionedBy : '';
        });
    } catch (error) {
        Logger.error('Error while updating order custom attributes Error: ' + error.toString());
    }
}

/**
 * updated ESW order custom attributes
 * @param {dw.order.Order} order - order
 */
function placeOrder(order) {
    try {
        Transaction.wrap(function () {
            OrderMgr.placeOrder(order);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
        });
    } catch (error) {
        Logger.error('Error while placing order Error: ' + error.toString());
    }
}

/**
 * updated ESW order custom attributes
 * @param {dw.order.Order} order - order
 */
function applyShippingAdjustment(order) {
    try {
        Transaction.wrap(function () {
            collections.forEach(order.getAllProductLineItems(), function (productLineItem) {
                if (productLineItem.shippingLineItem) {
                    productLineItem.shippingLineItem.setPriceValue(Number(0));
                    productLineItem.shippingLineItem.setQuantity(new Quantity(0, productLineItem.quantity.getUnit()));
                    productLineItem.shippingLineItem.setSurcharge(false);
                    productLineItem.shippingLineItem.updateTax(Number(0));
                }
            });
            order.updateTotals();
        });
    } catch (error) {
        Logger.error('Error while updating order shipping cost Error: ' + error.toString());
    }
}

/**
 * Handle Pre-Order V2. It prepares Pre-Order service request and calls it.
 * @param {Object} orderJson - current orderJson object
 * @param {Object} req - request
 * @returns {Object} responseObj - responseObj
 */
function handleOrderRequest(orderJson, req) {
    let basket,
        orderResponse,
        order,
        responseObj = { success: true };
    if (!empty(orderJson)) {
        try {
            Transaction.wrap(function () {
                removeAllCreatedBaskets();
                basket = dw.order.BasketMgr.getCurrentOrNewBasket();
                addItemsToBasket(!empty(orderJson.lineItems) ? orderJson.lineItems : null,
                    basket);
                addBasketShipment(!empty(orderJson.contactDetails) ? orderJson.contactDetails[0] : null,
                    basket);
                addBillingAddress(!empty(orderJson.originDetails) ? orderJson.originDetails : null,
                basket);
                applyPriceAdjustments(basket);
                validateShipmentsRecalculateBasketTotals(basket, req);
                orderResponse = createOrder(basket);
            });
            if (!orderResponse.error) {
                applyShippingAdjustment(orderResponse.order);
                order = orderResponse.order;
                responseObj.orderNo = order.getOrderNo();
                updateEswOrderAttributes(order, orderJson);
                placeOrder(order);
            } else {
                responseObj.success = false;
            }
        } catch (error) {
            Logger.error('Error while creating order Error: ' + error.toString());
            responseObj.success = false;
            responseObj.error = error.toString();
        }
    } else {
        responseObj.error = 'Expected request not available';
    }

    return responseObj;
}

module.exports = {
    handleOrderRequest: handleOrderRequest,
    getMatchingLineItem: getMatchingLineItem,
    removeShippingAndProductPriceAdjustments: removeShippingAndProductPriceAdjustments,
    removeAllCreatedBaskets: removeAllCreatedBaskets,
    updateLineItemMarketPlaceAttributes: updateLineItemMarketPlaceAttributes,
    validateShipmentsRecalculateBasketTotals: validateShipmentsRecalculateBasketTotals,
    updateEswOrderAttributes: updateEswOrderAttributes
};
