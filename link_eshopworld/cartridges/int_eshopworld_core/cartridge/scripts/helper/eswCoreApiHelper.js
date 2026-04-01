/*This script is being used in Headless and Spark cartridges, any changes to this script should be regression tested in both cartridges*/

/* eslint-disable no-param-reassign */
'use strict';

// API Includes
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
    if (eswHelper.isOnlyDigitalProductsInCart(basket)) {
        // Do not send shipping methods if there are only digital products in the cart 
        // as there will be no shipping cost for digital products
        return;
    }
    let countryCode = null;
    let localeCountryCode = getHeadlessLocale(request);
    try {
        if (localeCountryCode) {
            countryCode = localeCountryCode;
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
    } catch (error) {
        eswHelper.eswInfoLogger('sendOverrideShippingMethods Error', error, error.message, error.stack);
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
        let localeCountryCode = getHeadlessLocale(request);
        if (localeCountryCode && !empty(basket)) {
            let isFixedPriceCountry;
            let shopperCountry = localeCountryCode;
            let shopperCurrency = !empty(param['currency-code']) ? param['currency-code'][0] : pricingHelper.getShopperCurrency(shopperCountry);
            if (request.isSCAPI()) {
                let countryParam = empty(request.httpParameters.get('locale')) && !empty(basket) ? basket.custom.eswShopperCurrency : request.httpParameters;
                var selectedCountryDetail = eswHelper.getCountryDetailByParam(countryParam);
                shopperCountry = selectedCountryDetail.countryCode;
                isFixedPriceCountry = selectedCountryDetail.isFixedPriceMode;
            } else {
                isFixedPriceCountry = pricingHelper.isFixedPriceCountry(shopperCountry);
            }
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
                basket.custom.eswShopperCurrency = shopperCountry;
                basket.custom.eswSubTotal = eswHelper.getSubtotalObject(basket, true, false, false, localizeObj, conversionPrefs).value;
                let orderDiscount = eswHelper.getOrderDiscountHL(basket, localizeObj, conversionPrefs);
                basket.custom.eswOrderDiscount = !empty(orderDiscount) && orderDiscount !== 0 ? orderDiscount.value : orderDiscount;
                basket.custom.eswOrderTotal = eswHelperHL.getFinalOrderTotalsObject(basket, localizeObj, conversionPrefs).value;
                if (!request.isSCAPI()) {
                    eswHelperHL.adjustThresholdDiscounts(basket, localizeObj, conversionPrefs);
                }
                // added check to set attribute once shipping is set in case country switched
                if (basket.shippingTotalPrice.value > 0) {
                    basket.custom.eswEstimatedShippingTotal = eswHelperHL.getEswCartShippingCost(basket.shippingTotalPrice, localizeObj, conversionPrefs).value;
                }
            }
        }
    } catch (error) {
        eswHelper.eswInfoLogger('eswBasketPriceConversions Error', error, error.message, error.stack);
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

/**
 * Combines duplicate product items in the given ArrayList by summing their quantities and prices.
 * @param {dw.util.ArrayList|Array<Object>} productItems - The list of product items to process.
 * @returns {dw.util.ArrayList|Array<Object>} - The processed list with duplicates combined.
 */
function combineProductItems(productItems) {
    if (!(productItems instanceof dw.util.ArrayList)) {
        return productItems;
    }
    // Process original ArrayList in place
    for (let i = 0; i < productItems.length; i++) {
        let currentItem = productItems[i];
        // Look ahead for duplicates of current item
        for (let j = i + 1; j < productItems.length; j++) {
            let nextItem = productItems[j];
            // If we find a duplicate product_id
            if (currentItem.product_id === nextItem.product_id) {
                // Add quantities and prices to the first occurrence
                currentItem.quantity += nextItem.quantity;
                currentItem.price += nextItem.price;
                currentItem.adjusted_tax += nextItem.adjusted_tax;
                currentItem.tax += nextItem.tax;
                currentItem.tax_basis += nextItem.tax_basis;
                if (typeof nextItem.price_after_item_discount !== 'undefined') {
                    currentItem.price_after_item_discount =
                        (currentItem.price_after_item_discount || 0) + nextItem.price_after_item_discount;
                }

                if (typeof nextItem.price_after_order_discount !== 'undefined') {
                    currentItem.price_after_order_discount =
                        (currentItem.price_after_order_discount || 0) + nextItem.price_after_order_discount;
                }
                // Remove the duplicate item
                productItems.removeAt(j);
                j--; // Adjust index since we removed an item
            }
        }
    }
    return productItems;
}
/** *Extracts the country code from the locale string.
 * Extracts the country code from the locale string. 
 * @param {object} request - request.
 * @returns {string|null} - The extracted country code or null if not found.
 **/
function getHeadlessLocale(request) {
    const logger = require('dw/system/Logger');
    const Constants = require('*/cartridge/scripts/util/Constants');
    let locale = null;
    // First, try to get from query parameters
    let httpParams = request.httpParameterMap;
    // Check for headless architecture (country-code parameter)
    if (!empty(httpParams.get('country-code'))) {
        locale = httpParams.get('country-code').value;
    }
    // Check for PWA architecture (locale parameter)
    if (empty(locale) && !empty(httpParams.get(Constants.LOCALE_QUERY_PARAM || 'locale'))) {
        let fullLocale = httpParams.get(Constants.LOCALE_QUERY_PARAM || 'locale').value;
        // Extract country code from locale format (e.g., 'en_US' -> 'US', 'en-IE' -> 'IE')
        locale = eswHelper.getLocaleCountry(fullLocale);
    }
    // If still not found and request is not GET, check request body
    if (empty(locale) && request.httpMethod !== 'GET') {
        try {
            let requestBody = request.httpParameterMap.requestBodyAsString;
            if (!empty(requestBody)) {
                let bodyObj = JSON.parse(requestBody);
                // Check for country-code in body
                if (bodyObj['country-code']) {
                    locale = bodyObj['country-code'];
                }
                // Check for locale in body
                else if (bodyObj.locale) {
                    locale = eswHelper.getLocaleCountry(bodyObj.locale);
                }
            }
        } catch (parseError) {
            logger.warn('getHeadlessLocale: Failed to parse request body - {0}', parseError.message);
        }
    }
    logger.info('Headless Locale is: {0}', locale);
    return locale;
}
function getPWAHeadlessAccessToken(reqObj) {
        let accessToken = '';
        let regex = /^authorizationParted(\d+)$/;
        let regexPeaToken = /^accessTokenParted(\d+)$/;
        let headlessToken = false;
        let accessTokenParts = [];
        if (!empty(reqObj.shopperCheckoutExperience) && !empty(reqObj.shopperCheckoutExperience.metadataItems)) {
            let metadataItems = reqObj.shopperCheckoutExperience.metadataItems;
            // eslint-disable-next-line no-restricted-syntax
            for (let metaObj in metadataItems) {
                if ((metadataItems[metaObj] && metadataItems[metaObj].name.match(regexPeaToken)) || (metadataItems[metaObj] && metadataItems[metaObj].name.match(regex))) {
                    if (metadataItems[metaObj] && metadataItems[metaObj].name.match(regexPeaToken)) {
                        let partNum = +metadataItems[metaObj].name.replace('accessTokenParted', '');
                        accessTokenParts[partNum - 1] = metadataItems[metaObj].value;
                    } else if (metadataItems[metaObj] && metadataItems[metaObj].name.match(regex)) {
                        let partNum = +metadataItems[metaObj].name.replace('authorizationParted', '');
                        accessTokenParts[partNum - 1] = metadataItems[metaObj].value;
                        headlessToken = true;
                    }
                }
            }
        }
        accessToken = accessTokenParts.join('');

        if (accessToken.length > 0 && headlessToken) {
            return { authorization: accessToken };
        }
        return accessToken;
    }

/**
 * Returns the converted price for headless both architectures.
 */
function getHeadlessPriceConversion() {
    let formatMoney = require('dw/util/StringUtils').formatMoney;
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
    let param = request.httpParameterMap;
    let price = Number(param.price.value);
    let shopperCountry = param.country.stringValue;
    let selectedCountryDetail = eswHelper.getCountryDetailByParam(shopperCountry);
    let shopperCurrency = param.currency.stringValue || pricingHelper.getShopperCurrency(shopperCountry);
    if (!empty(shopperCurrency) && !selectedCountryDetail.isFixedPriceModel) {
        let selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);
        selectedCountryLocalizeObj.isJob = 'false';
        let convertedPrice = eswHelper.getMoneyObject(price, false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj);
        return formatMoney(convertedPrice);
    } else {
        return formatMoney(new dw.value.Money(price, selectedCountryDetail.defaultCurrencyCode));
    }
}

