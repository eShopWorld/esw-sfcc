'use strict';

const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

const base = module.superModule;

/**
 * Decorate product with set product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @param {Object} factory - Reference to product factory
 *
 * @returns {Object} - Set product
 */
module.exports = function bundleProduct(product, apiProduct, options, factory) {
    base.call(this, product, apiProduct, options, factory);

    Object.defineProperty(product, 'isProductRestricted', {
        enumerable: true,
        value: eswHelper.isProductRestricted(apiProduct.custom)
    });

    return product;
};
