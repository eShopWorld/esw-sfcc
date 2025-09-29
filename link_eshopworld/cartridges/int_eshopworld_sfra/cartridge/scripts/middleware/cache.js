'use strict';

var baseCache = require('app_storefront_base/cartridge/scripts/middleware/cache');

/**
 * Custom country variation Sensitive Cache - extend base logic
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
*/
function applyCachedCountryVariations(req, res, next) {
    let requestParams = req.querystring;
    let eswLocation = 'eswLocation' in requestParams && !empty(requestParams.eswLocation) ? requestParams.eswLocation : null;
    let eswCurrency = 'eswCurrency' in requestParams && !empty(requestParams.eswCurrency) ? requestParams.eswCurrency : null;
    res.cachePeriod = 1;
    res.cachePeriodUnit = 'hour';

    res.cacheKey = 'ESWPrice_' + eswLocation + '_' + eswCurrency;
    next();
}

module.exports = {
    applyCachedCountryVariations: applyCachedCountryVariations,
    applyDefaultCache: baseCache.applyDefaultCache,
    applyPromotionSensitiveCache: baseCache.applyPromotionSensitiveCache,
    applyInventorySensitiveCache: baseCache.applyInventorySensitiveCache,
    applyShortPromotionSensitiveCache: baseCache.applyShortPromotionSensitiveCache
};
