'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const basketHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
const URLUtils = require('dw/web/URLUtils');

exports.beforePOST = function (basket) {
    try {
        if (!eswCoreHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.setOverridePriceBooks(basket);
            OCAPIHelper.handleEswBasketAttributes(basket);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_orderHook_beforePOST_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

exports.afterPOST = function (order) {
    OCAPIHelper.handleEswOrderAttributes(order);

    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (order, orderResponse) {
    try {
        if (!eswCoreHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.handleEswPreOrderCall(order, orderResponse);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_orderHook_modifyPOSTResponse_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

exports.modifyGETResponse_v2 = function (customer, customerOrderResultResponse) {
    try {
        if (!eswCoreHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.handleEswOrdersHistoryCall(customerOrderResultResponse);
        }
        if (!eswCoreHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.handleEswOrdersHistoryCall(customerOrderResultResponse);
        }
        if (eswCoreHelper.isEnabledMultiOrigin() && !empty(customerOrderResultResponse) && 'productItems' in customerOrderResultResponse) {
            customerOrderResultResponse.productItems = basketHelper.combineProductItems(customerOrderResultResponse.productItems);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_orderHook_modifyGETResponse_v2_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

// Use the Order API to bypass the 'Limit Storefront Order Access' restriction
exports.modifyGETResponse = function (order, orderResponse) {
    try {
        if (!eswCoreHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.handleEswOrderDetailCall(order, orderResponse);
        }
        let isCheckoutRegisterationEnabled = eswCoreHelper.isCheckoutRegisterationEnabled();
        orderResponse.c_isCheckoutRegisterationEnabled = isCheckoutRegisterationEnabled;
        if (isCheckoutRegisterationEnabled) {
            orderResponse.c_checkoutRegisterationRedirectUrl = URLUtils.abs('EShopWorld-RegisterCustomer', 'retailerCartId', order.currentOrderNo).toString();
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_orderHook_modifyGETResponse_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};
