'use strict';

/* API Includes */
const logger = require('dw/system/Logger');

/**
 * Get Fx Rate of shopper currency
 * @param {string} shopperCurrencyIso - getting from site preference
 * @param {string} shopperCountry - shopper local country getting from site preference
 * @returns {array} returns selected fx rate
 */
function getESWCurrencyFXRate(shopperCurrencyIso, shopperCountry) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
        fxRates = eswHelper.getPricingAdvisorData().fxRates,
        baseCurrency = eswHelper.getBaseCurrencyPreference(shopperCountry),
        selectedFxRate = [];
    if (!empty(fxRates)) {
        selectedFxRate = fxRates.filter(function (rates) {
            return rates.toShopperCurrencyIso === shopperCurrencyIso && rates.fromRetailerCurrencyIso === baseCurrency;
        });

        if (empty(selectedFxRate)) {
            let currencyFxRate = {
                fromRetailerCurrencyIso: (shopperCurrencyIso === baseCurrency) ? baseCurrency : shopperCurrencyIso,
                rate: '1',
                toShopperCurrencyIso: (shopperCurrencyIso === baseCurrency) ? baseCurrency : shopperCurrencyIso
            };
            selectedFxRate.push(currencyFxRate);
        }
    }
    return selectedFxRate;
}

/**
 * Get localized price after applying country adjustment
 * @param {number} localizePrice - after applying fx rate
 * @param {array} selectedCountryAdjustment - getting from site preference for specific local country
 * @returns {number} returns calculated localized price
 */
function applyESWCountryAdjustments(localizePrice, selectedCountryAdjustment) {
    /* eslint-disable no-mixed-operators */
    /* eslint-disable no-new-wrappers */
    /* eslint-disable no-param-reassign */
    if (!empty(selectedCountryAdjustment)) {
        // applying adjustment
        localizePrice += new Number((selectedCountryAdjustment[0].retailerAdjustments.priceUpliftPercentage / 100 * localizePrice));
        // applying duty
        localizePrice += new Number((selectedCountryAdjustment[0].estimatedRates.dutyPercentage / 100 * localizePrice));
        // applying tax
        localizePrice += new Number((selectedCountryAdjustment[0].estimatedRates.taxPercentage / 100 * localizePrice));
    }
    return localizePrice;
}

/**
 * Get ESW Country Adjustments for localize country
 * @param {string} deliveryCountryIso - localize country code
 * @returns {array} returns selected country adjustment
 */
function getESWCountryAdjustments(deliveryCountryIso) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
        countryAdjustment = eswHelper.getPricingAdvisorData().countryAdjustment,
        selectedCountryAdjustment = [];
    if (!empty(countryAdjustment)) {
        selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
            return adjustment.deliveryCountryIso === deliveryCountryIso;
        });
    }
    return selectedCountryAdjustment;
}

/**
 * Get localized price after applying rounding model
 * @param {number} localizePrice - price after applying fx rate & country adjustment
 * @param {array} selectedRoundingRule - selected rounding rule
 * @param {number} baseProductPrice - price before conversion
 * @returns {number} returns calculated localized price
 */
function applyESWRoundingRule(localizePrice, selectedRoundingRule, baseProductPrice) {
    let customizationHelper = require('*/cartridge/scripts/helper/customizationHelper'),
        eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
        roundedPrice = customizationHelper.applyCustomizedRounding(localizePrice, baseProductPrice);

    if (!empty(selectedRoundingRule) && empty(roundedPrice)) {
        roundedPrice = eswHelper.applyRoundingModel(localizePrice, selectedRoundingRule[0]);
    }
    return roundedPrice;
}

/**
 * Get Rounding Model for localize country
 * @param {Object} localizeObj - local country currency preference
 * @returns {array} returns selected rounding rule
 */
function getESWRoundingModel(localizeObj) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
        roundingModels = eswHelper.getPricingAdvisorData().roundingModels,
        selectedRoundingModel,
        selectedRoundingRule = [];
    if (localizeObj.applyRoundingModel.toLowerCase() === 'true' && !empty(roundingModels)) {
        selectedRoundingModel = roundingModels.filter(function (rule) {
            return rule.deliveryCountryIso === localizeObj.localizeCountryObj.countryCode;
        });

        selectedRoundingRule = selectedRoundingModel[0].roundingModels.filter(function (rule) {
            return rule.currencyIso === localizeObj.localizeCountryObj.currencyCode;
        });
    }
    return selectedRoundingRule;
}

/**
 * Returns conversion preference for selected country, currency
 * @param {Object} localizeObj - local country currency preference
 * @returns {Object} conversionPref JSON
 */
