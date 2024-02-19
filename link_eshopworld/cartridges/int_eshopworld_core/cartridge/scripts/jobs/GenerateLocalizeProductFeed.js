'use strict';

/* API Includes */
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');

/* API Includes */
const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const CSVStreamWriter = require('dw/io/CSVStreamWriter');

const Site = require('dw/system/Site').getCurrent();
const StringUtils = require('dw/util/StringUtils');
const ProductSearchModel = require('dw/catalog/ProductSearchModel');

const CatalogUtils = {
    /**
     * Returns site custom preference value
     * from ESW Catalog Integration group
     * @param {string} customPref - field name
     * @return {string} - value of custom preference
     */
    getFeedCustomPrefVal: function (customPref) {
        return Site.getCustomPreferenceValue('eswMamentaFeed' + customPref);
    },
    /**
     * Formats time stamp into TZ date and time format
     * @param {Object} timeStamp - the Date object
     * @return {string} - formatted time stamp
     */
    formatTimeStamp: function (timeStamp) {
        return StringUtils.formatCalendar(new dw.util.Calendar(timeStamp), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
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
     * Generates the file name with brand and leading zeros
     * as expected from ESW side
     * @return {string} - formatted file name
     * @param {string} countryCode - countrycode
     * @returns {string} - file name
     */
    getFileName: function (countryCode) {
        let siteId = Site.getID();
        let today = this.formatTimeStamp(new Date());
        return siteId + '_' + countryCode + '_' + today + '_catalog.csv';
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
            'color',
            'url',
            'imageUrl',
            'unitPrice',
            'unitPriceCurrencyIso',
            'online',
            'manufacturerModel',
            'upc',
            'category',
            'inStock',
            'availabilityStatus',
            'preorderBackorderAllocation',
            'preorderBackOrderHandlingDesc',
            'productDetails'
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
     * @param {Object} prodObj - Product custom object
     */
    writeRecords: function (csvWriter, product, prodObj) {
        let URLUtils = require('dw/web/URLUtils'),
            fieldMapping = this.getProductCustomFieldMapping(),
            productImg = product.getImage('small', 0).httpURL.toString(),
            productShortDescription = this.formatString(product.shortDescription.toString()),
            size = '',
            masterProductID = '',
            color = '';

        if (product.isVariant()) {
            let sizeattr = product.variationModel.getProductVariationAttribute('size');
            if (!empty(sizeattr)) {
                let sizeObj = product.variationModel.getVariationValue(product, sizeattr);
                if (sizeObj) {
                    size = sizeObj.value + ' (' + sizeObj.displayValue + ')';
                }
            }

            let colorattr = product.variationModel.getProductVariationAttribute('color');
            if (!empty(colorattr)) {
                let colorObj = product.variationModel.getVariationValue(product, colorattr);
                if (colorObj) {
                    color = colorObj.value + ' (' + colorObj.displayValue + ')';
                }
            }
            masterProductID = product.getMasterProduct().getID();
        }

        // let priceBookID = this.getFeedCustomPrefVal('PriceBookID');
        // let priceBookPrice = product.priceModel.getPriceBookPrice(priceBookID);
        // let productPrice = (priceBookPrice.valueOrNull !== null) ? priceBookPrice : '';
        let avm = product.availabilityModel;
        let availableCount = 0;
        if (avm.availability > 0 && !empty(avm.inventoryRecord)) {
            availableCount = avm.inventoryRecord.isPerpetual() ? 999 : avm.inventoryRecord.ATS.value.toFixed().toString();
        }

        let preorderBackOrderHandlingDesc = 'None';
        if (product.availabilityModel.inventoryRecord == null) {
            preorderBackOrderHandlingDesc = '';
        } else if (product.availabilityModel.inventoryRecord.preorderable) {
            preorderBackOrderHandlingDesc = 'Pre-Order';
        } else if (product.availabilityModel.inventoryRecord.backorderable) {
            preorderBackOrderHandlingDesc = 'Backorder';
        }

        let productDetails = !empty(product.longDescription) && product.longDescription.markup.length > 0 ? this.formatString(product.longDescription.markup.toString()) : '';
        productDetails = productDetails.replace(/<[^>]+>/g, '');

        let productUrl = URLUtils.https('Product-Show', 'pid', product.ID).toString();
        if (productUrl.indexOf('?') > -1) {
            productUrl += '&country=' + prodObj.country;
        } else {
            productUrl += '?country=' + prodObj.country;
        }
        let recordArray = [
            product.ID,
            product.name,
            productShortDescription,
            masterProductID,
            size,
            color,
            productUrl,
            !empty(productImg) ? productImg : '',
            prodObj.priceConverted.getDecimalValue(),
            prodObj.currency,
            product.online,
            !empty(product.manufacturerSKU) ? product.manufacturerSKU : '',
            !empty(product.UPC) ? product.UPC : '',
            !empty(product.primaryCategory) ? product.primaryCategory.displayName : '',
            (availableCount > 0),
            product.availabilityModel != null ? product.availabilityModel.availabilityStatus : '',
            product.availabilityModel.inventoryRecord != null ? StringUtils.stringToXml(product.availabilityModel.inventoryRecord.preorderBackorderAllocation.value) : StringUtils.stringToXml(0),
            preorderBackOrderHandlingDesc,
            productDetails
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
 * Get Fx Rate of shopper currency
 * @param {string} shopperCurrencyIso - getting from site preference
 * @param {string} localizeCountry - shopper local country getting from site preference
 * @returns {array} returns selected fx rate
 */
function getESWCurrencyFXRate(shopperCurrencyIso, localizeCountry) {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    return eswHelper.getESWCurrencyFXRate(shopperCurrencyIso, localizeCountry);
}

/**
 * Get ESW Country Adjustments for localize country
 * @param {string} deliveryCountryIso - localize country code
 * @returns {array} returns selected country adjustment
 */
function getESWCountryAdjustments(deliveryCountryIso) {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    return eswHelper.getESWCountryAdjustments(deliveryCountryIso);
}

/**
 * Script to build PriceBook schema.
 * If price book exist: Find and update products with missing prices without modifying the existing products prices.
 * If price book does not exist: Generate a Price Book for a required/specified currency in the site preferences
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */
function execute(args) {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let eswPricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
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
            let filePath = args.impexDirPath;
            let folder = new File(filePath);

            if (!folder.exists()) {
                folder.mkdirs();
            }

            let fileName = CatalogUtils.getFileName(countryCode);
            let file = new File(filePath + File.SEPARATOR + fileName);
            let fWriter = new FileWriter(file);
            let catalogFeedDelimiter = (!empty(CatalogUtils.getFeedCustomPrefVal('Delimiter'))) ? CatalogUtils.getFeedCustomPrefVal('Delimiter') : '|';
            let csvWriter = new CSVStreamWriter(fWriter, catalogFeedDelimiter);
            CatalogUtils.writeHeaders(csvWriter);
            // end file write

            let selectedCountryDetail = eswHelper.getSelectedCountryDetail(countryCode);
            selectedCountryDetail.currency = eswHelper.getDefaultCurrencyForCountry(countryCode);
            let localizeObj = {
                currencyCode: selectedCountryDetail.currency,
                countryCode: countryCode,
                applyRoundingModel: !selectedCountryDetail.isFixedPriceModel,
                applyCountryAdjustments: false // !selectedCountryDetail.isFixedPriceModel
            };
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
                        let priceConverted = 0;
                        let appliedPriceBook = '-';
                        if (selectedCountryDetail.isFixedPriceModel) {
                            // This can be from getLocalizePriceBook
                            let overridePriceBooks = eswHelper.getOverridePriceBooks(countryCode);
                            let salePriceBook = overridePriceBooks[1];
                            let listPriceBook = overridePriceBooks[0];
                            priceConverted = product.priceModel.getPriceBookPrice(salePriceBook);
                            appliedPriceBook = salePriceBook;
                            if (empty(priceConverted) || priceConverted.value === 0) {
                                priceConverted = product.priceModel.getPriceBookPrice(listPriceBook);
                                appliedPriceBook = listPriceBook;
                            }
                        } else {
                            let selectedFxRate = getESWCurrencyFXRate(localizeObj.currencyCode, localizeObj.countryCode);
                            let selectedCountryAdjustments = getESWCountryAdjustments(localizeObj.countryCode);
                            let selectedRoundingRule = eswPricingHelper.getESWRoundingModel(localizeObj);
                            if (!empty(product.priceModel.priceInfo)) {
                                appliedPriceBook = product.priceModel.priceInfo.priceBook.ID;
                            }
                            // priceissue from different book
                            let pPrice = product.priceModel.price;
                            session.privacy.rounding = !empty(selectedRoundingRule[0]) ? JSON.stringify(selectedRoundingRule[0]) : '';
                            priceConverted = eswHelper.getMoneyObject(pPrice, false, false, false, {
                                selectedCountry: countryCode,
                                selectedFxRate: selectedFxRate[0],
                                selectedCountryAdjustments: selectedCountryAdjustments[0],
                                selectedRoundingRule: selectedRoundingRule[0]
                            });
                            delete session.privacy.rounding;
                        }

                        let prodData = {
                            priceConverted: priceConverted,
                            country: countryCode,
                            currency: selectedCountryDetail.currency,
                            appliedPriceBook: appliedPriceBook
                        };
                        // Send all products in catalog
                        CatalogUtils.writeRecords(csvWriter, product, prodData);
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
                let remotePath = Site.getCustomPreferenceValue('eswMamentaCatalogRemotePath');

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
            } else {
                // Delete the file, as there are no records so it only has the headers
                file.remove();
                Logger.info('UploadCatalogFeed: No new record(s) found.');
            }
        });
    } catch (e) {
        Logger.error('ESW Localize Pricing Job error: ' + e);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