/**
 * Rebuilds a basket using a custom SCAPI endpoint for headless and PWA architectures.
 */
function rebuildBasket() {
    let logger = require('dw/system/Logger'),
        OrderMgr = require('dw/order/OrderMgr'),
        BasketMgr = require('dw/order/BasketMgr'),
        Transaction = require('dw/system/Transaction');

    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
    eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
    // for SG cartridge need eswHelper
    try {
        // eslint-disable-next-line no-import-assign
        eswHelper = require('int_eshopworld_controllers/cartridge/scripts/helper/eswHelper').getEswHelper();
    } catch (error) { /* empty */ }
    let responseJSON;
    try {
        let eswClientLastOrderId = request.httpParameters.get('c_eswClientLastOrderId')[0];
        let orderItems = { products: [] };
        let basketItems = { products: [] };
        let coupons = [];
        let order = null;
        // eslint-disable-next-line eqeqeq
        if (!empty(eswClientLastOrderId) && eswClientLastOrderId != 'null') {
            order = OrderMgr.getOrder(eswClientLastOrderId);
            if (order && !empty(order) && (order.status.value === dw.order.Order.ORDER_STATUS_FAILED
            || order.status.value === dw.order.Order.ORDER_STATUS_CREATED
            || order.status.value === dw.order.Order.ORDER_STATUS_NEW)) {
                eswHelper.rebuildCartUponBackFromESW(order.getOrderNo());
                if (order.status.value === dw.order.Order.ORDER_STATUS_CREATED) {
                    Transaction.wrap(function () {
                        OrderMgr.failOrder(order, true);
                    });
                }
                let allLineItems = order.getAllLineItems().iterator();
                while (allLineItems.hasNext()) {
                    let currentLineItem = allLineItems.next();
                    if (currentLineItem instanceof dw.order.ProductLineItem) {
                        orderItems.products.push({
                            productId: currentLineItem.getProductID(),
                            price: currentLineItem.getPriceValue(),
                            quantity: currentLineItem.getQuantityValue()
                        });
                    }
                }
                // Re-iterate since previous iterator is consumed
                allLineItems = order.getAllLineItems().iterator();
                while (allLineItems.hasNext()) {
                    let currentLineItem = allLineItems.next();
                    if (currentLineItem instanceof dw.order.ProductLineItem) {
                        basketItems.products.push({
                            productId: currentLineItem.getProductID(),
                            lineItemId: currentLineItem.getUUID()
                        });
                    }
                }
                coupons = eswPwaHelper.getRetailerPromoCodes(order);
            } else {
                if (request.isSCAPI()) {
                    let customerBasket = BasketMgr.getCurrentOrNewBasket();
                    let currentBasketId = customerBasket.getUUID();
                    return {
                        orderLineItems: orderItems,
                        basketId: currentBasketId,
                        couponCodes: coupons,
                        removeLineItems: !empty(order) ? (
                            order.status.value === dw.order.Order.ORDER_STATUS_NEW
                            || order.status.value === dw.order.Order.ORDER_STATUS_OPEN
                        ) : false,
                        basketItems: basketItems
                    }
                }
                response.setStatus(404);
                return {
                    Error: 'The order is either unavailable or was not successfully placed. Please verify the details and try again.'
                };
            }
        }
        let customerBasket = BasketMgr.getCurrentOrNewBasket();
        let currentBasketId = customerBasket.getUUID();

        responseJSON = {
            orderLineItems: orderItems,
            basketId: currentBasketId,
            couponCodes: coupons,
            removeLineItems: !empty(order) ? (
                order.status.value === dw.order.Order.ORDER_STATUS_NEW
                || order.status.value === dw.order.Order.ORDER_STATUS_OPEN
            ) : false,
            basketItems: basketItems
        };
    } catch (e) {
        logger.error('ESW abandonmentCart Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error',
            errorMessage: e.message
        };
    }
    return responseJSON;
}

