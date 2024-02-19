'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.beforeGET = function (basket) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.setOverridePriceBooks(basket);
    }
    return new Status(Status.OK);
};

exports.beforePOST = function (basket) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.setOverridePriceBooks(basket);
        OCAPIHelper.setDefaultOverrideShippingMethod(basket);
    }
    return new Status(Status.OK);
};