function getConversionPreference(localizeObj) {
    let conversionPref = {
        selectedFxRate: getESWCurrencyFXRate(localizeObj.localizeCountryObj.currencyCode, localizeObj.localizeCountryObj.countryCode),
        selectedCountryAdjustments: getESWCountryAdjustments(localizeObj.localizeCountryObj.countryCode),
        selectedRoundingRule: getESWRoundingModel(localizeObj)
    };
    return conversionPref;
}

/**
 * Check if localize country using fixed or dynamic pricing
 * @param {string} shopperCountry - the shopper country
 * @returns {boolean} returns boolean value
 */
function isFixedPriceCountry(shopperCountry) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
        fixedPriceCountry = eswHelper.getSelectedCountryDetail(shopperCountry).isFixedPriceModel;
    return fixedPriceCountry;
}

/**
 * Calculate localized price of selected product using base price book, FxRate, country adjustment & rounding model
 * @param {number} localizePrice - the price
 * @param {Object} localizeObj - local country currency preference
 * @param {Object} conversionPrefs - the conversion preferences which contains selected fxRate, countryAdjustments and roundingRule
 * @returns {number} returns calculated localized price
 */
function getConvertedPrice(localizePrice, localizeObj, conversionPrefs) {
    conversionPrefs = conversionPrefs || getConversionPreference(localizeObj);
    let baseProductPrice = localizePrice;

    if (!empty(conversionPrefs.selectedFxRate) && !isFixedPriceCountry(localizeObj.localizeCountryObj.countryCode)) {
        localizePrice = (localizeObj.applyCountryAdjustments.toLowerCase() === 'true') ? applyESWCountryAdjustments(localizePrice, conversionPrefs.selectedCountryAdjustments) : localizePrice;
        localizePrice = new Number((localizePrice * conversionPrefs.selectedFxRate[0].rate).toFixed(2));
        localizePrice = (localizeObj.applyRoundingModel.toLowerCase() === 'true') ? applyESWRoundingRule(localizePrice, conversionPrefs.selectedRoundingRule, baseProductPrice) : localizePrice;
    }
    return typeof localizePrice !== 'number' ? Number(localizePrice) : localizePrice;
}

/**
 * Set override price book for fixed price country
 * @param {string} shopperCountry - the shopper country
 * @param {string} overrideCurrency - the override pricebook currency
 * @param {Object} basket - SFCC Basket Object
 * @param {boolean} isOCRequest - If request coming from order confirmation
 * @returns {boolean} returns boolean value
 */
function setOverridePriceBooks(shopperCountry, overrideCurrency, basket, isOCRequest) {
    let PriceBookMgr = require('dw/catalog/PriceBookMgr'),
        eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL'),
        eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
        arrPricebooks = [],
        overridePricebooks = eswHelper.getOverridePriceBooks(shopperCountry);

    if (overridePricebooks.length > 0) {
        // eslint-disable-next-line array-callback-return
        overridePricebooks.map(function (pricebookId) {
            arrPricebooks.push(PriceBookMgr.getPriceBook(pricebookId));
        });
        try {
            PriceBookMgr.setApplicablePriceBooks(arrPricebooks);
            let priceBookCurrency = eswHelper.getPriceBookCurrency(overridePricebooks[0]);
            if (priceBookCurrency != null && (basket || isOCRequest)) {
                eswHelperHL.setBaseCurrencyPriceBook(priceBookCurrency, basket);
            }
        } catch (e) {
            logger.error(e.message + e.stack);
        }
        return true;
    }
    return false;
}

/**
 * Get localize currency for localize country
 * @param {string} shopperCountry - the shopper country
 * @returns {string} returns localize currency or null
 */
function getShopperCurrency(shopperCountry) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let selectedCountryDetail = eswHelper.getSelectedCountryDetail(shopperCountry);
    if (!empty(selectedCountryDetail.name)) {
        return selectedCountryDetail.defaultCurrencyCode;
    }
    return null;
}
/**
 * Check if selected country's override shipping cost conversion enable or not
 * @param {string} shopperCountry - the shopper country
 * @return {boolean} - true/ false
 */
function isShippingCostConversionEnabled(shopperCountry) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let shippingOverrides = eswHelper.getOverrideShipping(),
        countryCode = shopperCountry,
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
}

module.exports = {
    getConvertedPrice: getConvertedPrice,
    getConversionPreference: getConversionPreference,
    setOverridePriceBooks: setOverridePriceBooks,
    isFixedPriceCountry: isFixedPriceCountry,
    getShopperCurrency: getShopperCurrency,
    isShippingCostConversionEnabled: isShippingCostConversionEnabled
};
