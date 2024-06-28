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
     * @return {Object} - JSON response
     */
    markOrderAsReturn: function (reqBodyJson) {
        try {
            let reqObj = reqBodyJson;
            let order = OrderMgr.getOrder(reqObj.ReturnOrder.BrandOrderReference);
            let rmaJSON = [];
            Transaction.wrap(function () {
                // eslint-disable-next-line no-param-reassign
                if (reqObj.ReturnOrder.ReturnOrderStatus === Constants.PROCESSED) {
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
            // cancel order check
            let order = OrderMgr.getOrder(reqBodyJson.Request.BrandOrderReference);
            let cancelOrderJsonPayload = [];
            if (order.status.value !== Order.ORDER_STATUS_CANCELLED) {
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
            let eswKonbiniPayloadJson = [];
            let order = OrderMgr.getOrder(reqBodyJson.BrandOrderReference);

            Transaction.wrap(function () {
                if (reqBodyJson.HoldStatus === Constants.NOHOLD) {
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);

                    if ('eswKonbiniPayloadJson' in order.custom && !empty(order.custom.eswKonbiniPayloadJson)) {
                        eswKonbiniPayloadJson.push(JSON.parse(order.custom.eswKonbiniPayloadJson));
                    }

                    eswKonbiniPayloadJson.push(reqBodyJson);
                    order.custom.eswKonbiniPayloadJson = JSON.stringify(eswKonbiniPayloadJson);
                }
            });
        } catch (e) {
            logger.error('ESW Order Konbini payment failed Error: {0}', e.message);
            return {
                ResponseCode: '400',
                ResponseText: 'Error: Internal error'
            };
        }

        return {
            ResponseCode: '200',
            ResponseText: 'Successfully processed Konbini payment'
        };
    }
};

module.exports = eswOrderProcessHelper;
