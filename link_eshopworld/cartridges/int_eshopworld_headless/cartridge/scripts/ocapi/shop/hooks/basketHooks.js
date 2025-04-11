'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const basketHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;


exports.beforePATCH = function (basket) {
    if (eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.setOverridePriceBooks(basket);
        OCAPIHelper.handleEswBasketAttributes(basket);
        eswHelper.removeThresholdPromo(basket);
    }

    return new Status(Status.OK);
};

exports.modifyPATCHResponse = function (order, orderResponse) {
    if (eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswPreOrderCall(order, orderResponse);
    }
    return new Status(Status.OK);
};


exports.modifyPOSTResponse = function (basket, basketResponse) {
    basketHelper.sendOverrideShippingMethods(basket, basketResponse);
    return new Status(Status.OK);
};
