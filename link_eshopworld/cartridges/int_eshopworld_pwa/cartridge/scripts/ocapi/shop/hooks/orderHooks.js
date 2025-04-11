'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.beforePOST = function (basket) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.setOverridePriceBooks(basket);
        OCAPIHelper.handleEswBasketAttributes(basket);
    }

    return new Status(Status.OK);
};

exports.afterPOST = function (order) {
    OCAPIHelper.handleEswOrderAttributes(order);

    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (order, orderResponse) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswPreOrderCall(order, orderResponse);
    }

    return new Status(Status.OK);
};

exports.modifyGETResponse_v2 = function (customer, customerOrderResultResponse) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswOrdersHistoryCall(customerOrderResultResponse);
    }

    return new Status(Status.OK);
};

// Use the Order API to bypass the 'Limit Storefront Order Access' restriction
exports.modifyGETResponse = function (order, orderResponse) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswOrderDetailCall(order, orderResponse);
    }

    return new Status(Status.OK);
};
