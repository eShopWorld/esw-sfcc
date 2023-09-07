/**
 * Override following method in order to customize the eSW Rounding model.
 * @param {number} localizePrice - price
 * @param {number} baseProductPrice - price
 * @returns {string} return null or localize price
 */
function applyCustomizedRounding(localizePrice, baseProductPrice) { // eslint-disable-line no-unused-vars
    return null;
}

/**
 * Override following method to get product image based on view type
 * @param {Object} product - Product API Object
 * @returns {string} return image url
 */
function getProductImage(product) {
    let Site = require('dw/system/Site').getCurrent();
    let eswImageType = !empty(Site.getCustomPreferenceValue('eswImageType')) ? Site.getCustomPreferenceValue('eswImageType') : 'small';
    return product.getImage(eswImageType, 0).httpURL.toString();
}

/**
 * Override default shipping method
 * @param {string} shippingMethodID - Shipping Method ID
 * @param {Object} basket - SFCC Basket Object
 * @returns {string} Shipping Method ID
 */
function getDefaultShippingMethodID(shippingMethodID, basket) { // eslint-disable-line no-unused-vars
    return shippingMethodID;
}

module.exports = {
    applyCustomizedRounding: applyCustomizedRounding,
    getProductImage: getProductImage,
    getDefaultShippingMethodID: getDefaultShippingMethodID
};
