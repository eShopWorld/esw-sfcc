const Logger = require('dw/system/Logger');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
/**
 * Returns Country Data
 * @param {string} country - country for data
 * @return {Object} data object
 */
function getCountryData(country) {
    let dataObj = {};
    let allCountries = require('*/cartridge/scripts/util/countries');
    for (let i = 0; i < allCountries.length; i++) {
        if (allCountries[i].countryCode === country) {
            dataObj = {
                countryCode: country,
                countryName: allCountries[i].name,
                defaultCurrency: allCountries[i].defaultCurrency
            };
            return dataObj;
        }
    }
    return dataObj;
}
/**
 * Returns Country Data
 * @param {Object} countryAdjustmentJson - ESW_PA_DATA JSON
 * @return {boolean} status
 */
function setCountriesData(countryAdjustmentJson) {
    let Transaction = require('dw/system/Transaction');
    try {
        Transaction.wrap(function () {
            for (let i = 0; i < countryAdjustmentJson.length; i++) {
                let countryData = getCountryData(countryAdjustmentJson[i].deliveryCountryIso);
                if (!empty(countryData)) {
                    let countryObj = CustomObjectMgr.getCustomObject('ESW_COUNTRIES', countryAdjustmentJson[i].deliveryCountryIso);
                    if (empty(countryObj)) {
                        countryObj = CustomObjectMgr.createCustomObject('ESW_COUNTRIES', countryAdjustmentJson[i].deliveryCountryIso);
                        countryObj.custom.defaultCurrencyCode = countryData.defaultCurrency;
                        countryObj.custom.isSupportedByESW = true;
                        countryObj.custom.name = countryData.countryName;
                        countryObj.custom.countryCode = countryData.countryCode;
                    } else {
                        countryObj.custom.defaultCurrencyCode = countryData.defaultCurrency;
                        countryObj.custom.name = countryData.countryName;
                    }
                }
            }
        });
        return true;
    } catch (e) {
        Logger.error('ESW Settings Job Error Countries: {0} {1}', e.message, e.stack);
        return false;
    }
}
/**
 * Returns Currencies Data
 * @param {Object} currenciesJSON - ESW_PA_DATA JSON
 * @return {boolean} - status
 */
function setCurrenicesData(currenciesJSON) {
    let Transaction = require('dw/system/Transaction');
    let Currency = require('dw/util/Currency');
    try {
        Transaction.wrap(function () {
            for (let i = 0; i < currenciesJSON.length; i++) {
                let currencyObj = CustomObjectMgr.getCustomObject('ESW_CURRENCIES', currenciesJSON[i].toShopperCurrencyIso);
                if (empty(currencyObj)) {
                    currencyObj = CustomObjectMgr.createCustomObject('ESW_CURRENCIES', currenciesJSON[i].toShopperCurrencyIso);
                    currencyObj.custom.currencyCode = currenciesJSON[i].toShopperCurrencyIso;
                    let currency = Currency.getCurrency(currenciesJSON[i].toShopperCurrencyIso);
                    currencyObj.custom.name = currency.getName();
                    currencyObj.custom.isSupportedByESW = true;
                }
            }
        });
        return true;
    } catch (e) {
        Logger.error('ESW Settings Job Error Currencies: {0} {1}', e.message, e.stack);
        return false;
    }
}
/**
 * Sets Global Setting for custom preferences
 */
function setGlobalSettings() {
    let Site = require('dw/system/Site').getCurrent();
    if (empty(Site.getCustomPreferenceValue('eswCheckoutServiceName'))) {
        Site.setCustomPreferenceValue('eswCheckoutServiceName', 'EswCheckoutV3Service.SFRA');
    }
    if (Site.getCustomPreferenceValue('eswUrlExpansionPairs').length === 0) {
        let expPairs = ['BaseUrl|Home-Show', 'ContinueShoppingUrl|Home-Show', 'BackToCartUrl|EShopWorld-GetCart', 'InventoryCheckFailurePageUrl|EShopWorld-GetCart'];
        Site.setCustomPreferenceValue('eswUrlExpansionPairs', expPairs);
    }
    if (!Site.getCustomPreferenceValue('eswRedirect').value) {
        Site.setCustomPreferenceValue('eswRedirect', 'Login');
    }
    if (Site.getCustomPreferenceValue('eswMetadataItems').length === 0) {
        let metaItems = ['OrderConfirmationUri_TestOnly|EShopWorld-Notify', 'OrderConfirmationBase64EncodedAuth_TestOnly|1 parameters', 'InventoryCheckUri_TestOnly|EShopWorld-ValidateInventory', 'InventoryCheckBase64EncodedAuth_TestOnly|1 parameters'];
        Site.setCustomPreferenceValue('eswMetadataItems', metaItems);
    }
    if (empty(Site.getCustomPreferenceValue('eswCatalogFeedSFTPService'))) {
        Site.setCustomPreferenceValue('eswCatalogFeedSFTPService', 'ESWSFTP');
    }
}
/**
 * Script file for calling price feed service api and update site preferences from response.
 * @param {Object} args The argument object
 * @return {boolean} - returns execute result
 */
function execute(args) {
    let Status = require('dw/system/Status');
    try {
        let customObj = CustomObjectMgr.getCustomObject('ESW_PA_DATA', 'ESW_PA_DATA');
        if (args.settingType === 'countries') {
            if (!setCountriesData(JSON.parse(customObj.custom.countryAdjustmentJson))) {
                eswHelper.eswInfoLogger('Error', '', 'ESW Settings Job error', 'setCountriesData Error');
                return new Status(Status.ERROR);
            }
        } else if (args.settingType === 'currencies') {
            if (!setCurrenicesData(JSON.parse(customObj.custom.fxRatesJson))) {
                eswHelper.eswInfoLogger('Error', '', 'ESW Settings Job error', 'setcurrenciesData Error');
                return new Status(Status.ERROR);
            }
        } else if (args.settingType === 'global') {
            let Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                setGlobalSettings();
            });
        }
    } catch (e) {
        Logger.error('ESW Settings Job Error: {0} {1}', e.message, e.stack);
        eswHelper.eswInfoLogger('ESW Settings Job error:', e, e.message, e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}
exports.execute = execute;
