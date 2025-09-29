/* eslint-disable require-jsdoc */
'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');

const eswCatalogHelper = require('*/cartridge/scripts/helper/eswCatalogHelper');
const Constants = require('*/cartridge/scripts/util/Constants');

/**
 * Script file for executing Catalog Feed and
 * sending selected Full products to ESW
 * @param {Array} saleableProducts - saleableProducts
 * @return {boolean} - returns execute result
 */
function syncSelectedProducts(saleableProducts) {
    let payload;
    try {
        let productBatches = eswCatalogHelper.convertArrayToChunks(saleableProducts, Constants.CATALOG_API_CHUNK);
        for (let i = 0; i < productBatches.length; i++) {
            payload = eswCatalogHelper.generateProductBatchPayload(productBatches[i]);
            eswCatalogHelper.sendCatalogData(payload);
        }
    } catch (error) {
        Logger.error('ESW Catalog Sync error: ' + error);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}


/**
 * Function will work only if product is valid
 * @param {dw.catalog.Product} product - DW product
 * @returns {string} - status info string
 */
function getSyncStatusInfo(product) {
    let statusInfoMsg = 'unknown';
    let isInternallyValidProduct = !eswCatalogHelper.isValidProduct(product).isError;
    let isModifiedAfterSync = false;
    let productModifiedDate = product.lastModified;
    if (isInternallyValidProduct) {
        if (!empty(product.custom.eswSyncMessage) && !empty(JSON.parse(product.custom.eswSyncMessage).code)) {
            let eswSyncedAttrVal = JSON.parse(product.custom.eswSyncMessage);
            let syncedDateTime = eswSyncedAttrVal.lastSynced || null;
            if (!empty(syncedDateTime)) {
                syncedDateTime = new Date(syncedDateTime);
                isModifiedAfterSync = productModifiedDate.getTime() >= syncedDateTime.getTime();
            }
            if (isModifiedAfterSync && eswSyncedAttrVal.code === 202) {
                statusInfoMsg = 'synced';
                return statusInfoMsg;
            }
            if (eswSyncedAttrVal.code === 202) {
                statusInfoMsg = 'synced';
            } else {
                statusInfoMsg = 'apiError';
            }
        }
    }
    return statusInfoMsg;
}

/**
 * Return sync or unsync status message
 * @param {dw.catalog.Product} product - DW product
 * @returns {string} - status info text
 */
function getProductSyncStatus(product) {
    let syncStatusInfo = getSyncStatusInfo(product);
    return syncStatusInfo === 'synced' ? Resource.msg('label.synced', 'eswbm', null) : Resource.msg('label.unsynced', 'eswbm', null);
}

/**
 * ship orders to ESW using package job helpers
 * @param {dw.catalog.orders} orderBatch - DW orderBatch
 */
function shipOrders(orderBatch) {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let sendASNtoESWHelper = require('*/cartridge/scripts/jobs/sendASNtoESW').getSendASNtoESWUtils;
    for (let i = 0; i < orderBatch.length; i++) {
        let order = orderBatch[i];
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
}

/**
 * Script file for executing orders
 * sending selected orders to ESW
 * @param {Array} saleableOrders - saleableOrders
 * @return {boolean} - returns execute result
 */
function exportSelectedOrders(saleableOrders) {
    try {
        let orderBatches = eswCatalogHelper.convertArrayToChunks(saleableOrders, Constants.CATALOG_API_CHUNK);
        for (let i = 0; i < orderBatches.length; i++) {
            shipOrders(orderBatches[i]);
        }
    } catch (error) {
        Logger.error('ESW Catalog Sync error: ' + error);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.syncSelectedProducts = syncSelectedProducts;
exports.getProductSyncStatus = getProductSyncStatus;
exports.getSyncStatusInfo = getSyncStatusInfo;
exports.exportSelectedOrders = exportSelectedOrders;
exports.shipOrders = shipOrders;
