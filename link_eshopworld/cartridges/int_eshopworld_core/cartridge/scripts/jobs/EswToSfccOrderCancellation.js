/**
 * Update order with esw cancelled order attributes and update status to cancel.
 * @param {Object} cancelledOrderRequestPayload - getting cancelled order request payload object
 * @param {Object} order - esw cancelled order id
 * @returns {boolean} returns after updating the order
 */
function updateOrder(cancelledOrderRequestPayload, order) {
    let Order = require('dw/order/Order'),
        Transaction = require('dw/system/Transaction'),
        cancelStatus,
        code = cancelledOrderRequestPayload.Code,
        transactionReference = cancelledOrderRequestPayload.Request.TransactionReference,
        transactionDateTime = new Date(),
        userName = cancelledOrderRequestPayload.Request.UserName,
        actionedBy = cancelledOrderRequestPayload.Request.ActionedBy;

    // Update order in SFCC
    Transaction.wrap(function () {
        let orderObject = order;
        if (code === 0) {
            orderObject.custom.eswOrderCancellationReference = transactionReference;
            orderObject.custom.eswOrderCancellationTimestamp = transactionDateTime;
            orderObject.custom.eswOrderCancellationMessage = 'OK';
            orderObject.custom.eswOrderCancelledBy = actionedBy;
            orderObject.custom.eswOrderCancelledByUser = userName;
            order.setStatus(Order.ORDER_STATUS_CANCELLED);
            orderObject.custom.isEswCancelledOrder = false;
            cancelStatus = true;
        } else {
            cancelStatus = false;
        }
    });
    return cancelStatus;
}

/**
 * Script to cancel the order in SFCC.
 * Get esw cancelled order payload and update SFCC order with cancellation attributes and update status to cancel.
 * @returns {boolean} - returns execute result
 */
function execute() {
    let logger = require('dw/system/Logger'),
        Status = require('dw/system/Status'),
        OrderMgr = require('dw/order/OrderMgr'),
        Order = require('dw/order/Order');
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

    try {
        let cancelledOrderInfo = OrderMgr.searchOrders('(custom.isEswCancelledOrder != null) AND (custom.isEswCancelledOrder != false) AND status!={0}',
        'creationDate desc',
        dw.order.Order.ORDER_STATUS_REPLACED);
        let cancelledOrderInfoCount = cancelledOrderInfo.count;
        let cancelOrderInSfcc;
        if (cancelledOrderInfoCount > 0 && cancelledOrderInfoCount !== null) {
            while (cancelledOrderInfo.hasNext()) {
                let currCancelledOrderCO = cancelledOrderInfo.next();
                let order = currCancelledOrderCO;
                let orderStatus = order.status;
                if (orderStatus.value !== Order.ORDER_STATUS_CANCELLED && orderStatus.value !== Order.ORDER_STATUS_CREATED) {
                    let cancelledOrderRequestPayload = JSON.parse(currCancelledOrderCO.custom.cancelOrderJsonPayload);
                    // Update order status to cancel in sfcc
                    cancelOrderInSfcc = updateOrder(cancelledOrderRequestPayload[0], order);
                    // if order is cancelled in sfcc than remove the custom object
                    if (cancelOrderInSfcc) {
                        logger.info('Order cancelled successfully for order: {0}', currCancelledOrderCO.getOrderNo());
                    }
                } else {
                    logger.error('Order with orderID ' + currCancelledOrderCO.getOrderNo() + ' is already cancelled or in created state.');
                }
            }
        }
    } catch (e) {
        logger.error('Unable to cancel the order: ' + e.message);
        eswHelper.eswInfoLogger('EswToSfccOrderCancellation error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