function isPwaKitMappingEnabled(){
    let Site = require('dw/system/Site').getCurrent();
    return Site.getCustomPreferenceValue('eswIsPwaKitMappingEnabled') || false;
}

/**
 * Maps standard OCAPI attributes to ESW custom attributes based on PWA Kit mode
 * @param {string} baseAttribute - The base attribute name (e.g., 'price', 'priceMax')
 * @returns {string} The target attribute name to use
 */
function getEswAttributeMapping(baseAttribute) {
    var isPwaKitEnabled = isPwaKitMappingEnabled();
    
    let attributesMapping = {
        price: {
            pwa: 'price',
            headless: 'c_eswPrice'
        },
        priceMax: {
            pwa: 'priceMax',
            headless: 'c_eswPrice_max'
        },
        pricePerUnit: {
            pwa: 'pricePerUnit',
            headless: 'c_eswPrice_per_unit'
        },
        pricePerUnitMax: {
            pwa: 'pricePerUnitMax',
            headless: 'c_eswPrice_per_unit_max'
        },
        prices: {
            pwa: 'prices',
            headless: 'c_eswPrices'
        },
        priceRanges: {
            pwa: 'priceRanges',
            headless: 'priceRanges'
        },
        currency: {
            pwa: 'currency',
            headless: 'c_shopperCurrency'
        },
        shopperCurrency: {
            pwa: 'currency',
            headless: 'c_shopperCurrency'
        },
        restrictedProduct: {
            pwa: 'c_eswRestrictedProduct',
            headless: 'c_eswRestrictedProduct'
        },
        returnProhibited: {
            pwa: 'c_eswReturnProhibited',
            headless: 'c_eswReturnProhibited'
        },
        restrictedProductMsg: {
            pwa: 'c_eswRestrictedProductMsg',
            headless: 'c_eswRestrictedProductMsg'
        },
        returnProhibitedMsg: {
            pwa: 'c_eswReturnProhibitedMsg',
            headless: 'c_eswReturnProhibitedMsg'
        }
    };
    
    // If attribute mapping exists, return pwa or headless version based on flag
    if (attributesMapping[baseAttribute]) {
        return isPwaKitEnabled ? attributesMapping[baseAttribute].pwa : attributesMapping[baseAttribute].headless;
    }
    
    // Return original attribute if no custom mapping exists
    return baseAttribute;
}

module.exports = {
    eswBasketPriceConversions: eswBasketPriceConversions,
    sendOverrideShippingMethods: sendOverrideShippingMethods,
    compareBasketAndOcProducts: compareBasketAndOcProducts,
    combineProductItems: combineProductItems,
    getHeadlessLocale: getHeadlessLocale,
    getHeadlessPriceConversion: getHeadlessPriceConversion,
    getPWAHeadlessAccessToken: getPWAHeadlessAccessToken,
    rebuildBasket: rebuildBasket,
    isPwaKitMappingEnabled: isPwaKitMappingEnabled,
    getEswAttributeMapping: getEswAttributeMapping
};
