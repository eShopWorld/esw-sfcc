'use strict';

/* API Includes */
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Status = require('dw/system/Status');
const Order = require('dw/order/Order');

const ocUtils = {
    /**
     * Helper to prepare the order cancellation request object
     *
     * @param {dw.order.Order} order The order to transmit data for
     * @param {Object} args - job parameters
     * @returns {Object} The request object to send to Esw Package API
     */
    prepareOrderCancellationRequest: function (order, args) {
        let requestObj = {
            activityStatus: args.action,
            reasonCode: (order.cancelDescription !== null) ? order.cancelDescription : 'ShopperCancel',
            settlementReference: order.orderNo,
            transactionReference: order.custom.eswOrderNo,
            transactionDateTime: new Date(),
            actionedBy: args.actionBy,
            actionedByUser: args.actionByUserEmail
        };
        return requestObj;
    },
    /**
     * Cancel Order in ESW CSP using ESW Order API
     *
     * @param {dw.order.Order} order The order to transmit data for
     * @param {Object} args - job parameters
     * @returns {Array<Object>} Results of each order cancellation in ESW CSP.
     */
    cancelESWOrder: function (order, args) {
        try {
            let eswServices = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
                eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
                oAuthObj = eswServices.getOAuthService(),
                ocService = eswServices.getOrderAPIServiceV2();

            let formData = {
                grant_type: 'client_credentials',
                scope: 'order.transaction.cancel.api.all'
            };
            formData.client_id = eswHelper.getClientID();
            formData.client_secret = eswHelper.getClientSecret();

            let oAuthResult = oAuthObj.call(formData);
            if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
                Logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
                return new Status(Status.ERROR);
            }

            let requestBody = this.prepareOrderCancellationRequest(order, args);

            let response = ocService.call({
                eswOAuthToken: JSON.parse(oAuthResult.object).access_token,
                orderID: order.orderNo,
                requestBody: JSON.stringify(requestBody)
            });
            return response;
        } catch (e) {
            Logger.error('ASN service call error: {0}', e.message);
            return new Status(Status.ERROR);
        }
    }
};

/**
 * Script file to cancel order in ESW CSP
 * Cancel order in ESW CSP if ESW order cancelled in SFCC
 * @param {Object} args - job parameters
 * @return {boolean} - returns execute result
 */
function execute(args) {
    let orders = OrderMgr.searchOrders(
        'status = {0} AND (custom.eswShopperCurrencyCode != null) AND (custom.eswOrderCancellationReference = null) AND (custom.eswOrderCancellationRetryCount = null OR custom.eswOrderCancellationRetryCount < 3)',
        'creationDate desc',
        Order.ORDER_STATUS_CANCELLED
    );
    try {
        let order,
            retryCount = 1;
        while (orders.hasNext()) {
            order = orders.next();
            let result = ocUtils.cancelESWOrder(order, args);
            if (result && result.status === 'OK') {
                let responseObj = JSON.parse(result.object);
                Transaction.wrap(function () { // eslint-disable-line no-loop-func
                    order.custom.eswOrderCancellationReference = responseObj.transactionReference;
                    order.custom.eswOrderCancellationTimestamp = new Date();
                    order.custom.eswOrderCancellationMessage = 'OK';
                    order.custom.eswOrderCancellationRetryCount += retryCount;
                    order.custom.eswOrderCancelledBy = args.actionBy;
                    order.custom.eswOrderCancelledByUser = args.actionByUserEmail;
                });
                Logger.info('Order cancelled successfully for order: {0}', order.orderNo);
            } else {
                let errorMsg = JSON.parse(result.errorMessage);
                if (!empty(errorMsg) && !empty(errorMsg[0]) && errorMsg[0].code !== 800) {
                    Transaction.wrap(function () { // eslint-disable-line no-loop-func
                        order.custom.eswOrderCancellationMessage = errorMsg[0].message;
                        order.custom.eswOrderCancellationRetryCount += retryCount;
                        order.custom.eswOrderCancelledBy = args.actionBy;
                        order.custom.eswOrderCancelledByUser = args.actionByUserEmail;
                    });
                    Logger.error('Order Cancellation failed for order: {0}: {1}', order.orderNo, result.errorMessage);
                    return new Status(Status.ERROR);
                }
                Logger.error('Order Cancellation Duplication request for order: {0}: {1}', order.orderNo, result.errorMessage);
            }
        }
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('Order API service call failed: {0}: {1}', e.message, e.stack);
        return new Status(Status.ERROR);
    }
}

exports.execute = execute;
