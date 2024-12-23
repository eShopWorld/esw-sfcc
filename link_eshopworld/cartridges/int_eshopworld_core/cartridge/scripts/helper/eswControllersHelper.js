'use strict';

/**
 * function to get cart item
 * @param {Object} obj - object containing cartItems
 * @param {Object} order - order object
 * @param {Object} lineItem - Product lineitem object
 * @return {Object} - cart item
 */
function getCartItem(obj, order, lineItem) {
    let item;
    let cartItem = obj.filter(function (value) {
        if (value.product.productCode === order.productLineItems[lineItem].productID && 'eswLineItemId' in order.productLineItems[lineItem].custom && value.lineItemId === order.productLineItems[lineItem].custom.eswLineItemId) {
            item = value;
        }
        return item;
    });
    return cartItem;
}

exports.getCartItem = getCartItem;
