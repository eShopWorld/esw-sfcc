'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.beforeGET = function (basket) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.setOverridePriceBooks(basket);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_sopb_beforeGET_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

exports.beforePOST = function (basket) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.setOverridePriceBooks(basket);
            OCAPIHelper.setDefaultOverrideShippingMethod(basket);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_sopb_beforePOST_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};
