'use strict';

const Resource = require('dw/web/Resource');

const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Constants = require('*/cartridge/scripts/util/Constants');

const OrderHelpers = {
    /**
     * Get order export status
     * @param {dw.order.Order} order - Single Order object
     * @returns {Object} - Order export status ({
            status: 'string',
            statusText: 'string',
            statusType: 'info'
        })
     */
    getOrderExportStatus: function (order) {
        let eswShipmentStatusMessage = null;
        let eswOutboundShipmentJson = null;
        let eswOutboundShipmentResponseAsText = null;
        let result = {
            status: Constants.N_A,
            statusText: 'Not Available',
            statusType: 'info',
            statusMessage: 'Seems data error',
            responseAsText: null
        };
        // Check if order has shipment response
        let orderShipments = order.getShipments().iterator();
        while (orderShipments.hasNext()) {
            let orderShipment = orderShipments.next();
            if (orderShipment.isDefault()) {
                if (orderShipment.custom.eswOutboundShipmentJson && !empty(orderShipment.custom.eswOutboundShipmentJson)) {
                    eswOutboundShipmentResponseAsText = orderShipment.custom.eswOutboundShipmentJson;
                    eswOutboundShipmentJson = eswCoreHelper.strToJson(eswOutboundShipmentResponseAsText);
                    eswShipmentStatusMessage = eswOutboundShipmentJson.statusMessage || eswOutboundShipmentJson.message || null;
                }
            }
        }
        // Success - Exported
        if (order.custom.eswCreateOutboundShipment && order.custom.eswCreateOutboundShipment === true && !empty(eswOutboundShipmentJson)) {
            let dateCreatedAt = null;
            let createdAtFormat = null;
            if (!empty(eswOutboundShipmentJson.createdAt)) {
                dateCreatedAt = new Date(eswOutboundShipmentJson.createdAt);
                let year = dateCreatedAt.getFullYear();
                let month = dateCreatedAt.getMonth() + 1;
                let day = dateCreatedAt.getDate();
                let hour = dateCreatedAt.getHours();
                let minute = dateCreatedAt.getMinutes();
                let second = dateCreatedAt.getSeconds();
                let amPm = hour >= 12 ? 'PM' : 'AM';
                createdAtFormat = month + '/' + day + '/' + year + ' ' + hour + ':' + minute + ':' + second + ' ' + amPm;
            }
            result = {
                status: Constants.EXPORTED,
                statusText: 'Exported',
                statusMessage: Resource.msgf('msg.order.exported', 'eswbm', null, !empty(createdAtFormat) ? 'at ' + createdAtFormat : ''),
                statusType: 'success'
            };
        }
        if (!order.custom.eswCreateOutboundShipment || order.custom.eswCreateOutboundShipment === false) {
            // Pending - Not Exported
            if (empty(eswShipmentStatusMessage)) {
                result = {
                    status: Constants.NOT_EXPORTED,
                    statusText: 'Not Exported',
                    statusMessage: Resource.msg('msg.order.not.exported', 'eswbm', null),
                    statusType: 'warning'
                };
            }
            // Error - Export Failed
            if (!empty(eswShipmentStatusMessage) && eswShipmentStatusMessage !== 'Success') {
                result = {
                    status: Constants.EXPORT_FAILED,
                    statusText: 'Export Failed',
                    statusMessage: eswOutboundShipmentJson.message || eswOutboundShipmentJson.statusMessage,
                    statusType: 'danger'
                };
            }
        }
        result.responseAsText = eswCoreHelper.beautifyJsonAsString(JSON.parse(eswOutboundShipmentResponseAsText));
        return result;
    }
};

module.exports = OrderHelpers;
