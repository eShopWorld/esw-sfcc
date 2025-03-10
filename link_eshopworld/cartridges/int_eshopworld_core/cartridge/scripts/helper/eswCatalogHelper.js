'use strict';
const Site = require('dw/system/Site').getCurrent();
const StringUtils = require('dw/util/StringUtils');
const Transaction = require('dw/system/Transaction');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Calendar = require('dw/util/Calendar');

const CATALOG_HELPER = {
    /**
     * Formats time stamp into TZ date and time format
     * @param {Object} timeStamp - the Date object
     * @return {string} - formatted time stamp
     */
    formatTimeStamp: function (timeStamp) {
        return StringUtils.formatCalendar(new Calendar(timeStamp), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
    },
    /**
     * Saves the last execution time and date as a time stamp
     * in custom site preference
     */
    saveFeedExecutionTimeStamp: function () {
        let today = this.formatTimeStamp(new Date());
        Transaction.wrap(function () {
            Site.setCustomPreferenceValue('eswCatalogFeedTimeStamp', today);
        });
    },
    /**
     * return filtered products
     * @param {boolean} isApiMethod - if api method or not
     * @returns {Object} - products
     */
    getFilteredProducts: function (isApiMethod) {
        let ProductSearchModel = require('dw/catalog/ProductSearchModel');
        let prodModel = new ProductSearchModel();
        prodModel.setCategoryID('root');
        prodModel.setRecursiveCategorySearch(true);
        prodModel.setOrderableProductsOnly(true);
        prodModel.search();
        let productSearchHits = prodModel.productSearchHits;
        let filteredProducts = [];
        let feedlastExecutedTimeStamp = eswHelper.getEswCatalogFeedLastExec();
        if (productSearchHits) {
            while (productSearchHits.hasNext()) {
                let productSearchHit = productSearchHits.next();
                if (productSearchHit.hitType === 'master') {
                    let masterProduct = productSearchHit.product;
                    let productLastModifiedTimeStamp = new Calendar(new Date(masterProduct.lastModified));
                    if (!isApiMethod || (!this.isValidProduct(masterProduct).isError && (empty(feedlastExecutedTimeStamp) || productLastModifiedTimeStamp.after(feedlastExecutedTimeStamp)))) {
                        filteredProducts.push(masterProduct);
                    }
                    let variants = masterProduct.getVariants();
                    if (!empty(variants)) {
                        variants = variants.iterator();
                        while (variants.hasNext()) {
                            let variant = variants.next();
                            if (variant.availabilityModel.isOrderable()) {
                                productLastModifiedTimeStamp = new Calendar(new Date(variant.lastModified));
                                if (!isApiMethod || (!this.isValidProduct(variant).isError && (empty(feedlastExecutedTimeStamp) || productLastModifiedTimeStamp.after(feedlastExecutedTimeStamp)))) {
                                    filteredProducts.push(variant);
                                }
                            }
                        }
                    }
                } else if (productSearchHit.hitType === 'bundle' || productSearchHit.hitType === 'set' || (productSearchHit.hitType === 'product' && !productSearchHit.product.isVariant())) {
                    let productHit = productSearchHit.product;
                    let productLastModifiedTimeStamp = new Calendar(new Date(productHit.lastModified));
                    if (!isApiMethod || (!this.isValidProduct(productHit).isError && (empty(feedlastExecutedTimeStamp) || productLastModifiedTimeStamp.after(feedlastExecutedTimeStamp)))) {
                        filteredProducts.push(productHit);
                    }
                }
            }
        }
        return filteredProducts;
    },
    generateProductBatchPayload: function (productBatch) {
        let URLUtils = require('dw/web/URLUtils');
        let apiPayload = [];
        let productMapping = eswHelper.strToJson(eswHelper.getEswCatalogFeedProductCustomAttrFieldMapping());
        for (let i = 0; i < productBatch.length; i++) {
            let product = productBatch[i];
            if (!empty(product) && typeof product === 'object') {
                let reqPayload = {
                    productCode: product.ID,
                    name: product.name,
                    description: !empty(product.shortDescription) ? product.shortDescription.getMarkup() : null,
                    material: ('eswMaterial' in product.custom) ? product.custom.eswMaterial : null,
                    countryOfOrigin: ('eswCountryOfOrigin' in product.custom) ? product.custom.eswCountryOfOrigin : null,
                    hsCode: ('eswHsCode' in product.custom) ? product.custom.eswHsCode : null,
                    hsCodeRegion: ('eswHsCodeRegion' in product.custom) ? product.custom.eswHsCodeRegion : null,
                    category: null, // ENUM allowed from API
                    gender: ('gender' in product.custom) ? product.custom.gender : null,
                    ageGroup: ('ageGroup' in product.custom) ? product.custom.ageGroup : null,
                    size: ('size' in product.custom) ? product.custom.size : null,
                    weight: ('weight' in product.custom) ? product.custom.weight : null,
                    weightUnit: ('weightUnit' in product.custom) ? product.custom.weightUnit : null,
                    url: URLUtils.https('Product-Show', 'pid', product.ID).toString(),
                    imageUrl: !empty(product.getImage('small')) ? product.getImage('small').getAbsURL().toString() : null,
                    unitPrice: !empty(product.getPriceModel()) && !empty(product.getPriceModel().getPricePerUnit()) ? {
                        amount: product.getPriceModel().getPricePerUnit().value,
                        currency: eswHelper.getBaseCurrencyPreference()
                    } : null,
                    dangerousGoods: ('dangerousGoods' in product.custom) ? product.custom.dangerousGoods : null,
                    additionalProductCode: null,
                    variantProductCode: null
                };
                if (!empty(productMapping) && eswHelper.isValidJson(productMapping)) {
                    // eslint-disable-next-line no-restricted-syntax
                    for (let key in productMapping) {
                        // eslint-disable-next-line no-prototype-builtins
                        if (productMapping.hasOwnProperty(key)) {
                            let productCustomAttrVal = productMapping[key] in product.custom ? product.custom[productMapping[key]] : null;
                            if (!empty(productCustomAttrVal)) {
                                reqPayload[key] = productCustomAttrVal;
                            }
                        }
                    }
                }
                apiPayload.push(reqPayload);
            }
        }
        return apiPayload;
    },
    sendCatalogData: function (payload) {
        const Logger = require('dw/system/Logger');
        const Status = require('dw/system/Status');
        try {
            let eswServices = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
                oAuthObj = eswServices.getOAuthService();
            let formData = {
                grant_type: 'client_credentials',
                scope: 'logistics.catalog.api.upload'
            };
            formData.client_id = eswHelper.getClientID();
            formData.client_secret = eswHelper.getClientSecret();

            let oAuthResult = oAuthObj.call(formData);
            if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
                Logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
                return new Status(Status.ERROR);
            }

            let catalogServiceResponse = eswServices.getCatalogService().call({
                eswOAuthToken: JSON.parse(oAuthResult.object).access_token,
                requestBody: payload
            });

            this.storeCatalogApiResponse(payload, catalogServiceResponse);

            return catalogServiceResponse;
        } catch (e) {
            Logger.error('Catalog service call error: {0}', e.message);
            return new Status(Status.ERROR);
        }
    },
    isValidCountryOfOrigin: function (countryCode) {
        return !empty(countryCode);
    },
    /**
     * Check if given hsCode is valid
     * @param {string} hsCode - hsCode string
     * @returns {boolean} - true or false
     */
    isValidHsCodeRegion: function (hsCode) {
        return !empty(hsCode);
    },
    /**
     * Validate product internally
     * @param {dw.catalog.Product} dwProduct - SFCC Product Object
     * @param {boolean} errorDetail - Should return error detail or not
     * @returns {Object} - isError and errorMsg
     */
    isValidProduct: function (dwProduct) {
        let errorMsg = [];
        if (!eswHelper.isEswCatalogFeatureEnabled()) {
            return {
                isError: true,
                errorMsg: errorMsg
            };
        }
        if (!eswHelper.isEswCatalogInternalValidationEnabled()) {
            return {
                isError: false,
                errorMsg: errorMsg
            };
        }

        let product = dwProduct;
        if (empty(product.getID())) {
            errorMsg.push('<code>product.ID</code> is empty');
        }
        if (empty(product.getName())) {
            errorMsg.push('<code>product.name</code> is empty');
        }
        if (empty(product.getShortDescription())) {
            errorMsg.push('<code>product.shortDescription</code> is empty');
        }
        try {
            if (empty(product.custom.eswMaterial)) {
                errorMsg.push('<code>product.custom.eswMaterial</code> is empty');
            }
        } catch (e) {
            errorMsg.push('<code>product.custom.eswMaterial</code> custom attribute not exist');
        }

        try {
            if (empty(product.custom.eswHsCode)) {
                errorMsg.push('<code>product.custom.eswHsCode</code> is empty');
            } else if (product.custom.eswHsCode.length < 6) {
                errorMsg.push('<code>product.custom.eswHsCode</code> should be a minimum of 6 digits');
            }
        } catch (e) {
            errorMsg.push('<code>product.custom.eswHsCode</code> custom attribute not exist');
        }

        try {
            if (empty(product.custom.eswHsCodeRegion)) {
                errorMsg.push('<code>product.custom.eswHsCodeRegion</code> is empty');
            } else if (!this.isValidHsCodeRegion(product.custom.eswHsCodeRegion)) {
                errorMsg.push('<code>product.custom.eswHsCodeRegion</code> is not valid');
            }
        } catch (e) {
            errorMsg.push('<code>product.custom.eswHsCodeRegion</code> custom attribute not exist');
        }

        try {
            if (empty(product.custom.eswCountryOfOrigin)) {
                errorMsg.push('<code>product.custom.eswCountryOfOrigin</code> is empty');
            } else if (!this.isValidCountryOfOrigin(product.custom.eswCountryOfOrigin)) {
                errorMsg.push('<code>product.custom.eswCountryOfOrigin</code> is not valid');
            }
        } catch (e) {
            errorMsg.push('<code>product.custom.eswCountryOfOrigin</code> custom attribute not exist');
        }
        return {
            isError: !empty(errorMsg),
            errorMsg: errorMsg
        };
    },
    /**
     * Validate product externally
     * @param {dw.catalog.Product} product - SFCC Product Object
     * @returns {boolean} - true or false
     */
    isExternalyValidProduct: function (product) {
        let errorMessageObj = { isError: false };
        try {
            if (('eswSyncMessage' in product.custom && !empty(product.custom.eswSyncMessage))) {
                errorMessageObj.errorMsg = JSON.parse(product.custom.eswSyncMessage);
                errorMessageObj.isError = 'code' in errorMessageObj.errorMsg && Number(errorMessageObj.errorMsg.code) !== 202;
                errorMessageObj.externallyValidated = true;
            }
        } catch (e) {
            errorMessageObj.isError = true;
            errorMessageObj.errorMsg = '<code>product.custom.eswSyncMessage</code> custom attribute not exist';
        }
        return errorMessageObj;
    },
    /**
     * Divind array in chunks
     * @param {Object} arr - Array to be convert in chunk
     * @param {number} chunkSize - size of chunk
     * @returns {Object} - resultant array
     */
    convertArrayToChunks: function (arr, chunkSize) {
        let res = [];
        for (let i = 0; i < arr.length; i += chunkSize) {
            res.push(arr.slice(i, i + chunkSize));
        }
        return res;
    },

    /**
     * Stores catalog service error response on product's custom attributes
     * @param {Object} productBatchIds - product IDs
     * @param {dw.svc.Result} res - The service response
     */
    storeCatalogApiResponse: function (productBatchIds, res) {
        const ProductMgr = require('dw/catalog/ProductMgr');
        for (let i = 0; i < productBatchIds.length; i++) {
            let apiProduct = ProductMgr.getProduct(productBatchIds[i].productCode);
            if (!empty(apiProduct)) {
                Transaction.wrap(function () {
                    if (res.isOk()) {
                        apiProduct.custom.eswSyncMessage = JSON.stringify({ lastSynced: new Date(), code: res.object.statusCode });
                    } else {
                        let errorMessage = !res.isOk() && !empty(res.errorMessage) ? JSON.parse(res.errorMessage)[0] : '';
                        if (!empty(errorMessage)) {
                            errorMessage.lastSynced = new Date();
                        }
                        apiProduct.custom.eswSyncMessage = JSON.stringify(errorMessage);
                    }
                    apiProduct.custom.eswSync = res.isOk();
                });
            }
        }
    }
};
module.exports = CATALOG_HELPER;
