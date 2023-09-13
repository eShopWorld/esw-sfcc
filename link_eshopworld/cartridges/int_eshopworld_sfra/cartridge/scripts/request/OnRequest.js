'use strict';
/**
 * The onRequest hook is called with every top-level request in a site. This happens both for requests to cached and non-cached pages.
 * For performance reasons the hook function should be kept short.
 *
 * @module  request/OnRequest
 */

const URLUtils = require('dw/web/URLUtils');
const Site = require('dw/system/Site').getCurrent();
const staticBaseUrl = URLUtils.staticURL('/');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * The OnRequest hook function.
 */
exports.onRequest = function () {
    if (!request.includeRequest && request.httpRequest && request.httpPath.indexOf(staticBaseUrl.toString()) < 0) {
        if (Site.getCustomPreferenceValue('eswEshopworldModuleEnabled')) {
            eswHelper.setLocation(request.httpParameterMap.get(Site.getCustomPreferenceValue('eswCountryUrlParam')));
        }
    }
};
