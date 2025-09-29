'use strict';

const Resource = require('dw/web/Resource');
const validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

/**
 * validates the current users basket
 * @param {dw.order.Basket} basket - The current user's basket
 * @param {boolean} validateTax - boolean that determines whether or not to validate taxes
 * @returns {Object} an error object
 */
function validateBasket(basket, validateTax) {
    let result = { error: false, message: null };

    if (!basket) {
        result.error = true;
        result.message = Resource.msg('error.cart.expired', 'cart', null);
    } else {
        let productExistence = validationHelpers.validateProducts(basket);
        let validCoupons = validationHelpers.validateCoupons(basket);
        let totalTax = true;

        if (validateTax) {
            totalTax = basket.totalTax.available;
        }

        if (productExistence.error || !productExistence.hasInventory) {
            result.error = true;
            result.message = Resource.msg('error.cart.or.checkout.error', 'cart', null);
        } else if (validCoupons.error) {
            result.error = true;
            result.message = Resource.msg('error.invalid.coupon', 'cart', null);
        } else if (basket.productLineItems.getLength() === 0) {
            result.error = true;
        } else if (!basket.merchandizeTotalPrice.available) {
            result.error = true;
            result.message = Resource.msg('error.cart.or.checkout.error', 'cart', null);
        } else if (!totalTax) {
            result.error = true;
            result.message = Resource.msg('error.invalid.tax', 'cart', null);
        } else if ((!empty(session.privacy.eswRetailerCartIdNullException) && session.privacy.eswRetailerCartIdNullException) || (!empty(session.privacy.eswPreOrderException) && session.privacy.preOrderException)) {
            result.error = true;
            result.message = Resource.msg('esw.error.general', 'esw', null);
            delete session.privacy.eswfail;
            delete session.privacy.eswRetailerCartIdNullException;
            delete session.privacy.eswPreOrderException;
        } else if (!empty(session.privacy.eswfail) && session.privacy.eswfail) {
            result.error = true;
            result.message = Resource.msg('cart.eswerror', 'esw', null);
            delete session.privacy.eswfail;
        } else if (!empty(session.privacy.eswProductRestricted) && session.privacy.eswProductRestricted) {
            result.error = true;
            result.message = Resource.msg('cart.esw.product.notavailable', 'esw', null);
        }
    }

    return result;
}

exports.validateBasket = validateBasket;
