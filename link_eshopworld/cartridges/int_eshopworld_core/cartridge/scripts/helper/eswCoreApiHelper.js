/* eslint-disable no-param-reassign */
'use strict';

// API Includes
const Logger = require('dw/system/Logger');
const Site = require('dw/system/Site').getCurrent();
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const ShippingMgr = require('dw/order/ShippingMgr');
const pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;

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
    let collections = require('*/cartridge/scripts/util/collections'),
        eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');


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
        item.custom.eswPrice = eswHelper.getSubtotalObject(item, false, false, false, localizeObj, conversionPrefs).value;
        item.custom.eswBasePrice = eswHelper.getSubtotalObject(item, false, false, true, localizeObj, conversionPrefs).value;
        item.custom.eswPriceAfterOrderDiscount = eswHelperHL.getLineItemConvertedProrated(basket, item, localizeObj, conversionPrefs).value;
        item.custom.eswUnitPrice = pricingHelper.getConvertedPrice(Number(item.basePrice.value), localizeObj, conversionPrefs);
        item.custom.eswRestrictedProduct = eswHelperHL.isProductRestricted(item.product.ID, localizeObj.localizeCountryObj.countryCode);
        item.custom.eswReturnProhibited = eswHelperHL.isReturnProhibited(item.product.ID, localizeObj.localizeCountryObj.countryCode);
    });
}
/**
    * Handles/ send override shipping method
    * @param {Object} basket - Basket object SFCC API
    * @param {Object} basketResponse - Basket object from OCAPI Response
    */
function sendOverrideShippingMethods(basket, basketResponse) {
    let param = request.httpParameters;
    let countryCode = null;
    if (!empty(param['country-code']) && param['country-code'][0]) {
        countryCode = param['country-code'][0];
    } else if (param.get('locale') && param.get('locale')[0] && param.get('locale')[0].includes('-')) {
        countryCode = param.get('locale')[0].split('-')[1];
    } else if (basket.custom.eswShopperCurrency) {
        countryCode = basket.custom.eswShopperCurrency;
    }

    // If countryCode is null, return early to avoid further errors
    if (!countryCode) {
        return;
    }

    let shippingModel = ShippingMgr.getShipmentShippingModel(basket.shipments[0]),
        applicableShippingMethodsOnCart = shippingModel.applicableShippingMethods.toArray();

    if (eswHelper.isEswNativeShippingHidden() && eswHelper.isSelectedCountryOverrideShippingEnabled(countryCode)) {
        let overrideShipping = eswHelper.getEswOverrideShipping(countryCode);
        let filteredShippingMethods = applicableShippingMethodsOnCart.filter(function (method) {
            return overrideShipping.includes(method.ID);
        });
        let overrideShippingMethods = filteredShippingMethods.map(function (method) {
            return {
                _type: 'shipping_method',
                id: method.ID,
                name: method.displayName,
                price: shippingModel.getShippingCost(method).amount.value,
                estimatedArrivalTime: (method.custom.estimatedArrivalTime) ? method.custom.estimatedArrivalTime : null
            };
        });
        basketResponse.c_available_shipping_methods = overrideShippingMethods;
    }
}
/**
 * Updates the basket by converting and
 * storing the prices to esw custom attributes
 * @param {Object} basket - Basket API object
 */
function eswBasketPriceConversions(basket) {
    const eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
    try {
        if (Object.hasOwnProperty.call(basket, 'orderNo')) {
            return;
        }
        let param = request.httpParameters;

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
                basket.custom.eswSubTotal = eswHelper.getSubtotalObject(basket, true, false, false, localizeObj, conversionPrefs).value;
                let orderDiscount = eswHelper.getOrderDiscountHL(basket, localizeObj, conversionPrefs);
                basket.custom.eswOrderDiscount = !empty(orderDiscount) && orderDiscount !== 0 ? orderDiscount.value : orderDiscount;
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

/**
 * sort Array products by ID
 * @param {Array<Object>} arr - products array.
 * @returns {Array<Object>} arr - Sorted products array.
 */
function sortByProductId(arr) {
    return arr.sort(function (a, b) {
        if (a.product_id < b.product_id) {
            return -1;
        }
        if (a.product_id > b.product_id) {
            return 1;
        }
        return 0;
    });
}
/**
 * Compares currentBasketData and ocPayloadJson to check if they are equal.
 * @param {Array<Object>} currentBasketData - Current basket contents.
 * @param {Array<Object>} ocPayloadJson - The ocPayloadJson.
 * @returns {boolean} - Returns true if the arrays are equal, otherwise false.
 */
function compareBasketAndOcProducts(currentBasketData, ocPayloadJson) {
    if (empty(currentBasketData) || empty(ocPayloadJson)) {
        return false;
    }
    // Get baskt SKUs
    let basketProductsData = [];
    if ('productItems' in currentBasketData) {
        let basketProducts = currentBasketData.productItems;
        for (let i = 0; i < basketProducts.length; i++) {
            basketProductsData.push({
                product_id: basketProducts[i].productId,
                quantity: basketProducts[i].quantity
            });
        }
    } else {
        let basketProducts = currentBasketData.product_items;
        for (let i = 0; i < basketProducts.length; i++) {
            basketProductsData.push({
                product_id: basketProducts[i].product_id,
                quantity: basketProducts[i].quantity
            });
        }
    }

    // Get OC SKUs
    let ocProducts = null;
    let ocProductsData = [];
    if ('cartItems' in ocPayloadJson) { // OC response for v2
        ocProducts = ocPayloadJson.cartItems;
    } else {  // OC response for v3
        ocProducts = ocPayloadJson.lineItems;
    }

    for (let i = 0; i < ocProducts.length; i++) {
        ocProductsData.push({
            product_id: ocProducts[i].product.productCode,
            quantity: ocProducts[i].quantity
        });
    }

    if (basketProductsData.length !== ocProductsData.length) {
        return false;
    }
    basketProductsData = sortByProductId(basketProductsData);
    ocProductsData = sortByProductId(ocProductsData);

    for (let i = 0; i < basketProductsData.length; i++) {
        let basketProductsDataKeys = Object.keys(basketProductsData[i]);
        let ocProductsDataKeys = Object.keys(ocProductsData[i]);

        if (basketProductsDataKeys.length !== ocProductsDataKeys.length) {
            return false;
        }

        for (let key of basketProductsDataKeys) {
            if (basketProductsData[i][key] !== ocProductsData[i][key]) {
                return false;
            }
        }
    }

    return true;
}


module.exports = {
    eswBasketPriceConversions: eswBasketPriceConversions,
    sendOverrideShippingMethods: sendOverrideShippingMethods,
    compareBasketAndOcProducts: compareBasketAndOcProducts
};
