/* eslint-disable no-undef */
/* eslint-disable no-mixed-operators */

/**
 * Helper script to get all ESW site preferences
 **/
const Site = require('dw/system/Site').getCurrent();

const Cookie = require('dw/web/Cookie');
const Transaction = require('dw/system/Transaction');
const logger = require('dw/system/Logger');
const ArrayList = require('dw/util/ArrayList');
const URLUtils = require('dw/web/URLUtils');
const ContentMgr = require('dw/content/ContentMgr');

const getEswHelper = {
    isEnableLandingPageRedirect: function () {
        return Site.getCustomPreferenceValue('eswEnableLandingPageRedirect');
    },
    isEswCatalogFeatureEnabled: function () {
        return Site.getCustomPreferenceValue('isEswCatalogFeatureEnabled');
    },
    isEswCatalogInternalValidationEnabled: function () {
        return this.isEswCatalogFeatureEnabled() && Site.getCustomPreferenceValue('isEswCatalogInternalValidationEnabled');
    },
    isEswCatalogApiMethod: function () {
        let Constants = require('*/cartridge/scripts/util/Constants');
        return this.isEswCatalogFeatureEnabled() && this.getCatalogUploadMethod() === Constants.API;
    },
    getEswCatalogFeedLastExec: function () {
        return Site.getCustomPreferenceValue('eswCatalogFeedTimeStamp');
    },
    /**
     * Determine pa version used by the service URL
     * @returns {string} pa version
     */
    getPaVersion: function () {
        let LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
        let Constants = require('*/cartridge/scripts/util/Constants');
        let paVersion = Constants.UNKNOWN;
        let serviceUrl = '';
        try {
            let serviceCreds = LocalServiceRegistry.createService('EswPriceFeedService', {
                parseResponse: function (service) {
                    return service;
                }
            });
            serviceUrl = serviceCreds.getURL();
            if (!empty(serviceUrl)) {
                if (serviceUrl.indexOf('api/4.0') !== -1) {
                    paVersion = Constants.PA_V4;
                } else if (serviceUrl.indexOf('api/v3') !== -1) {
                    paVersion = Constants.PA_V3;
                }
            }
        } catch (e) {
            paVersion = Constants.PA_V3;
        }
        return paVersion;
    },
    /**
     * Determine catalog upload Mehod used by the service URL
     * @returns {string} uploadMethod
     */
    getCatalogUploadMethod: function () {
        let LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
        let Constants = require('*/cartridge/scripts/util/Constants');
        let uploadMethod = Constants.UNKNOWN;
        let serviceUrl = '';
        if (!this.isEswCatalogFeatureEnabled()) {
            return uploadMethod;
        }
        try {
            let serviceCreds = LocalServiceRegistry.createService('ESWCatalogService', {
                parseResponse: function (service) {
                    return service;
                }
            });
            serviceUrl = serviceCreds.getURL();
            if (!empty(serviceUrl) && serviceUrl.indexOf('/RetailerCatalog') !== -1) {
                uploadMethod = Constants.API;
            } else {
                uploadMethod = Constants.SFTP;
            }
        } catch (e) {
            uploadMethod = Constants.UNKNOWN;
        }
        return uploadMethod;
    },
    getEShopWorldModuleEnabled: function () {
        return Site.getCustomPreferenceValue('eswEshopworldModuleEnabled');
    },
    getEswCatalogFeedProductCustomAttrFieldMapping: function () {
        return Site.getCustomPreferenceValue('eswCatalogFeedProductCustomAttrFieldMapping');
    },
    getAllCountries: function () {
        let allCountriesCO = this.queryAllCustomObjects('ESW_COUNTRIES', '', 'custom.name asc'),
            countriesArr = [];
        if (allCountriesCO.count > 0) {
            while (allCountriesCO.hasNext()) {
                let countryDetail = allCountriesCO.next();
                let countryCode = countryDetail.getCustom().countryCode;
                let lcoale = countryDetail.getCustom().eswCountrylocale;
                if (!empty(countryCode)) {
                    countriesArr.push({
                        value: countryCode,
                        displayValue: countryDetail.getCustom().name,
                        defaultCurrencyCode: countryDetail.getCustom().defaultCurrencyCode,
                        isSupportedByESW: countryDetail.getCustom().isSupportedByESW || false,
                        isFixedPriceModel: countryDetail.getCustom().isFixedPriceModel || false,
                        locale: !empty(lcoale) ? lcoale : 'en_' + countryDetail.getCustom().countryCode
                    });
                }
            }
        }
        return countriesArr;
    },
    getAllowedCurrencies: function () {
        let allowedCurrencies = [],
            allowedCurrenciesCO = this.queryAllCustomObjects('ESW_CURRENCIES', 'custom.isSupportedByESW = true', 'custom.name asc');
        if (allowedCurrenciesCO.count > 0) {
            while (allowedCurrenciesCO.hasNext()) {
                let EswAllowedCurrency = allowedCurrenciesCO.next();
                allowedCurrencies.push({
                    value: EswAllowedCurrency.getCustom().currencyCode,
                    displayValue: EswAllowedCurrency.getCustom().name
                });
            }
        }
        return allowedCurrencies;
    },
    getAllowedLanguages: function () {
        return Site.getCustomPreferenceValue('eswAllowedLanguages');
    },
    getBasicAuthEnabled: function () {
        return Site.getCustomPreferenceValue('eswBasicAuthEnabled');
    },
    getReturnProhibitionEnabled: function () {
        return Site.getCustomPreferenceValue('eswEnableReturnProhibition');
    },
    getBasicAuthUser: function () {
        return Site.getCustomPreferenceValue('eswBasicAuthUser') || '';
    },
    getBasicAuthPassword: function () {
        return Site.getCustomPreferenceValue('eswBasicAuthPassword') || '';
    },
    getClientID: function () {
        return Site.getCustomPreferenceValue('eswClientID');
    },
    getClientSecret: function () {
        return Site.getCustomPreferenceValue('eswClientSecret');
    },
    getEnableHeaderBar: function () {
        return Site.getCustomPreferenceValue('eswEnableHeaderPagebar');
    },
    getEnableFooterBar: function () {
        return Site.getCustomPreferenceValue('eswEnableFooterBar');
    },
    getEnableLandingPage: function () {
        return Site.getCustomPreferenceValue('eswEnableLandingPage');
    },
    getEnableLandingPageBar: function () {
        return Site.getCustomPreferenceValue('eswEnableLandingpageBar');
    },
    getEnableCountryLandingBar: function () {
        return Site.getCustomPreferenceValue('eswEnableCountryLandingbar');
    },
    getEnableCurrencyLandingBar: function () {
        return Site.getCustomPreferenceValue('eswEnableCurrencyLandingbar');
    },
    getEnableLanguageLandingBar: function () {
        return Site.getCustomPreferenceValue('eswEnableLanguageLandingbar');
    },
    getEnableInventoryCheck: function () {
        return Site.getCustomPreferenceValue('eswEnableInventoryCheck');
    },
    getEShopWorldTaxInformationEnabled: function () {
        return Site.getCustomPreferenceValue('eswEnableTaxInformation');
    },
    getFixedPriceModelCountries: function () {
        let fixedCountriesCO = this.queryAllCustomObjects('ESW_COUNTRIES', 'custom.isFixedPriceModel = true', 'custom.name asc'),
            countriesArr = [];
        if (fixedCountriesCO.count > 0) {
            while (fixedCountriesCO.hasNext()) {
                let countryDetail = fixedCountriesCO.next();
                countriesArr.push({
                    value: countryDetail.getCustom().countryCode,
                    displayValue: countryDetail.getCustom().name
                });
            }
        }
        return countriesArr;
    },
    getMetadataItems: function () {
        return Site.getCustomPreferenceValue('eswMetadataItems');
    },
    getProductLineMetadataItemsPreference: function () {
        return Site.getCustomPreferenceValue('eswProductLineMetadataItems');
    },
    getCustomerMetadataPreference: function () {
        return Site.getCustomPreferenceValue('eswCustomerMetaData');
    },
    getBasketMetadataPreference: function () {
        return Site.getCustomPreferenceValue('eswBasketMetaData');
    },
    getOverridePriceBooks: function (countryCode) {
        let overridePriceBooksArr = [],
            listPriceBook = Site.getCustomPreferenceValue('eswFixedListPriceBookPattern'),
            salePriceBook = Site.getCustomPreferenceValue('eswFixedSalePriceBookPattern');
        if (!empty(countryCode) && typeof countryCode !== 'object' && !empty(listPriceBook)) {
            overridePriceBooksArr.push(listPriceBook.replace(/{countryCode}+/g, countryCode.toLowerCase()));
        }
        if (!empty(countryCode) && typeof countryCode !== 'object' && !empty(salePriceBook)) {
            overridePriceBooksArr.push(salePriceBook.replace(/{countryCode}+/g, countryCode.toLowerCase()));
        }
        return overridePriceBooksArr;
    },
    getPriceBookCurrency: function (priceBookId) {
        let PriceBookMgr = require('dw/catalog/PriceBookMgr'),
            priceBookObj = PriceBookMgr.getPriceBook(priceBookId);

        return (!empty(priceBookObj)) ? priceBookObj.getCurrencyCode() : null;
    },
    getOverrideShipping: function () {
        return !empty(Site.getCustomPreferenceValue('eswOverrideShipping')) ? Site.getCustomPreferenceValue('eswOverrideShipping') : [];
    },
    getDayOfLastAPICall: function () {
        return Site.getCustomPreferenceValue('eswDay');
    },
    getGeoLookup: function () {
        return Site.getCustomPreferenceValue('enableGeoLookup');
    },
    getGeoIpAlert: function () {
        return Site.getCustomPreferenceValue('eswEnableGeoIpAlert');
    },
    getUrlExpansionPairs: function () {
        return Site.getCustomPreferenceValue('eswUrlExpansionPairs');
    },
    getPwaUrlExpansionPairs: function () {
        return Site.getCustomPreferenceValue('eswPwaUrlExpansionPairs');
    },
    getAdditionalExpansionPairs: function () {
        return Site.getCustomPreferenceValue('additionalExpansionPairs');
    },
    getRedirect: function () {
        return Site.getCustomPreferenceValue('eswRedirect');
    },
    getPricingAdvisorData: function () {
        let paDataObj = {
            fxRates: '',
            countryAdjustment: '',
            roundingModels: '',
            eswPricingSynchronizationId: ''
        };
        let paCustomObj = this.getCustomObjectDetails('ESW_PA_DATA', 'ESW_PA_DATA');
        if (paCustomObj) {
            paDataObj.fxRates = JSON.parse(paCustomObj.getCustom().fxRatesJson);
            paDataObj.countryAdjustment = JSON.parse(paCustomObj.getCustom().countryAdjustmentJson);
            paDataObj.roundingModels = JSON.parse(paCustomObj.getCustom().eswRoundingJson);
            paDataObj.eswPricingSynchronizationId = paCustomObj.getCustom().eswPricingSynchronizationId;
        }
        return paDataObj;
    },
    getSelectedInstance: function () {
        return Site.getCustomPreferenceValue('eswInstance').value.toString();
    },
    getSelectedPriceFeedInstance: function () {
        return Site.getCustomPreferenceValue('eswPriceFeedInstance').value.toString();
    },
    getProductionClientSecret: function () {
        return Site.getCustomPreferenceValue('eswProductionClientSecret');
    },
    getCheckoutServiceName: function () {
        return Site.getCustomPreferenceValue('eswCheckoutServiceName');
    },
    isUpdateOrderPaymentStatusToPaidAllowed: function () {
        return Site.getCustomPreferenceValue('eswUpdateOrderPaymentStatusToPaid');
    },
    getEswSessionTimeout: function () {
        return Site.getCustomPreferenceValue('eswSessionTimeout');
    },
    isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled: function () {
        return Site.getCustomPreferenceValue('eswUseDeliveryContactDetailsForPaymentContactDetails');
    },
    isMultipleFxRatesEnabled: function () {
        return Site.getCustomPreferenceValue('eswEnableMultipleFxRates');
    },
    isEswRoundingsEnabled: function () {
        return Site.getCustomPreferenceValue('eswEnableRoundings');
    },
    isCheckoutRegisterationEnabled: function () {
        return Site.getCustomPreferenceValue('eswEnablePostOcRegistration');
    },
    getLocalizedPricingCountries: function () {
        return Site.getCustomPreferenceValue('eswLocalizedPricingCountries');
    },
    getLocalizedPromotionsConfig: function () {
        return Site.getCustomPreferenceValue('eswLocalizedPromotions');
    },
    isFrontendConversionEnabled: function () {
        return Site.getCustomPreferenceValue('eswEnableFrontendPricesConversion');
    },
    getRussianStorageDataUrl: function () {
        return !empty(Site.getCustomPreferenceValue('eswRussianDataStorageUrl')) ? Site.getCustomPreferenceValue('eswRussianDataStorageUrl') : '';
    },
    geteswImageType: function () {
        return !empty(Site.getCustomPreferenceValue('eswImageType')) ? Site.getCustomPreferenceValue('eswImageType') : 'small';
    },
    getTopLevelDomain: function () {
        return Site.getCustomPreferenceValue('eswTopLevelDomain');
    },
    getReturnOrderType: function () {
        return Site.getCustomPreferenceValue('eswReturnOrderType').value;
    },
    getBaseCurrency: function () {
        return Site.getCustomPreferenceValue('eswBaseCurrency').value;
    },
    isOrderDetailEnabled: function () {
        return Site.getCustomPreferenceValue('eswEnableOrderDetail');
    },
    getSelectedCountryDetail: function (countryCode) {
        let baseCurrency = this.getBaseCurrencyPreference(countryCode),
            selectedCountry = {
                countryCode: countryCode,
                name: '',
                defaultCurrencyCode: baseCurrency,
                baseCurrencyCode: baseCurrency,
                isSupportedByESW: false,
                isFixedPriceModel: false
            },
            selectedCountryCO = this.getCustomObjectDetails('ESW_COUNTRIES', countryCode);
        if (selectedCountryCO) {
            selectedCountry.name = selectedCountryCO.getCustom().name;
            selectedCountry.defaultCurrencyCode = selectedCountryCO.getCustom().defaultCurrencyCode;
            selectedCountry.baseCurrencyCode = selectedCountryCO.getCustom().baseCurrencyCode;
            selectedCountry.isSupportedByESW = selectedCountryCO.getCustom().isSupportedByESW;
            selectedCountry.isFixedPriceModel = selectedCountryCO.getCustom().isFixedPriceModel;
        }
        return selectedCountry;
    },
    getDefaultCurrencyForCountry: function (countryCode) {
        let foundCountryCO = this.getCustomObjectDetails('ESW_COUNTRIES', countryCode);
        if (foundCountryCO) {
            let defaultCurrency = foundCountryCO.getCustom().defaultCurrencyCode;
            if (empty(defaultCurrency)) {
                return this.getBaseCurrencyPreference();
            }
            return defaultCurrency;
        }
        return this.getBaseCurrencyPreference();
    },
    getAllowedCountries: function () {
        let allowedCountries = [],
            allowedCountriesCO = this.queryAllCustomObjects('ESW_COUNTRIES', 'custom.isSupportedByESW = true', 'custom.name asc');
        if (allowedCountriesCO.count > 0) {
            while (allowedCountriesCO.hasNext()) {
                let EswAllowedCountry = allowedCountriesCO.next();
                allowedCountries.push(EswAllowedCountry.getCustom().countryCode);
            }
        }
        return allowedCountries;
    },
    getBaseCurrencyPreference: function (selectedCountryCode) {
        let defaultBaseCurrency = Site.getCustomPreferenceValue('eswBaseCurrency').value;
        if (this.isMultipleFxRatesEnabled()) {
            let countryCode = empty(selectedCountryCode) ? this.getAvailableCountry() : selectedCountryCode;
            let defaultCountryCurrencyMapping = this.getCustomObjectDetails('ESW_COUNTRIES', countryCode);
            if (defaultCountryCurrencyMapping) {
                let matchedCountryWithBaseCurrency = defaultCountryCurrencyMapping.custom.baseCurrencyCode;
                if (empty(matchedCountryWithBaseCurrency)) {
                    return defaultBaseCurrency;
                }
                return matchedCountryWithBaseCurrency;
            }
        }
        return defaultBaseCurrency;
    },
    /**
     * Check if product is return prohibited in current selected Country
     * @param {Object} product - Product object
     * @param {Object} shopperCountry - shopperCountry
     * @return {boolean} - true/ false
     */
    isReturnProhibited: function (product, shopperCountry) {
        if (this.getReturnProhibitionEnabled()) {
            let currCountry = shopperCountry || this.getAvailableCountry();
            let returnProhibitedCountries = (product && product.custom && 'eswProductReturnProhibitedCountries' in product.custom) ? product.custom.eswProductReturnProhibitedCountries : null;
            if (!empty(returnProhibitedCountries)) {
                // eslint-disable-next-line no-restricted-syntax
                for (let country in returnProhibitedCountries) {
                    // eslint-disable-next-line eqeqeq
                    if (returnProhibitedCountries[country].toLowerCase() == 'all' || returnProhibitedCountries[country].toLowerCase() == currCountry.toLowerCase()) {
                        return true;
                    }
                }
            }
        }
        return false;
    },
    /**
     * Function to set cookies when country, currency and language selectors are selected
     * @param {string} country - country
     * @param {string} currency - currency
     * @param {*} locale - locale of storefront
     * @param {string} paCategory - category for pricing advisor
     * @returns {Object} - fxRate, countryAdjustment and rounding rules
     */
    selectCountry: function (country, currency, locale, paCategory) {
        let Constants = require('*/cartridge/scripts/util/Constants');
        let eswPaV4Helper = require('*/cartridge/scripts/helper/eswHelperPav4');
        let selectedPaCategory = null;
        let paVersion = this.getPaVersion();
        let eswCurrency;
        if (request.httpCookies['esw.currency'] == null) {
            eswCurrency = this.createCookie('esw.currency', currency, '/');
        } else {
            eswCurrency = request.getHttpCookies()['esw.currency'];
            eswCurrency.maxAge = 0;
            eswCurrency = this.createCookie('esw.currency', currency, '/');
        }
        let eswLanguageIsoCode;
        if (request.httpCookies['esw.LanguageIsoCode'] == null) {
            eswLanguageIsoCode = this.createCookie('esw.LanguageIsoCode', locale, '/');
        } else {
            eswLanguageIsoCode = request.getHttpCookies()['esw.LanguageIsoCode'];
        }
        let baseCurrency = this.getBaseCurrencyPreference();
        let eswLocation;
        if (request.httpCookies['esw.location'] == null || request.httpCookies['esw.location'].value !== country) {
            if (request.httpCookies['esw.location'] == null) {
                eswLocation = this.createCookie('esw.location', country, '/');
            } else {
                eswLocation = request.getHttpCookies()['esw.location'];
                this.updateCookieValue(eswLocation, country);
            }
        }

        if (!this.getEnableCurrencyLandingBar() || empty(currency)) {
            // eslint-disable-next-line no-param-reassign
            currency = this.getDefaultCurrencyForCountry(country);
            this.updateCookieValue(eswCurrency, currency);
        }

        this.updateCookieValue(eswLanguageIsoCode, locale);
        delete session.privacy.fxRate;
        delete session.privacy.countryAdjustment;
        delete session.privacy.rounding;

        let paDataObj = this.getPricingAdvisorData(),
            fxRates = paDataObj.fxRates,
            countryAdjustment = paDataObj.countryAdjustment,
            roundingModels = paDataObj.roundingModels,
            selectedFxRate = [],
            selectedCountryAdjustment = [],
            selectedRoundingRule = [],
            paDataV4;

        if (!empty(fxRates)) {
            selectedFxRate = fxRates.filter(function (rates) {
                return rates.toShopperCurrencyIso === eswCurrency.value && rates.fromRetailerCurrencyIso === baseCurrency;
            });
        }

        switch (paVersion) {
            case Constants.PA_V4:
                selectedPaCategory = typeof paCategory === 'undefined' || empty(paCategory) ? Constants.DEFAULT_PA_CATEGORY : paCategory;
                paDataV4 = eswPaV4Helper.getPaDataByCategoryOrCountry(country, selectedPaCategory, eswCurrency);
                selectedCountryAdjustment = paDataV4.selectedCountryAdjustment;
                selectedRoundingRule = paDataV4.selectedRoundingRule;
                break;
            case Constants.PA_V3:
                if (!empty(countryAdjustment)) {
                    selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
                        return adjustment.deliveryCountryIso === country;
                    });
                }

                if (!empty(roundingModels)) {
                    let selectedRoundingModel = roundingModels.filter(function (rule) {
                        return rule.deliveryCountryIso === country;
                    });

                    if (!empty(selectedRoundingModel)) {
                        selectedRoundingRule = selectedRoundingModel[0].roundingModels.filter(function (rule) {
                            return rule.currencyIso === eswCurrency.value;
                        });
                    }
                }
                break;
            default:
                logger.error('Error while select country: Unknown PA version {0} ', paVersion);
                throw new Error('Unknown PA version ' + paVersion);
        }

        if (empty(selectedFxRate) && eswCurrency.value === baseCurrency) {
            let baseCurrencyFxRate = {
                fromRetailerCurrencyIso: baseCurrency,
                rate: '1',
                toShopperCurrencyIso: baseCurrency
            };
            selectedFxRate.push(baseCurrencyFxRate);
        }

        if (empty(selectedFxRate)) {
            let currencyFxRate = {
                fromRetailerCurrencyIso: currency,
                rate: '1',
                toShopperCurrencyIso: currency
            };
            selectedFxRate.push(currencyFxRate);
        }
        let fxRateFinal = selectedFxRate[0];
        let countryAdjustmentFinal = selectedCountryAdjustment[0];
        let roundingFinal = selectedRoundingRule[0];

        session.privacy.fxRate = JSON.stringify(fxRateFinal);
        session.privacy.countryAdjustment = !empty(countryAdjustmentFinal) ? JSON.stringify(countryAdjustmentFinal) : '';
        session.privacy.rounding = !empty(roundingFinal) ? JSON.stringify(roundingFinal) : '';
        this.setCustomerCookies();
        return {
            fxRates: fxRateFinal,
            countryAdjustments: countryAdjustmentFinal,
            roundingRules: roundingFinal
        };
    },
    /*
     * Function to set initial selected country from cookie or geolocation or preferences or URL
     */
    getAvailableCountry: function () {
        let eswCountryUrlParam = Site.getCustomPreferenceValue('eswCountryUrlParam');
        let urlParameter = (!empty(request) && !empty(request.httpParameterMap) && !empty(eswCountryUrlParam)) ? request.httpParameterMap.get(eswCountryUrlParam) : null;
        if (urlParameter && !empty(urlParameter.value) && this.checkIsEswAllowedCountry(urlParameter.value)) {
            return urlParameter.value;
            // eslint-disable-next-line eqeqeq
        } else if (request.httpCookies['esw.location'] != null && request.httpCookies['esw.location'].value != '') {
            return request.getHttpCookies()['esw.location'].value;
        } else if (this.getGeoLookup()) {
            let geolocation = request.geolocation.countryCode;
            let matchCountryCO = this.getCustomObjectDetails('ESW_COUNTRIES', geolocation),
                matchCountry = (matchCountryCO) ? matchCountryCO.getCustom().countryCode : '';

            if (empty(matchCountry)) {
                let allowedCountries = this.getAllowedCountries();
                return !empty(allowedCountries) ? allowedCountries[0] : this.getAllCountries()[0];
            }
            return geolocation;
            // eslint-disable-next-line no-else-return
        } else {
            // eslint-disable-next-line no-redeclare
            let allowedCountries = this.getAllowedCountries();
            return !empty(allowedCountries) ? allowedCountries[0] : this.getAllCountries()[0];
        }
    },
    /**
     * Check if current geo location is equals to the location cookie
     * @param {string} shopperCountry - Shopper country ISO code e.g. IE, CA
     * @returns {Object} - isSameCountry, geoLocation, alertMsg
     */
    isSameGeoIpCountry: function (shopperCountry) {
        const Resource = require('dw/web/Resource');
        let geoLocation = (shopperCountry && !empty(shopperCountry) && typeof shopperCountry !== 'undefined') ? shopperCountry : request.geolocation.countryCode;
        let isAllowedCountry = this.checkIsEswAllowedCountry(geoLocation);
        let alertMsg = {
            title: Resource.msg('alert.geoip.title', 'esw', null),
            body: Resource.msg('alert.geoip.message', 'esw', null)
        };
        if (!this.getGeoIpAlert() || !isAllowedCountry) {
            // When feature not in use then we do not need to show alert
            return { isSameCountry: true, geoLocation: geoLocation, alertMsg: alertMsg, r: 1 };
        }
        let countryCookie = !empty(request.httpCookies['esw.location']) ? request.httpCookies['esw.location'].value : null;
        let alertMsgContent = ContentMgr.getContent('eswGeoIpChangeWarning');
        if (!empty(alertMsgContent)) {
            alertMsg.title = alertMsgContent.getName();
            alertMsg.body = alertMsgContent.getCustom().body.markup;
        }
        if (empty(countryCookie) || empty(geoLocation)) {
            return { isSameCountry: true, geoLocation: isAllowedCountry ? geoLocation : geoLocation, alertMsg: alertMsg, r: 2 };
        }
        if (!empty(geoLocation) && !empty(countryCookie)) {
            return { isSameCountry: geoLocation === countryCookie, geoLocation: geoLocation, alertMsg: alertMsg, r: 3 };
        }
        return { isSameCountry: false, geoLocation: geoLocation, alertMsg: alertMsg, r: 4 };
    },
    /*
     * Function to perform fxrate calculations, apply adjustments, duty and tax and returns money object
     */
    // eslint-disable-next-line consistent-return
    getMoneyObject: function (price, noAdjustment, formatted, noRounding, selectedCountryInfoObjParam, promotionPriceObj) {
        let eswCalculationHelper = require('*/cartridge/scripts/helper/eswCalculationHelper').getEswCalculationHelper;
        if (typeof promotionPriceObj === 'undefined' || promotionPriceObj === null) {
            // eslint-disable-next-line no-param-reassign
            promotionPriceObj = false;
        }
        return eswCalculationHelper.getMoneyObject(price, noAdjustment, formatted, promotionPriceObj === false ? noRounding : true, selectedCountryInfoObjParam, promotionPriceObj);
    },
    /*
     * applies rounding method as per the rounding model.
     */
    applyRoundingMethod: function (price, model, roundingModel, isFractionalPart) {
        let roundingMethod = model.split(/(\d+)/)[0];
        let roundedPrice;
        if (roundingMethod.equalsIgnoreCase('none')) {
            if (isFractionalPart) {
                return (price / 100) % 1;
            }
            return price;
        }
        let roundingTarget = model.split(/(\d+)/)[1];
        let rTLength = roundingTarget.length;

        if (isFractionalPart) {
            // Truncate or make roundingTarget to only two digits for fractional part.
            roundingTarget = rTLength === 1 ? roundingTarget + '0' : roundingTarget.substring(0, 2);
            rTLength = roundingTarget.length;
        }

        if (roundingMethod.equalsIgnoreCase('fixed')) {
            let otherPart = price % Math.pow(10, rTLength);
            let priceWithoutOtherPart = price - otherPart;

            // Logic for fixed rounding method.
            if (roundingModel.direction.equalsIgnoreCase('up')) {
                roundedPrice = (roundingTarget < otherPart ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
            } else if (roundingModel.direction.equalsIgnoreCase('down')) {
                roundedPrice = (roundingTarget > otherPart ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
                roundedPrice = roundedPrice < 0 && !isFractionalPart ? price : roundedPrice;
            } else if (roundingModel.direction.equalsIgnoreCase('nearest')) {
                let roundedUp = (roundingTarget < otherPart ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
                let roundedDown = (roundingTarget > otherPart ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
                roundedDown = roundedDown < 0 && !isFractionalPart ? price : roundedDown;
                roundedPrice = Math.abs(roundedUp - price) >= Math.abs(price - roundedDown) ? roundedDown : roundedUp;
            }
        } else {
            // Logic for multiple rounding method.
            // eslint-disable-next-line no-lonely-if
            if (roundingModel.direction.equalsIgnoreCase('up')) {
                roundedPrice = Math.ceil(price / roundingTarget) * roundingTarget;
            } else if (roundingModel.direction.equalsIgnoreCase('down')) {
                roundedPrice = Math.floor(price / roundingTarget) * roundingTarget;
            } else if (roundingModel.direction.equalsIgnoreCase('nearest')) {
                // eslint-disable-next-line no-unused-expressions, no-sequences
                roundedUp = Math.ceil(price / roundingTarget) * roundingTarget,
                    roundedDown = Math.floor(price / roundingTarget) * roundingTarget,
                    roundedPrice = Math.abs(roundedUp - price) >= Math.abs(price - roundedDown) ? roundedDown : roundedUp;
            }
        }
        if (isFractionalPart) {
            return roundedPrice / Math.pow(10, rTLength);
        }
        return roundedPrice;
    },
    /*
     * return rounding price from modal
     */
    getRoundPrice: function (roundingModel) {
        try {
            return roundingModel && roundingModel.split(/(\d+)/)[0].equalsIgnoreCase('multiple') ? roundingModel.split(/(\d+)/)[1] : null;
        } catch (error) {
            return null;
        }
    },
    /*
     * applies rounding model received from price feed.
     */
    applyRoundingModel: function (price, roundingModel) {
        try {
            if (!roundingModel) {
                // eslint-disable-next-line no-param-reassign
                roundingModel = !empty(session.privacy.rounding) ? JSON.parse(session.privacy.rounding) : false;
            }
            if (!roundingModel || empty(roundingModel) || price === 0) {
                return price;
            }
            if (roundingModel && roundingModel.direction.equalsIgnoreCase('None')) {
                return price;
            }

            if (!empty(roundingModel)) {
                let roundedWholeNumber = 0,
                    // eslint-disable-next-line no-unused-vars
                    roundedfractionalPart = 0,
                    roundedPrice = 0,
                    roundingTarget;
                // eslint-disable-next-line no-param-reassign
                price = price.toFixed(2);

                let wholeNumber = parseInt(price, 10);
                let model = roundingModel.model.split('.')[0];

                let fractionalPart = Math.round((price % 1) * 100);
                let fractionalModel = roundingModel.model.split('.')[1];

                roundingTarget = this.getRoundPrice(fractionalModel);
                // Check if the roundingTarget is 0
                if (!empty(roundingTarget) && Number(roundingTarget) === 0) {
                    // If it is, the result is already 0, no rounding needed just setting the fractional part to 0.
                    roundedFractionalPart = 0;
                } else {
                    // For non-zero roundingTarget, use the original expression
                    // First, Apply rounding on the fractional part.
                    roundedFractionalPart = this.applyRoundingMethod(fractionalPart, fractionalModel, roundingModel, true);
                }

                // Update the whole number based on the fractional part rounding.
                wholeNumber = parseInt(wholeNumber + roundedFractionalPart, 10);
                roundedFractionalPart = (wholeNumber + roundedFractionalPart) % 1;
                roundingTarget = this.getRoundPrice(model);

                // Check if the roundingTarget is 0
                if (!empty(roundingTarget) && Number(roundingTarget) === 0) {
                    // If it is, the result is already 0, no rounding needed.
                    roundedWholeNumber = wholeNumber;
                } else {
                    // For non-zero roundingTarget, use the original expression
                    // then, Apply rounding on the whole number.
                    roundedWholeNumber = this.applyRoundingMethod(wholeNumber, model, roundingModel, false);
                }

                roundedPrice = roundedWholeNumber + roundedFractionalPart;

                return roundingModel.currencyExponent === 0 ? parseInt(roundedPrice, 10) : roundedPrice.toFixed(roundingModel.currencyExponent);
            }
        } catch (e) {
            logger.error('Error applying rounding {0} {1}', e.message, e.stack);
            return price;
        }
        return price;
    },
    /*
     * This function is used to get total of cart or productlineitems based on input
     */
    getSubtotalObject: function (cart, isCart, listPrice, unitPrice, localizeObj, conversionPrefs) {
        let eswCalculationHelper = require('*/cartridge/scripts/helper/eswCalculationHelper').getEswCalculationHelper;
        return eswCalculationHelper.getSubtotalObject(cart, isCart, listPrice, unitPrice, localizeObj, conversionPrefs);
    },

    /*
     * This function is used to get shipping discount if it exist
     */
    getShippingDiscount: function (cart) {
        let totalDiscount = 0;
        let that = this;
        let freeDiscountFlag = false;
        if (cart != null) {
            cart.defaultShipment.shippingPriceAdjustments.toArray().forEach(function (adjustment) {
                totalDiscount += (!that.isShippingCostConversionEnabled()) ? adjustment.price : that.getMoneyObject(adjustment.price, true, false, true).value;
                if (adjustment.appliedDiscount.type === 'FREE') {
                    freeDiscountFlag = true;
                }
            });
        }
        if (freeDiscountFlag) {
            totalDiscount = this.getMoneyObject(cart.defaultShipment.shippingTotalNetPrice, true, false, false).value;
        }
        if (totalDiscount < 0) {
            totalDiscount *= -1;
        }
        return new dw.value.Money(totalDiscount, request.httpCookies['esw.currency'].value);
    },
    /**
     * This function is used to get order discount if it exist
     * @param {dw.order.Basket} cart - DW Basket object
     * @param {dw.order.Basket} localizeCountryObj - localizeCountryObj
     * @returns {dw.value.Money} - DW Money object
     */
    getOrderDiscount: function (cart, localizeCountryObj) {
        try {
            if (!empty(localizeCountryObj) && 'localizeCountryObj' in localizeCountryObj) {
                localizeCountryObj = localizeCountryObj.localizeCountryObj;
            }
            let Money = require('dw/value/Money');
            let that = this;
            let orderLevelProratedDiscount = that.getOrderProratedDiscount(cart, true);
            return new Money(orderLevelProratedDiscount, !empty(localizeCountryObj) && !empty(localizeCountryObj.currencyCode) ? localizeCountryObj.currencyCode : request.httpCookies['esw.currency'].value);
        } catch (e) {
            logger.error('Error while calculating order discount: {0} {1}', e.message, e.stack);
            return null;
        }
    },
    /**
    * This function is used to get order discount if it exist
    * @param {Object} order - Order API object
    * @param {Object} localizeObj - local country currency preference
    * @param {Object} conversionPrefs - the conversion preferences which contains selected fxRate, countryAdjustments and roundingRule
    * @returns {Object} order discount
    */
    getOrderDiscountHL: function (order, localizeObj, conversionPrefs) {
        let eswHelper = this,
            discount;
        localizeObj.selectedFxRate = conversionPrefs.selectedFxRate[0];
        localizeObj.selectedCountryAdjustments = conversionPrefs.selectedCountryAdjustments[0];
        discount = eswHelper.getOrderDiscount(order, localizeObj);
        return !empty(discount) && discount !== null ? discount : 0;
    },
    /**
     * This function is used to get Order Prorated Discount
     * @param {dw.order.Basket} cart - DW Basket object
     * @param {string} applyRounding - boolean
     * @returns {number} - orderLevelProratedDiscount
     */
    getOrderProratedDiscount: function (cart, applyRounding) {
        let orderLevelProratedDiscount = 0;
        let discountValue;
        let allPriceAdjustmentIter = cart.priceAdjustments.iterator();
        while (allPriceAdjustmentIter.hasNext()) {
            let eachPriceAdjustment = allPriceAdjustmentIter.next();
            if (eachPriceAdjustment.priceValue) {
                if (!empty(applyRounding) && applyRounding) {
                    discountValue = this.getMoneyObject((eachPriceAdjustment.priceValue), false, false, true, null, true).value;
                } else {
                    discountValue = this.getMoneyObject((eachPriceAdjustment.priceValue), false, false, true).value;
                }
                if ((eachPriceAdjustment.promotion && eachPriceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER) || eachPriceAdjustment.custom.thresholdDiscountType === 'order') {
                    orderLevelProratedDiscount += discountValue;
                }
            }
        }
        if (orderLevelProratedDiscount < 0) {
            orderLevelProratedDiscount *= -1;
        }
        return orderLevelProratedDiscount;
    },
    /*
     * This function is used to get Order total excluding order level discount
     */
    getFinalOrderTotalsObject: function () {
        try {
            let BasketMgr = require('dw/order/BasketMgr');
            let Money = require('dw/value/Money');
            return new Money(this.getSubtotalObject(BasketMgr.currentBasket, true).value - (this.getOrderDiscount(BasketMgr.currentBasket).value), request.httpCookies['esw.currency'].value);
        } catch (e) {
            logger.error('Error while calculating order total: {0} {1}', e.message, e.stack);
            return null;
        }
    },
    /*
     * Function that can be used to create cookies
     */
    createCookie: function (name, value, path, maxAge, domain) {
        let newCookie = new Cookie(name, value);
        newCookie.setPath(path);
        if (domain) {
            newCookie.setDomain(domain);
        }
        if (maxAge) {
            let maxAgeSeconds = (maxAge === 'expired') ? 0 : maxAge;
            newCookie.setMaxAge(maxAgeSeconds);
        }
        response.addHttpCookie(newCookie);
        return newCookie;
    },
    /*
     * Function to update value of cookies
     */
    updateCookieValue: function (changeCookie, value) {
        changeCookie.setValue(value);
        changeCookie.setPath('/');
        response.addHttpCookie(changeCookie);
    },
    /*
     * Function to check whether selected country is ESW Allowed Country
     */
    checkIsEswAllowedCountry: function (selectedCountry) {
        let foundCountryCO = this.getCustomObjectDetails('ESW_COUNTRIES', selectedCountry),
            isAllowed = false;
        if (foundCountryCO) {
            isAllowed = foundCountryCO.getCustom().isSupportedByESW;
        }
        return isAllowed;
    },
    /*
     * Function that is used to set the pricebook and update session currency
     */
    setBaseCurrencyPriceBook: function (currencyCode) {
        let Currency = require('dw/util/Currency');
        try {
            let Cart = require('*/cartridge/scripts/models/CartModel'),
                currency = Currency.getCurrency(currencyCode);
            Transaction.wrap(function () {
                session.setCurrency(currency);
                let currentCart = Cart.get();
                if (currentCart) {
                    currentCart.updateCurrency();
                    currentCart.calculate();
                }
            });
        } catch (e) {
            let BasketMgr = require('dw/order/BasketMgr');
            let HookMgr = require('dw/system/HookMgr');
            let currentBasket = BasketMgr.getCurrentOrNewBasket();
            let currency = Currency.getCurrency(currencyCode);
            Transaction.wrap(function () {
                if (!empty(currency)) {
                    session.setCurrency(currency);
                }
                // if (!empty(currentBasket.productLineItems)) {
                currentBasket.updateCurrency();
                HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
                //  }
            });
        }
    },
    /*
     * Get Name of country according to locale in countries.json
     */
    shortenName: function (name) {
        if (name.length > 15) {
            return name.slice(0, 12) + '...';
        }
        return name;
    },
    /*
     * This function is used to get country name
     */
    getCountryName: function (countryCode) {
        let foundCountryCO = this.getCustomObjectDetails('ESW_COUNTRIES', countryCode),
            countryName = '';
        if (foundCountryCO) {
            countryName = foundCountryCO.getCustom().name;
        }
        return countryName;
    },
    /*
     * Function to calculate amount when country is override country
     */
    applyOverridePrice: function (billingAmount, selectedCountry) {
        try {
            let overrridePricebooks = this.getOverridePriceBooks(selectedCountry);

            if (empty(overrridePricebooks)) {
                return billingAmount;
            }
            let baseCurrency = this.getBaseCurrencyPreference(),
                priceBookCurrency = this.getPriceBookCurrency(overrridePricebooks[0]);

            if (priceBookCurrency && priceBookCurrency !== baseCurrency) {
                let fxRates = this.getPricingAdvisorData().fxRates;
                let selectedFxRate = [];

                if (!empty(fxRates)) {
                    selectedFxRate = fxRates.filter(function (rates) {
                        return rates.toShopperCurrencyIso === priceBookCurrency && rates.fromRetailerCurrencyIso === baseCurrency;
                    });
                }
                if (empty(fxRates) || empty(selectedFxRate)) {
                    let currencyFxRate = {
                        fromRetailerCurrencyIso: baseCurrency,
                        rate: '1',
                        toShopperCurrencyIso: session.getCurrency().currencyCode
                    };
                    selectedFxRate.push(currencyFxRate);
                }
                // eslint-disable-next-line no-param-reassign
                billingAmount /= selectedFxRate[0].rate;
            }
            return Number(billingAmount);
        } catch (e) {
            logger.error('Error while applying override price Error: {0} {1}', e.message, e.stack);
        }
        return Number(billingAmount);
    },
    /*
     * Function to apply adjustments to price
     */
    applyAdjustment: function (billingAmount, country) {
        let countryAdjustment = JSON.parse(this.getCountryAdjustments()),
            selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
                return adjustment.countryIso === country;
            });

        // eslint-disable-next-line no-param-reassign
        billingAmount += (selectedCountryAdjustment[0].retailerAdjustments.percentage * billingAmount);
        return Number(billingAmount);
    },
    /*
     * Function to set all applicable price books
     */
    setAllAvailablePriceBooks: function () {
        let PriceBookMgr = require('dw/catalog/PriceBookMgr'),
            allPriceBooks = PriceBookMgr.getSitePriceBooks();
        PriceBookMgr.setApplicablePriceBooks(allPriceBooks.toArray());
    },
    /*
     * Function to set cookies for customer data
     */
    setCustomerCookies: function () {
        let eswHelper = this;
        if (request.httpCookies['esw.sessionid'] == null) {
            eswHelper.createCookie('esw.sessionid', customer.ID, '/');
        } else {
            eswHelper.updateCookieValue(request.httpCookies['esw.sessionid'], customer.ID);
        }
        let isInternational = this.checkIsEswAllowedCountry(eswHelper.getAvailableCountry());
        if (request.httpCookies['esw.InternationalUser'] == null) {
            eswHelper.createCookie('esw.InternationalUser', isInternational, '/');
        } else {
            eswHelper.updateCookieValue(request.httpCookies['esw.InternationalUser'], isInternational);
        }
    },
    /*
     * Function to check shipping service type
     */
    getShippingServiceType: function (cart) {
        let ShippingMgr = require('dw/order/ShippingMgr');
        let countryFound,
            country = this.getAvailableCountry(),
            shippingOverrides = this.getOverrideShipping();
        if (shippingOverrides.length > 0) {
            countryFound = JSON.parse(shippingOverrides).filter(function (item) {
                let itemCountry;
                if (item.countryCode === country) {
                    itemCountry = item;
                }
                return itemCountry;
            });
        }
        if (!empty(countryFound) && countryFound[0] != null) {
            let shippingMethodIDsOfCountry = countryFound[0].shippingMethod.ID;
            if (shippingMethodIDsOfCountry.length > 0) {
                let applicableShippingMethodsOnCart = ShippingMgr.getShipmentShippingModel(cart.shipments[0]).applicableShippingMethods.toArray();
                let shippingservice = applicableShippingMethodsOnCart.filter(function (ship) {
                    let shippingMethod;
                    if (shippingMethodIDsOfCountry[0] === ship.ID) {
                        shippingMethod = ship;
                    }
                    return shippingMethod;
                });
                if (shippingservice[0] != null && shippingservice[0].displayName === 'POST') {
                    return 'POST';
                }
            }
        }
        return 'EXP2';
    },
    /*
     * Function to set url locale
     */
    getRedirectUrl: function (url, selectedLocale) {
        let locale = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : this.getAllowedLanguages()[0].value;
        if (selectedLocale && !empty(selectedLocale)) {
            locale = selectedLocale;
        }
        let pipeline = url.split('/');

        let node = pipeline[pipeline.length - 1].split('?');
        let redirect = URLUtils.url(new dw.web.URLAction(node[0], Site.getCurrent().ID, locale)).toString();
        return (node.length > 1) ? redirect + '?' + node[1] : redirect;
    },
    /*
     * Function to check whether a redirecturl is set
     */
    checkRedirect: function () {
        let locale = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : this.getAllowedLanguages()[0].value;

        if (request.getLocale() !== locale) {
            return this.getCurrent(locale);
        }
        return null;
    },
    /*
     * Function that returns the previous clickStream pipeline
     */
    getCurrent: function (locale) {
        let URLAction = require('dw/web/URLAction');
        let URLParameter = require('dw/web/URLParameter');

        let currentAction = session.clickStream.last.pipelineName;
        let siteId = Site.getID();
        if (!locale) {
            // eslint-disable-next-line no-param-reassign
            locale = 'default';
        }
        let urlAction = new URLAction(currentAction, siteId, locale);
        let args = [urlAction];
        let parameterMap = request.httpParameterMap;

        // eslint-disable-next-line no-restricted-syntax
        for (let p in parameterMap) {
            // eslint-disable-next-line no-prototype-builtins
            if (parameterMap.hasOwnProperty(p)) {
                if (p === 'lang') {
                    // eslint-disable-next-line no-continue
                    continue;
                }
                args.push(new URLParameter(p, parameterMap[p]));
            }
        }

        return request.httpProtocol + '://' +
            request.httpHost +
            URLUtils.url.apply(null, args);
    },
    /*
     * Function to log information
     */
    eswInfoLogger: function (type, params) {
        let log = dw.system.Logger.getLogger('EShopWorldInfo', 'EswInfoLog');
        log.info(type + ':' + params);
    },
    /*
     * Function to encode base authentication user and password
     */
    encodeBasicAuth: function () {
        let StringUtils = require('dw/util/StringUtils'),
            user = this.getBasicAuthUser(),
            password = this.getBasicAuthPassword(),
            concatenatedString = user.concat(':').concat(password);
        return StringUtils.encodeBase64(concatenatedString);
    },
    getUnitPriceCost: function (lineItem) {
        return new dw.value.Money((this.getSubtotalObject(lineItem, false).value / lineItem.quantity.value), request.httpCookies['esw.currency'].value);
    },
    /**
     * Check if it is esw supported country or not,
     * @return {boolean} - true/ false
     */
    isESWSupportedCountry: function () {
        if (this.checkIsEswAllowedCountry(this.getAvailableCountry())) {
            return true;
        }
        return false;
    },
    /**
     * Returns current esw currency code,
     * stored in esw currency cookie
     * @return {string} - Currency code
     */
    getCurrentEswCurrencyCode: function () {
        return request.httpCookies['esw.currency'].value;
    },
    /**
     * Merges properties from source object to target object
     * @param {Object} target object
     * @param {Object} source object
     * @returns {Object} target object
     */
    extendObject: function (target, source) {
        Object.keys(source).forEach(function (prop) {
            // eslint-disable-next-line no-param-reassign
            target[prop] = source[prop];
        });
        return target;
    },
    /**
     * Check if selected country's override shipping cost conversion enable or not
     * @return {boolean} - true/ false
     */
    isShippingCostConversionEnabled: function () {
        let shippingOverrides = this.getOverrideShipping(),
            countryCode = this.getAvailableCountry(),
            isOverrideCountry;

        if (shippingOverrides.length > 0) {
            isOverrideCountry = JSON.parse(shippingOverrides).filter(function (item) {
                return (item.countryCode === countryCode && 'disableConversion' in item && item.disableConversion === 'true');
            });
            if (!empty(isOverrideCountry)) {
                return false;
            }
        }
        return true;
    },
    /**
     * Check if shipping discount based on coupons or not
     * @param {Object} cart object
     * @param {string} currentMethodID - current shipping method id
     * @return {boolean} - true/ false
     */
    isDeliveryDiscountBasedOnCoupon: function (cart, currentMethodID) {
        let PromotionMgr = require('dw/campaign/PromotionMgr');
        let collections = require('*/cartridge/scripts/util/collections');
        let shippingPriceAdjustmentIter = cart.defaultShipment.shippingPriceAdjustments.iterator(),
            isBasedOnCoupon = false,
            couponPriceAdjustmentIter = !empty(cart.couponLineItems) ? cart.couponLineItems.iterator() : null;
        while (shippingPriceAdjustmentIter.hasNext()) {
            let shippingPriceAdjustment = shippingPriceAdjustmentIter.next();
            if (shippingPriceAdjustment.basedOnCoupon && cart.shipments[0].shippingMethodID === currentMethodID) {
                isBasedOnCoupon = true;
            }
        }
        if (!isBasedOnCoupon && !empty(couponPriceAdjustmentIter)) {
            PromotionMgr.applyDiscounts(cart);
            while (couponPriceAdjustmentIter.hasNext()) {
                let couponPriceAdjustment = couponPriceAdjustmentIter.next();
                if (!couponPriceAdjustment.priceAdjustments.empty && couponPriceAdjustment.priceAdjustments.length < 1) {
                    isBasedOnCoupon = true;
                }
            }
        }
        if (!isBasedOnCoupon) {
            collections.forEach(cart.getPriceAdjustments(), function (orderPriceAdjustment) {
                isBasedOnCoupon = orderPriceAdjustment.basedOnCampaign && (orderPriceAdjustment.promotion.enabled === false || orderPriceAdjustment.campaign.enabled === false);
            });
            if (!isBasedOnCoupon) {
                collections.forEach(cart.getAllProductLineItems(), function (productLineItem) {
                    collections.forEach(productLineItem.getPriceAdjustments(), function (priceAdjustment) {
                        isBasedOnCoupon = priceAdjustment.basedOnCampaign && (priceAdjustment.promotion.enabled === false || priceAdjustment.campaign.enabled === false);
                    });
                });
            }
        }
        return isBasedOnCoupon;
    },
    /** Checks if a basket has no promotions applied, and if so, removes any coupons.
    * @param {dw.order.Basket} basket The basket to check and potentially remove coupons from
    */
    removeCouponsIfNoPromotions: function (basket) {
        let shippingPriceAdjustmens = basket.getAllShippingPriceAdjustments();
        if (shippingPriceAdjustmens.empty) {
            let couponLineItems = basket.getCouponLineItems();
            for (let i = 0; i < couponLineItems.length; i++) {
                let couponLineItem = couponLineItems[i];
                if (couponLineItem.priceAdjustments.length < 1) {
                    basket.removeCouponLineItem(couponLineItem);
                }
            }
        }
    },
    /**
     * Get custom object details using ID & Key
     * @param {string} customObjId - custom object id
     * @param {string} customObjKey - custom object Key
     * @return {Object} - matching object
     */
    getCustomObjectDetails: function (customObjId, customObjKey) {
        let CustomObjectMgr = require('dw/object/CustomObjectMgr'),
            co = CustomObjectMgr.getCustomObject(customObjId, customObjKey);
        return co;
    },
    /**
     * Query all custom objects using ID & Params
     * @param {string} customObjId - custom object id
     * @param {string} queryParams - Query Parameters
     * @param {string} sortingRule - Sorting Rule
     * @return {Object} - matching objects
     */
    queryAllCustomObjects: function (customObjId, queryParams, sortingRule) {
        let CustomObjectMgr = require('dw/object/CustomObjectMgr');
        let customObjects = CustomObjectMgr.queryCustomObjects(customObjId, queryParams, sortingRule);
        return customObjects;
    },
    /**
     * Remove Threshold Promotion
     * @param {Object} currentBasket - Basket
     */
    removeThresholdPromo: function (currentBasket) {
        let collections = require('*/cartridge/scripts/util/collections');
        let shippingLineItemIter = currentBasket.getDefaultShipment().getShippingLineItems().iterator();
        let shippingLineItem = !empty(shippingLineItemIter) ? shippingLineItemIter.next() : null;
        if (shippingLineItem && shippingLineItem.shippingPriceAdjustments) {
            collections.forEach(shippingLineItem.shippingPriceAdjustments, function (lineItemAdjustment) {
                if (lineItemAdjustment.promotion && lineItemAdjustment.promotion.custom.eswLocalizedThresholdEnabled) {
                    shippingLineItem.removeShippingPriceAdjustment(lineItemAdjustment);
                }
            });
        }
        let basketPriceAdjustments = currentBasket.getPriceAdjustments();
        if (!empty(basketPriceAdjustments)) {
            let adjustmentsIterator = basketPriceAdjustments.iterator();
            let eachPriceAdjustment;
            while (adjustmentsIterator.hasNext()) {
                eachPriceAdjustment = adjustmentsIterator.next();
                if (eachPriceAdjustment.promotion && eachPriceAdjustment.promotion.custom.eswLocalizedThresholdEnabled) {
                    currentBasket.removePriceAdjustment(eachPriceAdjustment);
                }
            }
        }
    },
    /**
     * Check if promotion's threshold check is enabled
     * @param {Object} promotion - promotion
     * @return {boolean} - true/ false
     */
    isThresholdEnabled: function (promotion) {
        if (!empty(promotion) && promotion.custom.eswLocalizedThresholdEnabled) {
            return true;
        }
        return false;
    },
    /**
     * Get promotion's discount type
     * @param {Object} promotion - promotion
     * @return {string} - discount type
     */
    getDiscountType: function (promotion) {
        return promotion.custom.eswPromotionDiscountType;
    },
    /**
    * Get promotion's threshold amount
    * @param {string} orderTotal - orderTotal
    * @param {Object} promotion - promotion
    * @return {string} - discount type
    */
    getPromoThresholdAmount: function (orderTotal, promotion) {
        try {
            let thresholds = promotion.custom.eswMinThresholdAmount[0].split(','),
                discount = '0.1',
                maxTotalThreshold = 0;
            for (let i = 0; i < thresholds.length; i++) {
                let thresholdAmount = thresholds[i].split(':');
                if (orderTotal >= Number(thresholdAmount[0]) && Number(thresholdAmount[0]) > Number(maxTotalThreshold)) {
                    maxTotalThreshold = Number(thresholdAmount[0]);
                    discount = thresholdAmount[1];
                }
            }
            return discount;
        } catch (e) {
            logger.error('Get promotions threshold amount: {0} {1}', e.message, e.stack);
            return null;
        }
    },
    /** Adjusts price of discounts based on threshold promotions
     * @param {Object} currentBasket - Basket
     */
    adjustThresholdDiscounts: function (currentBasket) {
        if (empty(currentBasket.priceAdjustments) && empty(currentBasket.getShippingPriceAdjustments())) {
            return;
        }
        let countryCode = null;
        let allShippingPriceAdjustmentsIter = currentBasket.getAllShippingPriceAdjustments().iterator();
        let cartTotals = this.getSubtotalObject(currentBasket, true);
        let collections = require('*/cartridge/scripts/util/collections');
        let fxRate = 1;
        if (!empty(JSON.parse(session.privacy.fxRate))) {
            fxRate = JSON.parse(session.privacy.fxRate).rate;
        } else {
            // Fix for headless architect
            countryCode = request.httpParameters.get('country-code');
            if (!empty(countryCode)) {
                let cDetail = this.getSelectedCountryDetail(countryCode[0]);
                let countryFxDetail = this.getESWCurrencyFXRate(cDetail.defaultCurrencyCode, cDetail.countryCode);
                if (countryFxDetail.length > 0) {
                    fxRate = countryFxDetail[0].rate;
                }
            }
        }
        if (allShippingPriceAdjustmentsIter.hasNext()) {
            let shippingLineItemIter;
            if (!empty(currentBasket.defaultShipment)) {
                shippingLineItemIter = currentBasket.defaultShipment.getShippingLineItems().iterator();
            } else {
                shippingLineItemIter = currentBasket.object.defaultShipment.getShippingLineItems().iterator();
            }
            let shippingLineItem = !empty(shippingLineItemIter) ? shippingLineItemIter.next() : null;
            /* Check if threshold Promo Already exists */
            if (shippingLineItem) {
                collections.forEach(shippingLineItem.shippingPriceAdjustments, function (lineItemAdjustment) {
                    if (lineItemAdjustment.promotionID === 'thresholdPromo') {
                        shippingLineItem.removeShippingPriceAdjustment(lineItemAdjustment);
                    }
                });
            }
        }
        collections.forEach(currentBasket.priceAdjustments, function (eachPriceAdjustment) {
            if (eachPriceAdjustment.promotionID === 'orderthresholdPromo') {
                currentBasket.removePriceAdjustment(eachPriceAdjustment);
            }
        });
        let allLineItemIter = currentBasket.getAllLineItems().iterator();
        let discountType,
            Discount,
            percentangeDiscountValue,
            orderPriceAdjustment;
        while (allLineItemIter.hasNext()) {
            let priceAdjustment = allLineItemIter.next();
            if (!(priceAdjustment instanceof dw.order.PriceAdjustment)) {
                /* eslint-disable no-continue */
                continue;
            }
            if (priceAdjustment.promotion && priceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER && this.isThresholdEnabled(priceAdjustment.promotion)) {
                discountType = this.getDiscountType(priceAdjustment.promotion);
                Discount = this.getPromoThresholdAmount(cartTotals.value, priceAdjustment.promotion);
                if (Discount === '0.1') {
                    /* eslint-disable no-continue */
                    continue;
                }
                /* eslint-disable eqeqeq */
                if (discountType == 'amount_off') {
                    orderPriceAdjustment = currentBasket.createPriceAdjustment('orderthresholdPromo', new dw.campaign.AmountDiscount(Discount / fxRate));
                    orderPriceAdjustment.custom.thresholdDiscountType = 'order';
                } else if (discountType == 'percentage_off') {
                    percentangeDiscountValue = (cartTotals / 100) * Discount;
                    orderPriceAdjustment = currentBasket.createPriceAdjustment('orderthresholdPromo', new dw.campaign.AmountDiscount(percentangeDiscountValue / fxRate));
                    orderPriceAdjustment.custom.thresholdDiscountType = 'order';
                }
            } else if (priceAdjustment.promotion && priceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_SHIPPING) {
                if (this.isThresholdEnabled(priceAdjustment.promotion)) {
                    discountType = this.getDiscountType(priceAdjustment.promotion);
                    Discount = this.getPromoThresholdAmount(cartTotals.value, priceAdjustment.promotion);
                    if (Discount === '0.1') {
                        /* eslint-disable no-continue */
                        continue;
                    }
                    let shippingPrice = !empty(currentBasket.defaultShipment) ? currentBasket.defaultShipment.adjustedShippingTotalPrice : currentBasket.object.defaultShipment.adjustedShippingTotalPrice;
                    /* eslint-disable eqeqeq */
                    /* eslint-disable new-cap */
                    if (discountType == 'free' || Discount == '0') {
                        let newPriceAdjustment = shippingLineItem.createShippingPriceAdjustment('thresholdPromo', dw.campaign.AmountDiscount(shippingPrice.value));
                        newPriceAdjustment.custom.thresholdDiscountType = 'free';
                    } else if (discountType == 'amount_off') {
                        shippingLineItem.createShippingPriceAdjustment('thresholdPromo', dw.campaign.AmountDiscount(Discount / fxRate));
                    } else if (discountType == 'percentage_off') {
                        let shippingRate = shippingPrice * fxRate;
                        percentangeDiscountValue = (shippingRate / 100) * Discount;
                        shippingLineItem.createShippingPriceAdjustment('thresholdPromo', dw.campaign.AmountDiscount(percentangeDiscountValue / fxRate));
                    }
                }
            }
            currentBasket.updateTotals();
        }
    },
    /**
    * Function used to set cookies for country, currency and local from URL.
    * @param {string} country - country code
    */
    setLocation: function (country) {
        let selectedCountry = country,
            currencyCode;
        if (selectedCountry == false && !empty(request.httpCookies['esw.location'])) {
            selectedCountry = request.httpCookies['esw.location'].value;
        }
        if (selectedCountry && this.checkIsEswAllowedCountry(selectedCountry)) {
            if (request.httpCookies['esw.currency'] == null) {
                currencyCode = this.getDefaultCurrencyForCountry(selectedCountry);
            } else {
                currencyCode = request.getHttpCookies()['esw.currency'].value;
            }
            let locale = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : this.getAllowedLanguages()[0].value;
            this.selectCountry(selectedCountry, currencyCode, locale);
        }
    },
    /**
    * Function used to set session variables for customer groups
    * @param {string} selectedCountry - country selected
    * @param {string} currency - default currency for selected country
    */
    setCustomSessionVariables: function (selectedCountry, currency) {
        let selectedCountryDetail = this.getSelectedCountryDetail(selectedCountry);
        session.custom.eswCountry = selectedCountry;
        session.custom.eswSupportsFixedPrices = selectedCountryDetail.isFixedPriceModel;
        session.custom.eswEnabled = this.getEShopWorldModuleEnabled();
        session.custom.eswOperatedCountry = selectedCountryDetail.isSupportedByESW;
        session.custom.eswCurrency = currency;
        return;
    },
    /**
     * Returns selected esw cuntry price,
     * @param {string} price - base price
     * @param {string} currency - country code
     * @return {Object} - price object
     */
    getSelectedCountryProductPrice: function (price, currency) {
        if (price) {
            return {
                value: price,
                currency: currency,
                decimalPrice: getEswHelper.getMoneyObject(price, false)
            };
        }
        return null;
    },
    /**
    * Function used to get request is ajax.
    * @return {boolean} - boolean
    */
    isAjaxCall: function () {
        return Object.hasOwnProperty.call(request.httpHeaders, 'x-requested-with');
    },

    /**
     * Function to rebuild basket from back to ESW checkout
     * @param {string|null} orderId - order id
     * @returns {boolean} - true/false
     */
    rebuildCartUponBackFromESW: function (orderId) {
        // eslint-disable-next-line no-param-reassign
        orderId = typeof orderId !== 'undefined' ? orderId : null;
        let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
        let BasketMgr = require('dw/order/BasketMgr');
        let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        try {
            let currentBasket = BasketMgr.getCurrentBasket();
            let eswHelper = this;
            if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) {
                if (!currentBasket) {
                    eswHelper.rebuildCart(orderId);
                    currentBasket = BasketMgr.getCurrentBasket();
                }
                if (currentBasket) {
                    Transaction.wrap(function () {
                        if (eswHelper.getShippingServiceType(currentBasket) === 'POST') {
                            eswServiceHelper.applyShippingMethod(currentBasket, 'POST', eswHelper.getAvailableCountry(), true);
                        } else {
                            eswServiceHelper.applyShippingMethod(currentBasket, 'EXP2', eswHelper.getAvailableCountry(), true);
                        }
                        eswHelper.adjustThresholdDiscounts(currentBasket);
                        basketCalculationHelpers.calculateTotals(currentBasket);
                    });
                }
            }
            return true;
        } catch (e) {
            return false;
        }
    },
    /**
     * Map basket meta data from basket metadata preference
     * @param {dw.order.Basket} basket - dw basket object
     * @returns  {Object} - Object of basket meta data
     */
    getMappedBasketMetadata: function (basket) {
        let Constants = require('*/cartridge/scripts/util/Constants');
        let metadataItems = this.getBasketMetadataPreference(),
            arr = new ArrayList([]),
            registration = {},
            i = 0;

        let eswCheckoutRegisterationEnabled = this.isCheckoutRegisterationEnabled();
        if (eswCheckoutRegisterationEnabled && !customer.authenticated) {
            registration[Constants.IS_REGISTERATION_NEEDED_NAME] = Constants.IS_REGISTERATION_NEEDED_VALUE;
            registration[Constants.REGISTERATION_URL_NAME] = URLUtils.https(Constants.REGISTERATION_URL_VALUE).toString();
        } else {
            registration[Constants.IS_REGISTERATION_NEEDED_NAME] = false;
        }
        // eslint-disable-next-line guard-for-in, no-restricted-syntax
        for (let item in metadataItems) {
            let metadataItem = metadataItems[item];
            i = metadataItem.indexOf('|');
            // Basket level custom attribute ID
            let basketCustomAttrID = metadataItem.substring(i + 1);
            let basketAttrVal = (typeof basket.custom[basketCustomAttrID] === 'undefined') ? null : basket.custom[basketCustomAttrID];
            if (basketAttrVal !== null) {
                arr.add({
                    name: metadataItem.substring(0, i),
                    value: basketAttrVal
                });
            }
        }
        return { metaDataArray: arr.size() > 0 ? arr.toArray() : null, registration: registration };
    },
    /**
     * Map customer meta data from customer metadata preference
     * @returns {Object} - Object of customer meta data
     */
    getMappedCustomerMetadata: function () {
        let metadataItems = this.getCustomerMetadataPreference(),
            arr = new ArrayList([]),
            i = 0;
        if (customer && !empty(metadataItems) && customer.authenticated) {
            let customerProfile = customer.profile;
            // eslint-disable-next-line guard-for-in, no-restricted-syntax
            for (let item in metadataItems) {
                let metadataItem = metadataItems[item];
                i = metadataItem.indexOf('|');
                // Customer profile level custom attribute ID
                let customerCustomAttrID = metadataItem.substring(i + 1);
                let customerAttrVal = (typeof customerProfile.custom[customerCustomAttrID] === 'undefined') ? null : customerProfile.custom[customerCustomAttrID];
                if (customerAttrVal !== null) {
                    arr.add({
                        name: metadataItem.substring(0, i),
                        value: customerAttrVal
                    });
                }
            }
        }
        return arr.size() > 0 ? arr.toArray() : null;
    },
    /**
     * Convert string to json if string is valid json return the string as it is otherwise
     * @param {string} string - string to convert into json
     * @returns {Object|string} - If valid json string then json else string as it is
     */
    strToJson: function (string) {
        let result;
        try {
            result = JSON.parse(string);
        } catch (e) {
            result = string;
        }
        return result;
    },
    /**
     * check if valid json
     * @param {*} input - input string/json to check
     * @returns {boolean} - true or false
     */
    isValidJson: function (input) {
        if (typeof input === 'object' && input !== null && !(input instanceof Array)) {
            return true;
        }
        try {
            JSON.parse(input);
        } catch (e) {
            return false;
        }
        return true;
    },
    /**
     * This function is used to random password to create customer account and sent that password in reset email.
     * @return {string} - password
     */
    generateRandomPassword: function () {
        let password = '';
        let Constants = require('*/cartridge/scripts/util/Constants');
        for (let i = 0; i <= Constants.RANDOM_LENGTH; i++) {
            let randomNumber = Math.floor(Math.random() * Constants.RANDOM_CHARS.length);
            password += Constants.RANDOM_CHARS.substring(randomNumber, randomNumber + 1);
        }
        return password;
    },
    // eslint-disable-next-line valid-jsdoc
    /**
     * This function is used to send an email to customer with auto generated password.
     * @param {dw.customer} registeredUser - registeredUser
     * @param {string} - password - password
     */
    sendRegisterCustomerEmail: function (registeredUser, password, siteGenesis, emailModal) {
        try {
            let Resource = require('dw/web/Resource');
            let emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
            let passwordResetToken;
            Transaction.wrap(function () {
                passwordResetToken = registeredUser.profile.credentials.createResetPasswordToken();
            });
            if (!empty(siteGenesis) && siteGenesis) {
                passwordemail = emailModal.get('mail/resetpasswordemail', registeredUser.profile.email);
                passwordemail.setSubject(Resource.msg('email.subject.new.registration.account', 'esw', null));
                passwordemail.send({
                    ResetPasswordToken: passwordResetToken,
                    Customer: registeredUser.profile.customer,
                    password: password
                });
            } else {
                let url = URLUtils.https('Account-SetNewPassword', 'Token', passwordResetToken);
                let objectForEmail = {
                    passwordResetToken: passwordResetToken,
                    firstName: registeredUser.profile.firstName,
                    lastName: registeredUser.profile.lastName,
                    url: url,
                    password: password
                };

                let emailObj = {
                    to: registeredUser.profile.email,
                    subject: Resource.msg('email.subject.new.registration.account', 'esw', null),
                    from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
                    type: emailHelpers.emailTypes.passwordChanged
                };

                emailHelpers.sendEmail(emailObj, 'account/password/passwordResetEmail', objectForEmail);
            }
        } catch (e) {
            logger.error('Error while sending customer email for newely created account Error: {0} {1}', e.message, e.stack);
        }
    },
    /**
         * This function is used to fetch synchID for the preorder.
         * @return {string} - syncID
         */
    getPricingSynchronizationId: function () {
        let PAData = this.getPricingAdvisorData(),
            country = request.httpCookies['esw.location'],
            countryAdjustments = PAData.countryAdjustment,
            countryData = [];
        if (!empty(country) && !empty(countryAdjustments)) {
            countryData = countryAdjustments.filter(function (countryAdjustment) {
                return countryAdjustment.deliveryCountryIso === country.value;
            });
            let countryCO = this.getCustomObjectDetails('ESW_COUNTRIES', country.value);
            if (countryData[0].syncID && !countryCO.custom.isFixedPriceModel) {
                return countryData[0].syncID;
            }
        }
        return null;
    },
    /**
     * Get Fx Rate of shopper currency
     * @param {string} shopperCurrencyIso - getting from site preference
     * @param {string} localizeCountry - shopper local country getting from site preference
     * @returns {array} returns selected fx rate
     */
    getESWCurrencyFXRate: function (shopperCurrencyIso, localizeCountry) {
        let fxRates = this.getPricingAdvisorData().fxRates;
        let baseCurrency = this.getBaseCurrencyPreference(localizeCountry);
        let selectedFxRate = [];
        if (!empty(fxRates)) {
            selectedFxRate = fxRates.filter(function (rates) {
                return rates.toShopperCurrencyIso === shopperCurrencyIso && rates.fromRetailerCurrencyIso === baseCurrency;
            });
        }
        return selectedFxRate;
    },
    /**
     * Get ESW Country Adjustments for localize country
     * @param {string} deliveryCountryIso - localize country code
     * @returns {array} returns selected country adjustment
     */
    getESWCountryAdjustments: function (deliveryCountryIso) {
        let countryAdjustment = this.getPricingAdvisorData().countryAdjustment;
        let selectedCountryAdjustment = [];
        if (!empty(countryAdjustment)) {
            selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
                return adjustment.deliveryCountryIso === deliveryCountryIso;
            });
        }
        return selectedCountryAdjustment;
    },
    /**
     * This function is used to apply overide shipping id on scapi basket
     * @param {Object} cart object
     * @param {string} countryCode scapi country param
     * @param {string} currentMethodID - current shipping method id
     */
    applyOverrideShipping: function (cart, countryCode, currentMethodID) {
        try {
            let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
            let shippingOverrides = this.getOverrideShipping(),
                customizationHelper = require('*/cartridge/scripts/helper/customizationHelper'),
                ShippingMgr = require('dw/order/ShippingMgr'),
                isOverrideCountry;
            if (shippingOverrides.length > 0) {
                isOverrideCountry = JSON.parse(shippingOverrides).filter(function (item) {
                    return item.countryCode == countryCode;
                });
            }
            if (!empty(isOverrideCountry) && isOverrideCountry[0] != null) {
                if (eswHelperHL.getShippingServiceType(cart, countryCode, isOverrideCountry) === 'POST') {
                    eswHelperHL.applyShippingMethod(cart, 'POST', countryCode, true, currentMethodID);
                } else {
                    eswHelperHL.applyShippingMethod(cart, 'EXP2', countryCode, true, currentMethodID);
                }
            } else {
                let defaultShippingMethodID = customizationHelper.getDefaultShippingMethodID(ShippingMgr.getDefaultShippingMethod().getID(), cart);
                eswHelperHL.applyShippingMethod(cart, defaultShippingMethodID, countryCode, false, currentMethodID);
            }
        } catch (error) {
            logger.error('Error while updating basket shipping {0} {1}', error.message, error.stack);
        }
    },
    /**
     * This function is used to apply overide shipping id on scapi basket
     * @param {Object} reqBody object
     * @param {string} requestType request type
     * @returns {Object} returns processes response Object
     */
    handleWebHooks: function (reqBody, requestType) {
        let obj = reqBody,
            responseJSON = {},
            eswOrderProcessHelper = require('*/cartridge/scripts/helper/eswOrderProcessHelper');
        if (empty(requestType) || (this.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + this.encodeBasicAuth()))) {
            response.setStatus(401);
            logger.error('ESW Process Webhooks Check Error: Basic Authentication Token did not match OR requestType not Available in request Headers');
        } else {
            this.eswInfoLogger('ProcessWebhook Log', JSON.stringify(reqBody));
            try {
                if (obj && 'Request' in obj && !empty(obj.Request) && (requestType === 'eshopworld.platform.events.oms.lineitemappeasementsucceededevent' || requestType === 'eshopworld.platform.events.oms.orderappeasementsucceededevent')) {
                    responseJSON = eswOrderProcessHelper.markOrderAppeasement(obj);
                } else if (obj && !empty(obj) && requestType === 'eshopworld.platform.events.logistics.returnorderevent') {
                    responseJSON = eswOrderProcessHelper.markOrderAsReturn(obj);
                } else if (obj && !empty(obj) && requestType === 'logistics-return-order-retailer') {
                    responseJSON = eswOrderProcessHelper.markOrderAsReturnV3(obj);
                } else if (obj && 'Request' in obj && !empty(obj.Request) && (requestType === 'eshopworld.platform.events.oms.lineitemcancelsucceededevent' || requestType === 'eshopworld.platform.events.oms.ordercancelsucceededevent')) {
                    responseJSON = eswOrderProcessHelper.cancelAnOrder(obj);
                } else if (obj && !empty(obj) && requestType === 'eshopworld.platform.events.oms.orderholdstatusupdatedevent') {
                    responseJSON = eswOrderProcessHelper.processKonbiniPayment(obj);
                }
            } catch (error) {
                logger.error('Error while processing order web Hook {0} {1}', error.message, error.stack);
            }
        }
        return responseJSON;
    },
    /**
     * Override pricebook currency
     * @param {*} req - request object
     * @param {*} selectedCountry - selected country
     * @param {*} selectedCurrency - selected currency
     * @returns {boolean} - true/false
     */
    overridePriceCore: function (req, selectedCountry, selectedCurrency) {
        if (this.getSelectedCountryDetail(selectedCountry).isFixedPriceModel) {
            let PriceBookMgr = require('dw/catalog/PriceBookMgr'),
                overridePriceBooks = this.getOverridePriceBooks(selectedCountry),
                priceBookCurrency = selectedCurrency,
                arrPricebooks = [];
            if (overridePriceBooks.length > 0) {
                // eslint-disable-next-line array-callback-return
                overridePriceBooks.map(function (pricebookId) {
                    let pBook = PriceBookMgr.getPriceBook(pricebookId);
                    if (!empty(pBook)) {
                        arrPricebooks.push(pBook);
                    }
                });
                try {
                    PriceBookMgr.setApplicablePriceBooks(arrPricebooks);
                    priceBookCurrency = this.getPriceBookCurrency(overridePriceBooks[0]);
                    if (priceBookCurrency !== null) {
                        this.setBaseCurrencyPriceBook(req, priceBookCurrency);
                    }
                    if (request.httpCookies['esw.currency'] === null || typeof request.httpCookies['esw.currency'] === 'undefined' || typeof request.httpCookies['esw.currency'] === 'undefined') {
                        this.selectCountry(selectedCountry, priceBookCurrency, req.locale.id);
                    } else {
                        this.selectCountry(selectedCountry, request.httpCookies['esw.currency'].value, req.locale.id);
                    }
                } catch (e) {
                    logger.error(e.message + e.stack);
                }
            }
            return true;
        }
        return false;
    },
    validatePreOrder: function (reqObj, setSessionVariable) {
        let checkoutServiceName = this.getCheckoutServiceName();
        if (checkoutServiceName.indexOf('EswCheckoutV3Service') !== -1) {
            if (empty(reqObj.retailerCartId)) {
                if (setSessionVariable) {
                    session.privacy.eswRetailerCartIdNullException = true;
                }
                throw new Error('SFCC_ORDER_CREATION_FAILED');
            } else if (empty(reqObj.lineItems) || empty(reqObj.deliveryCountryIso)) {
                if (setSessionVariable) {
                    session.privacy.eswPreOrderException = true;
                }
                throw new Error('ATTRIBUTES_MISSING_IN_PRE_ORDER');
            }
        }
    },
    /**
     * Get validate inventory json response
     * @param {Object} obj - Webhook payload
     * @returns {Object} - response json
     */
    getValidateInventoryResponseJson: function (obj) {
        let inventoryAvailable = true;
        if (this.getEnableInventoryCheck()) {
            if (this.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + this.encodeBasicAuth())) {
                response.setStatus(401);
                logger.error('ESW Inventory Check Error: Basic Authentication Token did not match');
            } else {
                let OrderMgr = require('dw/order/OrderMgr'),
                    ocHelper = require('*/cartridge/scripts/helper/orderConfirmationHelper').getEswOcHelper(),
                    order = OrderMgr.getOrder(obj.retailerCartId);
                /* ***********************************************************************************************************************************************/
                /* The following line of code checks order line items inventory availaibility from business manager.                                             */
                /* If want to check inventory availability through third party api call please comment inventoryAvailable at line 275                            */
                /* Update the inventoryAvailable variable with third party inventory api call response.                                                          */
                /* Make sure value of inventoryAvailable variable is of boolean type true/false                                                                  */
                /* To disable the inventory check disable "Enable ESW Inventory Check" custom preference from ESW checkout configuration custom preference group.*/
                /* ***********************************************************************************************************************************************/
                inventoryAvailable = ocHelper.validateEswOrderInventory(order);
            }
        }
        let responseJSON = {};
        responseJSON.retailerCartId = obj.retailerCartId.toString();
        responseJSON.eShopWorldOrderNumber = obj.eShopWorldOrderNumber.toString();
        responseJSON.inventoryAvailable = inventoryAvailable;
        this.eswInfoLogger('Esw Inventory Check Response', JSON.stringify(responseJSON));
        return responseJSON;
    },
    isEswCheckoutOnlyPackagesExportEnabled: function () {
        return Site.getCustomPreferenceValue('eswCheckoutOnlyPackagesExport');
    },
    getEswReturnOrderStatus: function () {
        return Site.getCustomPreferenceValue('eswReturnOrderStatus');
    },
    /**
     * Set customer initial cookies
     * @param {string} country - country ISO
     * @param {string} currencyCode - currencyISO
     * @param {string} locale - locale
     */
    createInitialCookies: function (country, currencyCode, locale) {
        let parameterMap = request.httpParameterMap;
        if (request.httpCookies['esw.location'] == null) {
            this.createCookie('esw.location', country, '/');
        }
        if (!empty(parameterMap.country.value) && request.httpCookies['esw.currency'] != null && request.httpCookies['esw.currency'].value != parameterMap.country.value) {
            this.updateCookieValue(request.getHttpCookies()['esw.currency'], currencyCode);
        }
        if (request.httpCookies['esw.currency'] == null) {
            this.createCookie('esw.currency', currencyCode, '/');
        }
        if (request.httpCookies['esw.LanguageIsoCode'] == null) {
            this.createCookie('esw.LanguageIsoCode', locale, '/');
        }
        this.createCookie('esw.InternationalUser', true, '/');
        this.createCookie('esw.sessionid', customer.ID, '/');
        this.setCustomerCookies();
    },
    /**
     * Sets OAuth Token
     */
    setOAuthToken: function () {
        let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
        let oAuthObj = eswCoreService.getOAuthService();
        let formData = {
            grant_type: 'client_credentials',
            scope: 'checkout.preorder.api.all'
        };
        formData.client_id = this.getClientID();
        formData.client_secret = this.getClientSecret();
        let oAuthResult = oAuthObj.call(formData);
        if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
            logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
        }
        session.privacy.eswOAuthToken = JSON.parse(oAuthResult.object).access_token;
    },
    /**
     * Returns site custom preference value
     * from ESW Catalog Integration group
     * @param {string} customPref - field name
     * @param {string} feedInitial - feedInitial
     * @return {string} - value of custom preference
     */
    getFeedCustomPrefVal: function (customPref, feedInitial) {
        feedInitial = !empty(feedInitial) ? feedInitial : '';
        return Site.getCustomPreferenceValue(feedInitial + customPref);
    },
    /**
     * Formats time stamp into TZ date and time format
     * @param {Object} timeStamp - the Date object
     * @return {string} - formatted time stamp
     */
    formatTimeStamp: function (timeStamp) {
        const StringUtils = require('dw/util/StringUtils');
        return StringUtils.formatCalendar(new dw.util.Calendar(timeStamp), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
    },
    /**
     * ESW SFTP service
     * @param {string} feedInitial - feedInitial
     * @return {Object} SFTPService - service object
     */
    getSFTPService: function (feedInitial) {
        let serviceName = this.getFeedCustomPrefVal(feedInitial + 'SFTPService');
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
     * Returns the retailer catalog feed file count
     * stored in hidden custom site preference
     * @return {string} - file count
     */
    getCatalogFileCount: function () {
        return Site.getCustomPreferenceValue('eswRetailerCatalogFeedFileCount');
    },
    /**
     * Generates the file name with brand and leading zeros
     * as expected from ESW side
     * @param {Object} feedObj - feedObj
     * @returns {string} - file name
     */
    getFileName: function (feedObj) {
        if (feedObj && 'jobType' in feedObj && feedObj.jobType === 'LocalizedShoppingFeed') {
            let siteId = Site.getID();
            let today = this.formatTimeStamp(new Date());
            return siteId + '_' + feedObj.countryCode + '_' + today + feedObj.jobType + '.csv';
        } else if (feedObj && 'jobType' in feedObj && feedObj.jobType === 'catalogFeed') {
            let brandCode = Site.getCustomPreferenceValue('eswRetailerBrandCode');
            let instanceID = (!empty(this.getFeedCustomPrefVal('InstanceID', 'eswCatalogFeed'))) ? this.getFeedCustomPrefVal('InstanceID', 'eswCatalogFeed') : '';
            return 'Catalog-' + brandCode + '-' + instanceID + ('000000000' + this.getCatalogFileCount()).substr(-8) + '.csv';
        } else {
            let feedType = feedObj && 'jobType' in feedObj && feedObj.jobType === 'inventoryFeed' ? '_inventory' : '_catalog';
            let siteId = Site.getID();
            let today = this.formatTimeStamp(new Date());
            return siteId + '_' + feedObj.countryCode + '_' + today + feedType + '.csv';
        }
    },
    /**
     * Generates the file with brand and leading zeros
     * as expected from ESW side
     * @param {string} jobType - jobType
     * @param {string} impexDirPath - impexDirPath
     * @param {string} countryCode - countryCode
     * @returns {string} - file name
     */
    createFile: function (jobType, impexDirPath, countryCode) {
        let File = require('dw/io/File');
        let filePath,
            fileName,
            folder;
        if (jobType === 'inventoryFeed' || jobType === 'productFeed') {
            filePath = impexDirPath;
            folder = new File(filePath);
            if (!folder.exists()) {
                folder.mkdirs();
            }
            fileName = this.getFileName({ countryCode: countryCode, jobType: jobType });
        } else {
            filePath = this.getFeedCustomPrefVal('LocalPath', 'eswCatalogFeed') + Site.ID;
            folder = new File(filePath);
            if (!folder.exists()) {
                folder.mkdirs();
            }
            fileName = this.getFileName({ jobType: 'catalogFeed' });
        }
        return new File(filePath + File.SEPARATOR + fileName);
    },
    /**
     * Gets the shipping discount total by subtracting the adjusted shipping total from the
     *      shipping total price
     * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
     * @param {boolean} isESWSupportedCountry - flag to check if current country isESWSupportedCountry
     * @returns {Object} an object that contains the value and formatted value of the shipping discount
     */
    getShippingLevelDiscountTotal: function (lineItemContainer, isESWSupportedCountry) {
        let formatMoney = require('dw/util/StringUtils').formatMoney;
        let totalExcludingShippingDiscount = lineItemContainer.shippingTotalPrice;
        let totalIncludingShippingDiscount = lineItemContainer.adjustedShippingTotalPrice;
        let shippingDiscount = isESWSupportedCountry ? this.getShippingDiscount(lineItemContainer) : totalExcludingShippingDiscount.subtract(totalIncludingShippingDiscount);

        return {
            value: shippingDiscount.value,
            formatted: formatMoney(shippingDiscount)
        };
    },
    /**
     * Gets the order discount amount by subtracting the basket's total including the discount from
     *      the basket's total excluding the order discount.
     * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
     * @param {boolean} isESWSupportedCountry - flag to check if current country isESWSupportedCountry
     * @returns {Object} an object that contains the value and formatted value of the order discount
     */
    getOrderLevelDiscountTotal: function (lineItemContainer, isESWSupportedCountry) {
        let formatMoney = require('dw/util/StringUtils').formatMoney;
        let totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
        let totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
        let orderDiscount = isESWSupportedCountry ? this.getOrderDiscount(lineItemContainer) : totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);

        return {
            value: orderDiscount.value,
            formatted: formatMoney(orderDiscount)
        };
    },
    /**
     * Adds discounts to a discounts object
     * @param {dw.util.Collection} collection - a collection of price adjustments
     * @param {Object} discounts - an object of price adjustments
     * @param {boolean} isShippingDiscount - discount type is shipping?
     * @returns {Object} an object of price adjustments
     */
    createDiscountObject: function (collection, discounts, isShippingDiscount) {
        let result = discounts,
            collections = require('*/cartridge/scripts/util/collections'),
            formatMoney = require('dw/util/StringUtils').formatMoney,
            coreHelperThis = this;
        collections.forEach(collection, function (item) {
            if (!item.basedOnCoupon) {
                // convert price to shopper currency if it is shipping discount,
                // if it is order/ product discount then, don't convert price on amount off type of discount.
                let itemPrice = isShippingDiscount ? coreHelperThis.getMoneyObject(item.price, true, false, true) : (item.appliedDiscount.type === dw.campaign.Discount.TYPE_AMOUNT) ? new dw.value.Money(item.price.value, coreHelperThis.getCurrentEswCurrencyCode()) : coreHelperThis.getMoneyObject(item.price, false, false, true); // eslint-disable-line no-nested-ternary
                result[item.UUID] = {
                    UUID: item.UUID,
                    lineItemText: item.lineItemText,
                    price: formatMoney(itemPrice),
                    type: 'promotion',
                    callOutMsg: (typeof item.promotion !== 'undefined' && item.promotion !== null) ? item.promotion.calloutMsg : ''
                };
            }
        });

        return result;
    },
    /**
    * creates an array of discounts.
    * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
    * @returns {Array} an array of objects containing promotion and coupon information
    */
    getDiscounts: function (lineItemContainer) {
        let discounts = {},
            collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
            let priceAdjustments = collections.map(
                couponLineItem.priceAdjustments,
                function (priceAdjustment) {
                    return { callOutMsg: (typeof priceAdjustment.promotion !== 'undefined' && priceAdjustment.promotion !== null) ? priceAdjustment.promotion.calloutMsg : '' };
                });
            discounts[couponLineItem.UUID] = {
                type: 'coupon',
                UUID: couponLineItem.UUID,
                couponCode: couponLineItem.couponCode,
                applied: couponLineItem.applied,
                valid: couponLineItem.valid,
                relationship: priceAdjustments
            };
        });
        discounts = this.createDiscountObject(lineItemContainer.priceAdjustments, discounts, false);
        discounts = this.createDiscountObject(lineItemContainer.allShippingPriceAdjustments, discounts, true);
        return Object.keys(discounts).map(function (key) {
            return discounts[key];
        });
    },
    beautifyJsonAsString: function (jsonStr) {
        return JSON.stringify(jsonStr, null, '\t');
    },
    /**
     * Check if esw for order have split payments
     * @param {dw.order.LineItemCtnr} order - the current order
     * @return {array} - splitPaymentInfo - payment Information
     */
    EswSplitPaymentDetails: function (order) {
        let formatMoney = require('dw/util/StringUtils').formatMoney;
        let splitPaymentInfo = [];
        if (order.getPaymentInstruments() && order.getPaymentInstruments().length > 1) {
            let pis = order.getPaymentInstruments().iterator();
            while (pis.hasNext()) {
                let pisInfo = pis.next().paymentTransaction;
                if (pisInfo && pisInfo.custom && 'eswPaymentMethodCardBrand' in pisInfo.custom) {
                    splitPaymentInfo.push({
                        eswPaymentAmount: pisInfo.custom.eswPaymentMethodCardBrand !== 'GiftCertificate' && 'eswPaymentAmount' in pisInfo.custom ? formatMoney(new dw.value.Money(pisInfo.custom.eswPaymentAmount, order.custom.eswShopperCurrencyCode)) : formatMoney(new dw.value.Money(pisInfo.amount.value, order.custom.eswShopperCurrencyCode)),
                        eswPaymentMethodCardBrand: pisInfo.custom.eswPaymentMethodCardBrand
                    });
                }
            }
        }
        return splitPaymentInfo;
    },
    /**
     * get country part from locale
     * @param {*} locale - country locale, eg: en-IE, IE
     * @returns {string} - country code from locale
     */
    getLocaleCountry: function (locale) {
        let countryCode = locale;
        if (locale.indexOf('-') !== -1) {
            let localeArr = locale.split('-');
            if (localeArr.length > 1) {
                countryCode = localeArr[1];
            }
        }
        return countryCode;
    },
    /**
     * Return contry detail by local in httpParam or country id (IE, CA) string
     * @param {*} httpParams - httpParam or country id (IE, CA) string
     * @returns {Object} - getSelectedCountryDetail function
     */
    getCountryDetailByParam: function (httpParams) {
        if (empty(httpParams)) {
            return null;
        }
        let locale = httpParams;
        try {
            locale = httpParams.get('locale')[0];
        } catch (e) {
            locale = httpParams;
        }
        let loclaeCountryDetail;
        try {
            loclaeCountryDetail = this.getLocaleCountry(locale);
        } catch (error) {
            loclaeCountryDetail = httpParams.get('country-code')[0];
        }
        let countryDetail = this.getSelectedCountryDetail(loclaeCountryDetail);
        return countryDetail;
    },
    /**
     * Get localize country object for getMoneyObject function
     * @param {Object} selectedCountryDetail - object of selected country
     * @returns {Object} - localize object
     */
    getCountryLocalizeObj: function (selectedCountryDetail) {
        let eswPricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
        let selectedFxRate = this.getESWCurrencyFXRate(selectedCountryDetail.defaultCurrencyCode, selectedCountryDetail.countryCode);
        let selectedCountryAdjustments = this.getESWCountryAdjustments(selectedCountryDetail.countryCode);
        let localizeObj = {
            currencyCode: selectedCountryDetail.defaultCurrencyCode,
            countryCode: selectedCountryDetail.countryCode,
            applyRoundingModel: !selectedCountryDetail.isFixedPriceModel && this.isEswRoundingsEnabled(),
            applyCountryAdjustments: true, // !selectedCountryDetail.isFixedPriceModel
            selectedFxRate: selectedFxRate[0],
            selectedCountryAdjustments: selectedCountryAdjustments[0],
            isFixedPriceModel: selectedCountryDetail.isFixedPriceModel
        };
        let selectedRoundingRule = eswPricingHelper.getESWRoundingModel(localizeObj);
        localizeObj.selectedRoundingRule = selectedRoundingRule[0];
        localizeObj.selectedCountry = localizeObj;
        return localizeObj;
    }
};

module.exports = {
    getEswHelper: getEswHelper
};
