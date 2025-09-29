'use strict';

/**
 * @namespace Tile
 */

const server = require('server');
server.extend(module.superModule);

const cache = require('*/cartridge/scripts/middleware/cache');

server.prepend('Show', cache.applyCachedCountryVariations, function (req, res, next) {
    return next();
});

/**
 * Tile-Show : Used to return data for rendering a product tile
 * @name esw/Tile-Show
 * @function
 * @memberof Tile
 * @param {middleware} - cache.applyPromotionSensitiveCache
 * @param {querystringparameter} - pid - the Product ID
 * @param {querystringparameter} - ratings - boolean to determine if the reviews should be shown in the tile
 * @param {querystringparameter} - swatches - boolean to determine if the swatches should be shown in the tile
 * @param {querystringparameter} - pview - string to determine if the product factory returns a model for a tile or a pdp/quickview display
 * @param {querystringparameter} - quantity - Quantity
 * @param {querystringparameter} - dwvar_<pid>_color - Color Attribute ID
 * @param {querystringparameter} - dwvar_<pid>_size - Size Attribute ID
 * @param {category} - non-sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    try {
        let URLUtils = require('dw/web/URLUtils');
        let viewData = res.getViewData();
        viewData.tileShow = true;
        if (
            ('product' in viewData)
            && (viewData.product !== false)
            && ('urls' in viewData)
            && ('quickView' in viewData.urls)
            && viewData.urls.quickView
        ) {
            viewData.urls.quickView = URLUtils.url('EShopWorld-Cache', 'remoteIncludeUrl', 'Product-ShowQuickView', 'pid', req.querystring.pid, 'ajax', 'true').toString();
        }
        res.setViewData(viewData);
    } catch (error) {
        const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        eswHelper.eswInfoLogger('ESW Tile-Show Error', error, error.message, error.stack);
    }
    next();
});

module.exports = server.exports();
