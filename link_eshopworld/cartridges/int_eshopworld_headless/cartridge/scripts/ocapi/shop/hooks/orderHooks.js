'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const basketHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
const URLUtils = require('dw/web/URLUtils');

exports.beforePOST = function (basket) {
    try {
        if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.setOverridePriceBooksAndDefaultShipments(basket);
            OCAPIHelper.handleEswBasketAttributes(basket);
        }
    } catch (e) {
        eswHelper.eswInfoLogger('OCAPI_orderHook_beforePOST_Error', e, e.message, e.stack);
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
    try {
        if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.handleEswPreOrderCall(order, orderResponse);
        }
    } catch (e) {
        eswHelper.eswInfoLogger('OCAPI_orderHook_modifyPOSTResponse_Error', e, e.message, e.stack);
    }

    return new Status(Status.OK);
};

exports.modifyGETResponse = function (order, orderResponse) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswOrderDetailCall(order, orderResponse);
    }
    if (!request.isSCAPI() && eswHelper.isEnabledMultiOrigin()) {
        orderResponse.productItems = basketHelper.combineProductItems(orderResponse.productItems);
    }
    if (request.isSCAPI()){
        let isCheckoutRegisterationEnabled = eswHelper.isCheckoutRegisterationEnabled();
        orderResponse.c_isCheckoutRegisterationEnabled = isCheckoutRegisterationEnabled;
        if (isCheckoutRegisterationEnabled) {
            orderResponse.c_checkoutRegisterationRedirectUrl = URLUtils.abs('EShopWorld-RegisterCustomer', 'retailerCartId', order.currentOrderNo).toString();
        }
    }
    return new Status(Status.OK);
};

exports.modifyGETResponse_v2 = function (customer, customerOrderResultResponse) {
    if (request.isSCAPI()) {
        try {
            if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
                OCAPIHelper.handleEswOrdersHistoryCall(customerOrderResultResponse);
            }
            if (eswHelper.isEnabledMultiOrigin() && !empty(customerOrderResultResponse) && 'productItems' in customerOrderResultResponse) {
                customerOrderResultResponse.productItems = basketHelper.combineProductItems(customerOrderResultResponse.productItems);
            }
        } catch (e) {
            eswHelper.eswInfoLogger('OCAPI_orderHook_modifyGETResponse_v2_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};
