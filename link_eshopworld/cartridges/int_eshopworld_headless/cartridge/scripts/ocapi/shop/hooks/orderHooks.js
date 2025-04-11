'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.beforePOST = function (basket) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.setOverridePriceBooks(basket);
        OCAPIHelper.handleEswBasketAttributes(basket);
    }

    return new Status(Status.OK);
};

exports.afterPOST = function (order) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswOrderAttributes(order);
    }

    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (order, orderResponse) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswPreOrderCall(order, orderResponse);
    }

    return new Status(Status.OK);
};

exports.modifyGETResponse = function (order, orderResponse) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswOrderDetailCall(order, orderResponse);
    }
    return new Status(Status.OK);
};
