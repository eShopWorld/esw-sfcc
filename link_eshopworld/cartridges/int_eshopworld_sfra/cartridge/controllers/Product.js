'use strict';

/**
 * @namespace Tile
 */

const server = require('server');
server.extend(module.superModule);

const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const cache = require('*/cartridge/scripts/middleware/cache');

  /**
  * Product-Show : This endpoint is called to show the details of the selected product
  * @name Base/Product-Show
  * @function
  * @memberof Product
  * @param {middleware} - cache.applyPromotionSensitiveCache
  * @param {middleware} - consentTracking.consent
  * @param {querystringparameter} - pid - Product ID
  * @param {category} - non-sensitive
  * @param {renders} - isml
  * @param {serverfunction} - get
  */
server.prepend('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    try {
        eswHelper.setEnableMultipleFxRatesCurrency(req);
    } catch (error) {
        eswHelper.eswInfoLogger('ESW Product-Show Error', error, error.message, error.stack);
    }
    next();
});

/**
 * Product-ShowInCategory : The Product-ShowInCategory endpoint renders the product detail page within the context of a category
 * @name Base/Product-ShowInCategory
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend('ShowInCategory', cache.applyPromotionSensitiveCache, function (req, res, next) {
    try {
        eswHelper.setEnableMultipleFxRatesCurrency(req);
    } catch (error) {
        eswHelper.eswInfoLogger('ESW Product-ShowInCategory Error', error, error.message, error.stack);
    }
    next();
});

/**
 * Product-Variation : This endpoint is called when all the product variants are selected
 * @name Base/Product-Variation
 * @function
 * @memberof Product
 * @param {querystringparameter} - pid - Product ID
 * @param {querystringparameter} - quantity - Quantity
 * @param {querystringparameter} - dwvar_<pid>_color - Color Attribute ID
 * @param {querystringparameter} - dwvar_<pid>_size - Size Attribute ID
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('Variation', function (req, res, next) {
    try {
        eswHelper.setEnableMultipleFxRatesCurrency(req);
    } catch (error) {
        eswHelper.eswInfoLogger('ESW Product-Variation Error', error, error.message, error.stack);
    }
    next();
});

/**
 * Product-ShowQuickView : This endpoint is called when a product quick view button is clicked
 * @name Base/Product-ShowQuickView
 * @function
 * @memberof Product
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {querystringparameter} - pid - Product ID
 * @param {category} - non-sensitive
 * @param {serverfunction} - get
 */
server.prepend('ShowQuickView', cache.applyPromotionSensitiveCache, function (req, res, next) {
    try {
        eswHelper.setEnableMultipleFxRatesCurrency(req);
    } catch (error) {
        eswHelper.eswInfoLogger('ESW Product-ShowQuickView Error', error, error.message, error.stack);
    }
    next();
});

/**
 * Product-SizeChart : This endpoint is called when the "Size Chart" link on the product details page is clicked
 * @name Base/Product-SizeChart
 * @function
 * @memberof Product
 * @param {querystringparameter} - cid - Size Chart ID
 * @param {category} - non-sensitve
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('SizeChart', cache.applyPromotionSensitiveCache, function (req, res, next) {
    try {
        eswHelper.setEnableMultipleFxRatesCurrency(req);
    } catch (error) {
        eswHelper.eswInfoLogger('ESW Product-SizeChart Error', error, error.message, error.stack);
    }
    next();
});

/**
 * Product-ShowBonusProducts : This endpoint is called when a product with bonus product is added to Cart
 * @name Base/Product-ShowBonusProducts
 * @function
 * @memberof Product
 * @param {querystringparameter} - DUUID - Discount Line Item UUID
 * @param {querystringparameter} - pagesize - Number of products to show on a page
 * @param {querystringparameter} - pagestart - Starting Page Number
 * @param {querystringparameter} - maxpids - Limit maximum number of Products
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('ShowBonusProducts', cache.applyPromotionSensitiveCache, function (req, res, next) {
    try {
        eswHelper.setEnableMultipleFxRatesCurrency(req);
    } catch (error) {
        eswHelper.eswInfoLogger('ESW Product-ShowBonusProducts Error', error, error.message, error.stack);
    }
    next();
});

module.exports = server.exports();
