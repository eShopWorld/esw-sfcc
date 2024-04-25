'use strict';

/* API Includes */
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Status = require('dw/system/Status');

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const sendASNtoESWHelper = require('*/cartridge/scripts/jobs/sendASNtoESW').getSendASNtoESWUtils;

/**
 * Job to send shipment information to ESW
 * @returns {dw.system.Status} - Status object
 */
function execute() {
    let order;
    if (eswHelper.isEswCheckoutOnlyPackagesExportEnabled()) {
        let orders = OrderMgr.searchOrders(
            // eslint-disable-next-line no-multi-str
            'shippingStatus = {0} AND (custom.eswShopperCurrencyCode != null) \
            AND (custom.eswCreateOutboundShipment = null OR custom.eswCreateOutboundShipment = false) \
            AND (custom.eswReceivedASN = null OR custom.eswReceivedASN = false)',
            'creationDate desc',
            dw.order.Order.SHIPPING_STATUS_SHIPPED
        );
        try {
            while (orders.hasNext()) {
                order = orders.next();
                if (empty(order)) {
                    Logger.error('Outbound shipment  can not be transmitted for empty order');
                    continue;
                }
                let shipment = order.defaultShipment;
                let result = sendASNtoESWHelper.sendASNForPackage(order);
                if (result.status !== 'OK') {
                    // Error in ASN API is JSON
                    let errorMessage = eswHelper.strToJson(result.errorMessage);
                    errorMessage.createdAt = new Date();
                    Transaction.begin();
                    shipment.custom.eswOutboundShipmentJson = JSON.stringify(errorMessage);
                    order.custom.eswCreateOutboundShipment = false;
                    Transaction.commit();
                    Logger.error('Outbound shipment  transmission failed for order: {0}: {1}', order.orderNo, shipment.custom.eswOutboundShipmentJson);
                    continue;
                }
                let responseObj = JSON.parse(result.object);
                if (responseObj.outcome.equalsIgnoreCase('PackageCreated')) {
                    Transaction.begin();
                    responseObj.createdAt = new Date();
                    shipment.custom.eswOutboundShipmentJson = JSON.stringify(responseObj);
                    order.custom.eswCreateOutboundShipment = true;
                    Transaction.commit();
                    Logger.info('Outbound shipment successfully transmitted for order: {0}', order.orderNo);
                } else {
                    Logger.error('Outbound shipment not created for order: {0} - {1} - Bad Request.', order.orderNo, responseObj.outcome);
                }
            }
        } catch (e) {
            Logger.error('ASN shipment service call failed: {0}: {1}', e.message, e.stack);
            return new Status(Status.ERROR);
        }
    }
    return new Status(Status.OK);
}

exports.execute = execute;
