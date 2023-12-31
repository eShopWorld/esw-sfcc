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


const getEswHelper = {
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
    getAllCountries: function () {
        let allCountriesCO = this.queryAllCustomObjects('ESW_COUNTRIES', '', 'custom.name asc'),
            countriesArr = [];
        if (allCountriesCO.count > 0) {
            while (allCountriesCO.hasNext()) {
                let countryDetail = allCountriesCO.next();
                countriesArr.push({
                    value: countryDetail.getCustom().countryCode,
                    displayValue: countryDetail.getCustom().name
                });
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

        if (!empty(listPriceBook)) {
            overridePriceBooksArr.push(listPriceBook.replace(/{countryCode}+/g, countryCode.toLowerCase()));
        }
        if (!empty(salePriceBook)) {
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
     * @return {boolean} - true/ false
     */
    isReturnProhibited: function (product) {
        if (this.getReturnProhibitionEnabled()) {
            let currCountry = this.getAvailableCountry();
            let returnProhibitedCountries = ('eswProductReturnProhibitedCountries' in product.custom) ? product.custom.eswProductReturnProhibitedCountries : null;
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
            eswLanguageIsoCode = this.createCookie('esw.LanguageIsoCode', '', '/');
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
     * @returns {boolean}  - true or false
     */
    isSameGeoIpCountry: function () {
        if (!this.getGeoIpAlert()) {
            // When feature not in use then we do not need to show alert
            return { isSameCountry: true, geoLocation: null };
        }
        let geoLocation = request.geolocation.countryCode;
        let countryCookie = !empty(request.httpCookies['esw.location']) ? request.httpCookies['esw.location'].value : null;
        let isAllowedCountry = this.checkIsEswAllowedCountry(geoLocation);

        if (empty(countryCookie) || !isAllowedCountry || empty(geoLocation)) {
            return { isSameCountry: true, geoLocation: isAllowedCountry ? geoLocation : null };
        }
        if (!empty(geoLocation) && !empty(countryCookie)) {
            return { isSameCountry: geoLocation === countryCookie, geoLocation: geoLocation };
        }
        return { isSameCountry: false, geoLocation: geoLocation };
    },
    /*
     * Function to perform fxrate calculations, apply adjustments, duty and tax and returns money object
     */
    // eslint-disable-next-line consistent-return
    getMoneyObject: function (price, noAdjustment, formatted, noRounding, selectedCountryInfoObjParam) {
        let eswCalculationHelper = require('*/cartridge/scripts/helper/eswCalculationHelper').getEswCalculationHelper;
        return eswCalculationHelper.getMoneyObject(price, noAdjustment, formatted, noRounding, selectedCountryInfoObjParam);
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
     * applies rounding model received from V3 price feed.
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
    getSubtotalObject: function (cart, isCart, listPrice, unitPrice) {
        let eswCalculationHelper = require('*/cartridge/scripts/helper/eswCalculationHelper').getEswCalculationHelper;
        return eswCalculationHelper.getSubtotalObject(cart, isCart, listPrice, unitPrice);
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
     * @returns {dw.value.Money} - DW Money object
     */
    getOrderDiscount: function (cart) {
        try {
            let Money = require('dw/value/Money');
            let that = this;
            let orderLevelProratedDiscount = that.getOrderProratedDiscount(cart);
            return new Money(orderLevelProratedDiscount, request.httpCookies['esw.currency'].value);
        } catch (e) {
            logger.error('Error while calculating order discount: {0} {1}', e.message, e.stack);
            return null;
        }
    },
    /**
     * This function is used to get Order Prorated Discount
     * @param {dw.order.Basket} cart - DW Basket object
     * @returns {number} - orderLevelProratedDiscount
     */
    getOrderProratedDiscount: function (cart) {
        let orderLevelProratedDiscount = 0;
        let allPriceAdjustmentIter = cart.priceAdjustments.iterator();
        while (allPriceAdjustmentIter.hasNext()) {
            let eachPriceAdjustment = allPriceAdjustmentIter.next();
            if (eachPriceAdjustment.priceValue) {
                let discountValue = this.getMoneyObject((eachPriceAdjustment.priceValue), false, false, true).value;
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
        let Currency = require('dw/util/Currency'),
            Cart = require('*/cartridge/scripts/models/CartModel'),
            currency = Currency.getCurrency(currencyCode);
        Transaction.wrap(function () {
            session.setCurrency(currency);
            let currentCart = Cart.get();
            if (currentCart) {
                currentCart.updateCurrency();
                currentCart.calculate();
            }
        });
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
     * @return {boolean} - true/ false
     */
    isDeliveryDiscountBasedOnCoupon: function (cart) {
        let collections = require('*/cartridge/scripts/util/collections');
        let shippingPriceAdjustmentIter = cart.defaultShipment.shippingPriceAdjustments.iterator(),
            isBasedOnCoupon = false;
        while (shippingPriceAdjustmentIter.hasNext()) {
            let shippingPriceAdjustment = shippingPriceAdjustmentIter.next();
            if (shippingPriceAdjustment.basedOnCoupon) {
                isBasedOnCoupon = true;
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
        if (promotion.custom.eswLocalizedThresholdEnabled) {
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
        let allShippingPriceAdjustmentsIter = currentBasket.getAllShippingPriceAdjustments().iterator();
        let cartTotals = this.getSubtotalObject(currentBasket, true);
        let collections = require('*/cartridge/scripts/util/collections');
        let fxRate = !empty(JSON.parse(session.privacy.fxRate)) ? JSON.parse(session.privacy.fxRate).rate : '1';
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
            let currencyForSelectedCountry = this.getDefaultCurrencyForCountry(selectedCountry);
            currencyCode = (!empty(request.httpCookies['esw.currency']) && request.httpCookies['esw.currency'].value === currencyForSelectedCountry) ? request.httpCookies['esw.currency'].value :
                currencyForSelectedCountry;
            let locale = this.getAllowedLanguages()[0].value;
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
     * @return {boolean} - boolean
     */
    rebuildCartUponBackFromESW: function () {
        let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
        let BasketMgr = require('dw/order/BasketMgr');
        let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        try {
            let currentBasket = BasketMgr.getCurrentBasket();
            let eswHelper = this;
            if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) {
                if (!currentBasket) {
                    eswHelper.rebuildCart();
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
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        let metadataItems = this.getBasketMetadataPreference(),
            arr = new ArrayList([]),
            registration = {},
            i = 0;

        let eswCheckoutRegisterationEnabled = eswHelper.isCheckoutRegisterationEnabled();
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
     * @param {*} string - string to check
     * @returns {boolean} - true or false
     */
    isValidJson: function (string) {
        try {
            JSON.parse(string);
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
    }
};

module.exports = {
    getEswHelper: getEswHelper
};
