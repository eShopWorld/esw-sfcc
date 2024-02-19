'use strict';

/* API Includes */
const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const CSVStreamWriter = require('dw/io/CSVStreamWriter');
const eswCatalogHelper = require('*/cartridge/scripts/helper/eswCatalogHelper');
let eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

const Logger = require('dw/system/Logger');
const Site = require('dw/system/Site').getCurrent();
const Transaction = require('dw/system/Transaction');
const Status = require('dw/system/Status');

const CatalogUtils = {
    /**
     * Returns site custom preference value
     * from ESW Catalog Integration group
     * @param {string} customPref - field name
     * @return {string} - value of custom preference
     */
    getFeedCustomPrefVal: function (customPref) {
        return Site.getCustomPreferenceValue('eswCatalogFeed' + customPref);
    },
    /**
     * Generates the file name with brand and leading zeros
     * as expected from ESW side
     * @return {string} - formatted file name
     */
    getFileName: function () {
        let brandCode = Site.getCustomPreferenceValue('eswRetailerBrandCode');
        let instanceID = (!empty(this.getFeedCustomPrefVal('InstanceID'))) ? this.getFeedCustomPrefVal('InstanceID') : '';
        return 'Catalog-' + brandCode + '-' + instanceID + ('000000000' + this.getFileCount()).substr(-8) + '.csv';
    },
    /**
     * Returns the retailer catalog feed file count
     * stored in hidden custom site preference
     * @return {string} - file count
     */
    getFileCount: function () {
        return Site.getCustomPreferenceValue('eswRetailerCatalogFeedFileCount');
    },
    /**
     * Removes newline/ space type of delimiters
     * from the given string so that csv file doesn't break
     * @param {string} str - given string
     * @return {string} - formatted string
     */
    formatString: function (str) {
        return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, ',').replace(/,/g, ' ');
    },
    /**
     * Increments the retailer catalog feed file count
     * in hidden custom site preference
     */
    incrementFileCount: function () {
        let count = this.getFileCount();
        count++;
        Transaction.wrap(function () {
            Site.setCustomPreferenceValue('eswRetailerCatalogFeedFileCount', count);
        });
    },
    /**
     * Returns the ESW Catalog Feed Product Custom Fields Mapping
     * @return {Object} ESWKeyField and Product Custom Attribute Mapping JSON.
     */
    getProductCustomFieldMapping: function () {
        let productCustomAttrFieldMapping = !empty(this.getFeedCustomPrefVal('ProductCustomAttrFieldMapping')) ? this.getFeedCustomPrefVal('ProductCustomAttrFieldMapping') : '';
        return !empty(productCustomAttrFieldMapping) ? JSON.parse(productCustomAttrFieldMapping) : '';
    },
    /**
     * ESW SFTP service
     * @return {Object} SFTPService - service object
     */
    getSFTPService: function () {
        let serviceName = this.getFeedCustomPrefVal('SFTPService');
        let SFTPService = dw.svc.LocalServiceRegistry.createService(serviceName, {
            createRequest: function (service, params) {
                return params;
            },
            parseResponse: function (service, listOutput) {
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return SFTPService;
    },
    /**
     * This function writes headers of csv file
     * @param {Object} csvWriter - csv writer object
     */
    writeHeaders: function (csvWriter) {
        let fieldMapping = this.getProductCustomFieldMapping();
        let headerArray = [
            'productCode',
            'name',
            'description',
            'parentProductCode',
            'size',
            'url',
            'imageUrl',
            'unitPrice',
            'unitPriceCurrencyIso',
            'additionalProductCode',
            'variantProductCode'
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
     * needed to ESW Catalog
     * @param {Object} csvWriter - csv writer object
     * @param {Object} product - Product
     */
    writeRecords: function (csvWriter, product) {
        let URLUtils = require('dw/web/URLUtils'),
            fieldMapping = this.getProductCustomFieldMapping(),
            productImg = product.getImage('small', 0).httpURL.toString(),
            productShortDescription = this.formatString(product.shortDescription.toString()),
            size = '',
            masterProductID = '';

        if (product.isVariant()) {
            let sizeattr = product.variationModel.getProductVariationAttribute('size');
            if (!empty(sizeattr)) {
                let sizeObj = product.variationModel.getVariationValue(product, sizeattr);
                if (sizeObj) {
                    size = sizeObj.value + ' (' + sizeObj.displayValue + ')';
                }
            }
            masterProductID = product.getMasterProduct().getID();
        }

        let priceBookID = this.getFeedCustomPrefVal('PriceBookID');
        let priceBookPrice = product.priceModel.getPriceBookPrice(priceBookID);
        let productPrice = (priceBookPrice.valueOrNull !== null) ? priceBookPrice : '';

        let recordArray = [
            product.ID,
            product.name,
            productShortDescription,
            masterProductID,
            size,
            URLUtils.https('Product-Show', 'pid', product.ID).toString(),
            !empty(productImg) ? productImg : '',
            !empty(productPrice) ? productPrice.value : '',
            !empty(productPrice) ? productPrice.currencyCode : '',
            '',
            masterProductID
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
 * Script file for executing Catalog Feed and
 * sending Initial Full Catalog/ Catalog updates to ESW
 * @return {boolean} - returns execute result
 */
function execute() {
    let saleableProducts,
        fWriter,
        csvWriter;
    let Constants = require('*/cartridge/scripts/util/Constants');
    if (eswCoreHelper.isEswCatalogFeatureEnabled()) {
        try {
            if (eswCoreHelper.getCatalogUploadMethod() === 'api') {
                saleableProducts = eswCatalogHelper.getFilteredProducts(true);
                let productBatches = eswCatalogHelper.convertArrayToChunks(saleableProducts, Constants.CATALOG_API_CHUNK);
                let payload;
                for (let i = 0; i < productBatches.length; i++) {
                    payload = eswCatalogHelper.generateProductBatchPayload(productBatches[i]);
                    eswCatalogHelper.sendCatalogData(payload);
                }
            } else {
                let filePath = CatalogUtils.getFeedCustomPrefVal('LocalPath') + Site.ID;
                let folder = new File(filePath);

                if (!folder.exists()) {
                    folder.mkdirs();
                }
                let fileName = CatalogUtils.getFileName();
                let file = new File(filePath + File.SEPARATOR + fileName);
                fWriter = new FileWriter(file);
                let catalogFeedDelimiter = (!empty(CatalogUtils.getFeedCustomPrefVal('Delimiter'))) ? CatalogUtils.getFeedCustomPrefVal('Delimiter') : '|';
                csvWriter = new CSVStreamWriter(fWriter, catalogFeedDelimiter);
                // Write CSV File Headers
                CatalogUtils.writeHeaders(csvWriter);
                saleableProducts = eswCatalogHelper.getFilteredProducts();
                let products;
                let fileHasRecords = false;
                let feedlastExecutedTimeStamp = CatalogUtils.getFeedCustomPrefVal('TimeStamp');
                while (saleableProducts.hasNext()) {
                    products = saleableProducts.next().getRepresentedProducts().toArray();
                    products.forEach(function (product) { // eslint-disable-line no-loop-func
                        // Send all products in catalog if job is executing first time
                        if (empty(feedlastExecutedTimeStamp)) {
                            // Write CSV File Records
                            CatalogUtils.writeRecords(csvWriter, product);
                            fileHasRecords = true;
                        } else {
                            // Send only that products which were created or modified after job execution
                            let productLastModifiedTimeStamp = eswCatalogHelper.formatTimeStamp(product.lastModified);
                            if (productLastModifiedTimeStamp > feedlastExecutedTimeStamp) {
                                CatalogUtils.writeRecords(csvWriter, product);
                                fileHasRecords = true;
                            }
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
                    let remotePath = CatalogUtils.getFeedCustomPrefVal('RemotePath');

                    if (empty(remotePath)) {
                        Logger.error('UploadCatalogFeed: Parameter remotePath is empty.');
                        return new Status(Status.ERROR);
                    }

                    let sftpService = CatalogUtils.getSFTPService();
                    remotePath += fileName;
                    let result = sftpService.setOperation('putBinary', remotePath, file).call();

                    if (!result.ok) {
                        Logger.error('UploadCatalogFeed: Error While sending file to SFTP.');
                        return new Status(Status.ERROR);
                    }

                    // Increment File Count each time a new file is distributed
                    CatalogUtils.incrementFileCount();
                } else {
                    // Delete the file, as there are no records so it only has the headers
                    file.remove();
                    Logger.info('UploadCatalogFeed: No new record(s) found.');
                }
            }
            // Save last execution time stamp of job feed
            eswCatalogHelper.saveFeedExecutionTimeStamp();
        } catch (e) {
            if (eswCoreHelper.isEswCatalogFeatureEnabled() && eswCoreHelper.getCatalogUploadMethod() === 'sftp') {
                if (csvWriter) {
                    csvWriter.close();
                }
                if (fWriter) {
                    fWriter.close();
                }
            }
            Logger.error('ESW Catalog Sync Job error: ' + e);
            return new Status(Status.ERROR);
        }
    }
    return new Status(Status.OK);
}

exports.execute = execute;
