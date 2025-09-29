'use strict';

const Transaction = require('dw/system/Transaction');
const logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Constants = require('*/cartridge/scripts/util/Constants');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

const eswOrderProcessHelper = {
    /**
     * Mark an order as return and add return response
     * @param {Object} reqBodyJson - request object
     * @param {string} requestType - the type of request
     * @return {Object} - JSON response
     */
    markOrderAsReturn: function (reqBodyJson, requestType) {
        try {
            let reqObj = reqBodyJson;
            let order = OrderMgr.getOrder(reqObj.ReturnOrder.BrandOrderReference);
            let rmaJSON = [];
            Transaction.wrap(function () {
                let isStoreReturn = false;
                if (requestType === 'logistics-return-order-retailer') {
                    isStoreReturn = reqObj.ReturnOrder.ReturnOrderStatus === eswCoreHelper.getEswReturnOrderStatus();
                } else {
                    isStoreReturn = reqObj.ReturnOrder.ReturnOrderStatus === Constants.PROCESSED;
                }
                // eslint-disable-next-line no-param-reassign
                if (isStoreReturn) {
                    if (!empty(order.custom.eswRmaJson)) {
                        rmaJSON = JSON.parse(order.custom.eswRmaJson);
                    }
                    rmaJSON.push(reqObj);
                    order.custom.eswRmaJson = JSON.stringify(rmaJSON);
                    order.custom.eswIsReturned = true;
                }
            });
            return {
                ResponseCode: 200,
                ResponseText: 'Order processed successfuly'
            };
        } catch (e) {
            logger.error('ESW Order Return Error: {0}', e.message);
            logger.error('Order return payload: {0}', JSON.stringify(reqBodyJson));
            eswCoreHelper.eswInfoLogger('Order return payload', JSON.stringify(reqBodyJson), e.message, e.stack);
            return {
                ResponseCode: 400,
                ResponseText: 'Error: Internal Error'
            };
        }
    },
    /**
    * Mark an order as return for V3 and add return response
    * @param {Object} reqBodyJson - request object
    * @return {Object} - JSON response
    */
    markOrderAsReturnV3: function (reqBodyJson) {
        try {
            let reqObj = reqBodyJson;
            let order = OrderMgr.getOrder(reqObj.ReturnOrder.BrandOrderReference);
            let rmaJSON = [];
            Transaction.wrap(function () {
                // eslint-disable-next-line no-param-reassign, eqeqeq
                if (reqObj.ReturnOrder.ReturnOrderStatus == eswCoreHelper.getEswReturnOrderStatus()) {
                    if (!empty(order.custom.eswRmaJson)) {
                        rmaJSON = JSON.parse(order.custom.eswRmaJson);
                    }
                    rmaJSON.push(reqObj);
                    order.custom.eswRmaJson = JSON.stringify(rmaJSON);
                    order.custom.eswIsReturned = true;
                }
            });
            return {
                ResponseCode: 200,
                ResponseText: 'Order processed successfuly'
            };
        } catch (e) {
            logger.error('ESW Order Return Error: {0}', e.message);
            logger.error('Order return payload: {0}', JSON.stringify(reqBodyJson));
            eswCoreHelper.eswInfoLogger('Order return payload', JSON.stringify(reqBodyJson), e.message, e.stack);
            return {
                ResponseCode: 400,
                ResponseText: 'Error: Internal Error'
            };
        }
    },
    /**
     * Mark an order appeasement
     * @param {Object} reqBodyJson - request object
     * @return {Object} - JSON response
     */
    markOrderAppeasement: function (reqBodyJson) {
        try {
            let appeasementJsonPayload = [];
            let order = OrderMgr.getOrder(reqBodyJson.Request.BrandOrderReference);
            Transaction.wrap(function () {
                // update SFCC side order appeasement values
                order.custom.isAppeasement = true;
                if ('appeasementJsonPayload' in order.custom && !empty(order.custom.appeasementJsonPayload)) {
                    appeasementJsonPayload = JSON.parse(order.custom.appeasementJsonPayload);
                    appeasementJsonPayload.push(reqBodyJson);
                    order.custom.appeasementJsonPayload = JSON.stringify(appeasementJsonPayload);
                } else {
                    appeasementJsonPayload.push(reqBodyJson);
                    order.custom.appeasementJsonPayload = JSON.stringify(appeasementJsonPayload);
                }
            });
        } catch (e) {
            eswCoreHelper.eswInfoLogger('ESW Order Appeasement Error', JSON.stringify(reqBodyJson), e.message, e.stack);
            logger.error('ESW Order Appeasement Error: {0}', e.message);
            return {
                ResponseCode: '400',
                ResponseText: 'Error: Internal error'
            };
        }
        return {
            ResponseCode: '200',
            ResponseText: 'Order appeased successfuly'
        };
    },
    /**
     * Cancel an order
     * @param {Object} reqBodyJson - request object
     * @return {Object} - JSON response
     */
    cancelAnOrder: function (reqBodyJson) {
        try {
            let order;
            // cancel order check
            if (eswCoreHelper.isEswEnabledEmbeddedCheckout()) {
                order = OrderMgr.searchOrder('orderNo={0} OR custom.eswBasketUuid={0}', reqBodyJson.Request.BrandOrderReference);
            } else {
                order = OrderMgr.getOrder(reqBodyJson.Request.BrandOrderReference);
            }
            let cancelOrderJsonPayload = [];
            if (order && order.status.value !== Order.ORDER_STATUS_CANCELLED) {
                let isPartialOrderCancelled = reqBodyJson.Request && 'LineItemId' in reqBodyJson.Request;
                Transaction.wrap(function () {
                    if (!isPartialOrderCancelled) {
                        order.custom.isEswCancelledOrder = true;
                    }
                    if ('cancelOrderJsonPayload' in order.custom && !empty(order.custom.cancelOrderJsonPayload)) {
                        cancelOrderJsonPayload = JSON.parse(order.custom.cancelOrderJsonPayload);
                        cancelOrderJsonPayload.push(reqBodyJson);
                        order.custom.cancelOrderJsonPayload = JSON.stringify(cancelOrderJsonPayload);
                    } else {
                        cancelOrderJsonPayload.push(reqBodyJson);
                        order.custom.cancelOrderJsonPayload = JSON.stringify(cancelOrderJsonPayload);
                    }
                });
            }
            return {
                OrderNumber: reqBodyJson.Request.BrandOrderReference,
                ResponseCode: '200',
                ResponseText: 'Order processed successfuly'
            };
        } catch (e) {
            eswCoreHelper.eswInfoLogger('ESW Order Cancel Error', JSON.stringify(reqBodyJson), e.message, e.stack);
            logger.error('ESW Order Cancel Error: {0}', e.message);
            return {
                OrderNumber: reqBodyJson.Request.BrandOrderReference,
                ResponseCode: '400',
                ResponseText: 'Error: Internal error'
            };
        }
    },
    /**
     * process payment status of order
     * @param {Object} reqBodyJson - request object
     * @return {Object} - JSON response
     */
    processKonbiniPayment: function (reqBodyJson) {
        try {
            let eswOverTheCounterPayloadJson = [];
            let order = OrderMgr.getOrder(reqBodyJson.BrandOrderReference);

            Transaction.wrap(function () {
                if (reqBodyJson.HoldStatus === Constants.NOHOLD) {
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);

                    if ('eswOverTheCounterPayloadJson' in order.custom && !empty(order.custom.eswOverTheCounterPayloadJson)) {
                        eswOverTheCounterPayloadJson.push(JSON.parse(order.custom.eswOverTheCounterPayloadJson));
                    }

                    eswOverTheCounterPayloadJson.push(reqBodyJson);
                    order.custom.eswOverTheCounterPayloadJson = JSON.stringify(eswOverTheCounterPayloadJson);
                }
            });
        } catch (e) {
            logger.error('ESW Order Konbini payment failed Error: {0}', e.message);
            eswCoreHelper.eswInfoLogger('ESW Order Konbini payment failed Error', JSON.stringify(reqBodyJson), e.message, e.stack);
            return {
                ResponseCode: '400',
                ResponseText: 'Error: Internal error'
            };
        }

        return {
            ResponseCode: '200',
            ResponseText: 'Successfully processed Konbini payment'
        };
    },
    /**
     * Handles ESW post-order webhook payload.
     * @param {Object} webhookPayloadJson - The webhook payload as an object.
     * @returns {boolean} - true if processed, false otherwise.
     */
    handlePostOrderOrderHook: function (webhookPayloadJson) {
        let result = false;

        if (!webhookPayloadJson || !webhookPayloadJson.Payment || !webhookPayloadJson.BrandOrderReference) {
            eswCoreHelper.eswInfoLogger('Invalid webhook payload:', '', JSON.stringify(webhookPayloadJson), 'handlePostOrderOrderHook');
            return false;
        }
        try {
            // Get the order by BrandOrderReference (case-insensitive)
            let orderId = webhookPayloadJson.BrandOrderReference;
            let order = OrderMgr.getOrder(orderId);

            if (!order) {
                eswCoreHelper.eswInfoLogger('Order not found for BrandOrderReference: ' + orderId, 'handlePostOrderOrderHook');
                return false;
            }

            let isPreAuthorized = webhookPayloadJson.Payment.PreAuthorized || false;
            let isSettled = webhookPayloadJson.Payment.Settled || false;
            let paymentStatus = Constants.TXT_PAYMENT_NOT_AUTHORIZED;

            Transaction.wrap(function () {
                // Update payment status
                if (isPreAuthorized && isSettled) {
                    paymentStatus = Constants.TXT_PAYMENT_SETTLED;
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                } else if (isPreAuthorized && !isSettled) {
                    paymentStatus = Constants.TXT_PAYMENT_AUTHORIZED;
                    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                } else if (!isPreAuthorized && !isSettled) {
                    paymentStatus = Constants.TXT_PAYMENT_NOT_AUTHORIZED;
                    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                }

                order.paymentInstruments[0].paymentTransaction.custom.eswPaymentStatus = paymentStatus;

                // Update confirmation and export status
                if (isSettled) {
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                } else {
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                    order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
                }
                result = isSettled;
            });
        } catch (e) {
            eswCoreHelper.eswInfoLogger(e.message, 'handlePostOrderOrderHook');
            eswCoreHelper.eswInfoLogger('PostOrder WebHook processing error', JSON.stringify(webhookPayloadJson), e.message, e.stack);
        }
        return result;
    }
};

module.exports = eswOrderProcessHelper;
