'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');

exports.beforePOST = function (basket) {
    OCAPIHelper.setOverridePriceBooks(basket);
    OCAPIHelper.handleEswBasketAttributes(basket);

    return new Status(Status.OK);
};

exports.afterPOST = function (order) {
    OCAPIHelper.handleEswOrderAttributes(order);

    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (order, orderResponse) {
    OCAPIHelper.handleEswPreOrderCall(order, orderResponse);

    return new Status(Status.OK);
};

exports.modifyGETResponse_v2 = function (customer, customerOrderResultResponse) {
    OCAPIHelper.handleEswOrdersHistoryCall(customerOrderResultResponse);

    return new Status(Status.OK);
};

// Use the Order API to bypass the 'Limit Storefront Order Access' restriction
exports.modifyGETResponse = function (order, orderResponse) {
    OCAPIHelper.handleEswOrderDetailCall(order, orderResponse);

    return new Status(Status.OK);
};
