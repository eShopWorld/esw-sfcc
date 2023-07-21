'use strict';

const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const base = module.superModule;

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options) {
    base.call(this, product, apiProduct, options);

    Object.defineProperty(product, 'isProductRestricted', {
        enumerable: true,
        value: eswHelper.isProductRestricted(apiProduct.custom)
    });

    return product;
};
