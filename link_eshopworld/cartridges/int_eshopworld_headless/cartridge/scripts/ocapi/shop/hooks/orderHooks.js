'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const basketHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');

exports.beforePOST = function (basket) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.setOverridePriceBooksAndDefaultShipments(basket);
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
    if (eswHelper.isEnabledMultiOrigin()) {
        orderResponse.productItems = basketHelper.combineProductItems(orderResponse.productItems);
    }
    return new Status(Status.OK);
};
