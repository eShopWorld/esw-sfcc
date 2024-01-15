/* eslint-disable require-jsdoc */
'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const Resource = require('dw/web/Resource');

const eswCatalogHelper = require('*/cartridge/scripts/helper/eswCatalogHelper');
const Constants = require('*/cartridge/scripts/util/Constants');

/**
 * Script file for executing Catalog Feed and
 * sending selected Full products to ESW
 * @param {Array} saleableProducts - saleableProducts
 * @return {boolean} - returns execute result
 */
function syncSelectedProducts(saleableProducts) {
    try {
        let productBatches = eswCatalogHelper.convertArrayToChunks(saleableProducts, Constants.CATALOG_API_CHUNK);
        let payload;
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
                isModifiedAfterSync = productModifiedDate.getTime() > syncedDateTime.getTime();
            }
            if (isModifiedAfterSync) {
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

exports.syncSelectedProducts = syncSelectedProducts;
exports.getProductSyncStatus = getProductSyncStatus;
exports.getSyncStatusInfo = getSyncStatusInfo;
