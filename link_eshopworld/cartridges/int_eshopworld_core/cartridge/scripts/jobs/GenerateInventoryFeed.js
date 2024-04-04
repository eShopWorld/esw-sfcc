'use strict';

/* API Includes */
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');

/* API Includes */
const FileWriter = require('dw/io/FileWriter');
const CSVStreamWriter = require('dw/io/CSVStreamWriter');
const prefrenceName = 'eswMamentaFeed';

const Site = require('dw/system/Site').getCurrent();
const ProductSearchModel = require('dw/catalog/ProductSearchModel');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

const InventoryUtils = {
    /**
     * Returns the ESW inventory Feed Product Custom Fields Mapping
     * @return {Object} ESWKeyField and Product Custom Attribute Mapping JSON.
     */
    getProductCustomFieldMapping: function () {
        let productCustomAttrFieldMapping = !empty(eswHelper.getFeedCustomPrefVal('ProductCustomAttrFieldMapping', prefrenceName)) ? eswHelper.getFeedCustomPrefVal('ProductCustomAttrFieldMapping', prefrenceName) : '';
        return !empty(productCustomAttrFieldMapping) ? JSON.parse(productCustomAttrFieldMapping) : '';
    },
    /**
     * This function writes headers of csv file
     * @param {Object} csvWriter - csv writer object
     */
    writeHeaders: function (csvWriter) {
        let fieldMapping = this.getProductCustomFieldMapping();
        let headerArray = [
            'productCode',
            'ats'
        ];

        // Add custom headers
        if (!empty(fieldMapping)) {
            Object.keys(fieldMapping).forEach(function (key) {
                headerArray.push(key);
            });
        }
        csvWriter.writeNext(headerArray);
    },
    /**
     * This function writes records of products in csv file
     * needed to ESW inventory
     * @param {Object} csvWriter - csv writer object
     * @param {Object} product - Product
     */
    writeRecords: function (csvWriter, product) {
        let fieldMapping = this.getProductCustomFieldMapping();
        let avm = product.availabilityModel;
        let availableCount = 0;
        if (avm.availability > 0 && !empty(avm.inventoryRecord)) {
            availableCount = avm.inventoryRecord.isPerpetual() ? 999 : avm.inventoryRecord.ATS.value.toFixed().toString();
        }
        let recordArray = [
            product.ID,
            availableCount
        ];

        // Add custom records
        if (!empty(fieldMapping)) {
            Object.keys(fieldMapping).forEach(function (key) {
                let valFromMappedField = fieldMapping[key] in product.custom && !!product.custom[fieldMapping[key]] ? product.custom[fieldMapping[key]] : '';
                recordArray.push(valFromMappedField);
            });
        }

        csvWriter.writeNext(recordArray);
    }
};

/**
 * Script to build Inventory schema.
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */
function execute(args) {
    try {
        let fileHasRecords = false;
        let localizedPricingCountries = [];
        let selectedCountries = eswHelper.queryAllCustomObjects('ESW_COUNTRIES', 'custom.isSupportedByESW = true AND custom.isProductFeedSupported = true', 'custom.countryCode asc');
        if (selectedCountries.count > 0) {
            while (selectedCountries.hasNext()) {
                let selectedCountry = selectedCountries.next();
                localizedPricingCountries.push(selectedCountry.custom.countryCode);
            }
        }
        /* eslint consistent-return: "off" */
        localizedPricingCountries.forEach(function (countryCode) {
            // file write
            let fileName = eswHelper.getFileName({ countryCode: countryCode, jobType: 'inventoryFeed' });
            let file = eswHelper.createFile('inventoryFeed', args.impexDirPath, countryCode);
            let fWriter = new FileWriter(file);
            let catalogFeedDelimiter = (!empty(eswHelper.getFeedCustomPrefVal('Delimiter', prefrenceName))) ? eswHelper.getFeedCustomPrefVal('Delimiter', prefrenceName) : '|';
            let csvWriter = new CSVStreamWriter(fWriter, catalogFeedDelimiter);
            InventoryUtils.writeHeaders(csvWriter);
            // end file write

            let psm = new ProductSearchModel();
            let products;
            psm.setCategoryID('root');
            psm.setRecursiveCategorySearch(true);
            psm.search();
            let salableProducts = psm.getProductSearchHits();
            while (salableProducts.hasNext()) {
                products = salableProducts.next().getRepresentedProducts().toArray();
                products.forEach(function (product) { // eslint-disable-line no-loop-func
                    if (product.isProduct() && product.custom && product.custom.isMarketplaceProduct) {
                        InventoryUtils.writeRecords(csvWriter, product);
                        fileHasRecords = true;
                    }
                });
            }
            if (csvWriter) {
                csvWriter.close();
            }
            if (fWriter) {
                fWriter.close();
            }
            // If there are records in the file, then only send the file.
            if (fileHasRecords) {
                // Send File to ESW SFTP Server
                let remotePath = Site.getCustomPreferenceValue('eswMamentaInventoryRemotePath');

                if (empty(remotePath)) {
                    Logger.error('UploadInventoryFeed: Parameter remotePath is empty.');
                    return new Status(Status.ERROR);
                }

                let sftpService = eswHelper.getSFTPService(prefrenceName);
                remotePath += fileName;
                let result = sftpService.setOperation('putBinary', remotePath, file).call();

                if (!result.ok) {
                    Logger.error('UploadInventoryFeed: Error While sending file to SFTP.');
                    return new Status(Status.ERROR);
                }
            } else {
                // Delete the file, as there are no records so it only has the headers
                file.remove();
                Logger.info('UploadInventoryFeed: No new record(s) found.');
            }
        });
    } catch (e) {
        Logger.error('ESW Inventory Feed Job error: ' + e);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
