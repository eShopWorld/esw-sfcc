/* eslint-disable no-param-reassign */
'use strict';

// API Includes
const Logger = require('dw/system/Logger');
const Site = require('dw/system/Site').getCurrent();

/**
 * Updates the productLineItems (pli) with in the basket
 * by converting and storing the prices to esw custom attributes
 * @param {Object} basket - Basket API object
 * @param {Object} pliAttributeMap - productLineItem mapping from custom site preference
 * @param {Object} localizeObj - local country currency preference
 * @param {Object} conversionPrefs - the conversion preferences which contains selected fxRate, countryAdjustments and roundingRule
 * @param {boolean} isFixedPriceCountry - indicate shopper country fixed or dynamic
 */
function eswPliPriceConversions(basket, pliAttributeMap, localizeObj, conversionPrefs, isFixedPriceCountry) {
    let collections = require('*/cartridge/scripts/util/collections');
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelperHL');
    let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
    collections.forEach(basket.productLineItems, function (item) {
        if (!empty(pliAttributeMap)) {
            Object.keys(pliAttributeMap).forEach(function (key) { // eslint-disable-line array-callback-return
                let customKey = (key.substring(0, 2) === 'c_') ? key.slice(2) : '';
                if (empty(customKey) && key in item) {
                    item.custom[pliAttributeMap[key]] = (isFixedPriceCountry) ? Number(item[key].value) : pricingHelper.getConvertedPrice(Number(item[key].value), localizeObj, conversionPrefs);
                } else if (customKey in item.custom) { // for custom attributes
                    item.custom[pliAttributeMap[key]] = (isFixedPriceCountry) ? Number(item.custom[customKey]) : pricingHelper.getConvertedPrice(Number(item.custom[customKey]), localizeObj, conversionPrefs);
                }
            });
        }
        item.custom.eswPrice = eswHelperHL.getSubtotalObject(item, false, false, false, localizeObj, conversionPrefs).value;
        item.custom.eswBasePrice = eswHelperHL.getSubtotalObject(item, false, false, true, localizeObj, conversionPrefs).value;
        item.custom.eswPriceAfterOrderDiscount = eswHelperHL.getLineItemConvertedProrated(basket, item, localizeObj, conversionPrefs).value;
        item.custom.eswUnitPrice = pricingHelper.getConvertedPrice(Number(item.basePrice.value), localizeObj, conversionPrefs);
        item.custom.eswRestrictedProduct = eswHelperHL.isProductRestricted(item.product.ID, localizeObj.localizeCountryObj.countryCode);
        item.custom.eswReturnProhibited = eswHelperHL.isReturnProhibited(item.product.ID, localizeObj.localizeCountryObj.countryCode);
    });
}

/**
 * Updates the basket by converting and
 * storing the prices to esw custom attributes
 * @param {Object} basket - Basket API object
 */
function eswBasketPriceConversions(basket) {
    try {
        if (Object.hasOwnProperty.call(basket, 'orderNo')) {
            return;
        }
        let param = request.httpParameters,
            pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelperHL'),
            eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');

        if (!empty(param['country-code']) && !empty(basket)) {
            let shopperCountry = param['country-code'][0];
            let shopperCurrency = !empty(param['currency-code']) ? param['currency-code'][0] : pricingHelper.getShopperCurrency(shopperCountry);
            let isFixedPriceCountry = pricingHelper.isFixedPriceCountry(shopperCountry);
            if (!empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: shopperCountry,
                        currencyCode: shopperCurrency
                    },
                    applyCountryAdjustments: !empty(param.applyAdjust) ? param.applyAdjust[0] : 'true',
                    applyRoundingModel: !empty(param.applyRounding) ? param.applyRounding[0] : 'true'
                };

                let conversionPrefs = (isFixedPriceCountry) ? {} : pricingHelper.getConversionPreference(localizeObj);
                let basketAttributesMap = !empty(Site.getCustomPreferenceValue('eswBasketPricingMapping')) ? JSON.parse(Site.getCustomPreferenceValue('eswBasketPricingMapping')) : {};
                let pliAttributeMap = (basketAttributesMap && basketAttributesMap.productLineItems) ? basketAttributesMap.productLineItems : '';
                eswPliPriceConversions(basket, pliAttributeMap, localizeObj, conversionPrefs, isFixedPriceCountry);
                if (!empty(basketAttributesMap)) {
                    Object.keys(basketAttributesMap).forEach(function (key) { // eslint-disable-line array-callback-return
                        let customKey = (key.substring(0, 2) === 'c_') ? key.slice(2) : '';
                        if (empty(customKey) && key in basket && key !== 'productLineItems') {
                            // for Basket Totals
                            basket.custom[basketAttributesMap[key]] = (isFixedPriceCountry) ? Number(basket[key].value) : pricingHelper.getConvertedPrice(Number(basket[key].value), localizeObj, conversionPrefs);
                        } else if (customKey in basket.custom) { // for custom attributes
                            basket.custom[basketAttributesMap[key]] = (isFixedPriceCountry) ? Number(basket.custom[customKey]) : pricingHelper.getConvertedPrice(Number(basket.custom[customKey]), localizeObj, conversionPrefs);
                        }
                    });
                }
                basket.custom.eswSubTotal = eswHelperHL.getSubtotalObject(basket, true, false, false, localizeObj, conversionPrefs).value;
                basket.custom.eswOrderDiscount = eswHelperHL.getOrderDiscount(basket, localizeObj, conversionPrefs).value;
                basket.custom.eswOrderTotal = eswHelperHL.getFinalOrderTotalsObject(basket, localizeObj, conversionPrefs).value;
                eswHelperHL.adjustThresholdDiscounts(basket, localizeObj, conversionPrefs);
                basket.custom.eswEstimatedShippingTotal = eswHelperHL.getEswCartShippingCost(basket.shippingTotalPrice, localizeObj, conversionPrefs).value;
                basket.custom.eswShopperCurrency = shopperCurrency;
            }
        }
    } catch (error) {
        Logger.error('something went wrong while updating basket prices Error:', error);
    }
}

module.exports = {
    eswBasketPriceConversions: eswBasketPriceConversions
};
