/* eslint-disable block-scoped-var */
/* eslint-disable no-param-reassign */
'use strict';

const collections = require('*/cartridge/scripts/util/collections');
const Logger = require('dw/system/Logger');
const Resource = require('dw/web/Resource');
const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');
const ArrayList = require('dw/util/ArrayList');
// Script Includes
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
const basketHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
const eswServiceHelperV3 = require('*/cartridge/scripts/helper/serviceHelperV3');
const Constants = require('*/cartridge/scripts/util/Constants');

// Public Methods
const OCAPIHelper = {
    /**
     * This function covers the logic of converting
     * the pricing related attributes to eSW Prices
     * for PDP - Product Detail Page (products end-point)
     * @param {Object} scriptProduct - Product Object
     * @param {Object} doc - Response document
     */
    eswPdpPriceConversions: function (scriptProduct, doc) {
        let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
        if (!empty(selectedCountryDetail.countryCode) && !empty(doc.price)) {
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency) && !selectedCountryDetail.isFixedPriceModel) {
                let selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);

                if ('price' in doc && !empty(doc.price)) {
                    doc.price = eswCoreHelper.getMoneyObject(doc.price.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }

                if ('priceMax' in doc && !empty(doc.priceMax)) {
                    doc.priceMax = eswCoreHelper.getMoneyObject(doc.priceMax.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }

                if ('pricePerUnit' in doc && !empty(doc.pricePerUnit)) {
                    doc.pricePerUnit = eswCoreHelper.getMoneyObject(doc.pricePerUnit.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }

                if ('pricePerUnitMax' in doc && !empty(doc.pricePerUnitMax)) {
                    doc.pricePerUnitMax = eswCoreHelper.getMoneyObject(doc.pricePerUnitMax.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }
                if ('priceRanges' in doc && !empty(doc.priceRanges)) {
                    for (let i = 0; i < doc.priceRanges.length; i++) {
                        let currentPriceRange = doc.priceRanges[i];
                        if (!empty(currentPriceRange.maxPrice)) {
                            doc.priceRanges[i].maxPrice = eswCoreHelper.getMoneyObject(currentPriceRange.maxPrice.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }
                        if (!empty(currentPriceRange.minPrice)) {
                            doc.priceRanges[i].minPrice = eswCoreHelper.getMoneyObject(currentPriceRange.minPrice.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }
                    }
                }

                if (doc.variants && doc.variants.length > 0) {
                    let modifiedVariants = new ArrayList([]);
                    for (let i = 0; i < doc.variants.length; i++) {
                        let currentVariant = doc.variants[i];
                        currentVariant.orderable = !eswHelperHL.isProductRestricted(currentVariant.productId, selectedCountryDetail.countryCode);
                        if (!empty(currentVariant.price)) {
                            doc.variants[i].price = eswCoreHelper.getMoneyObject(currentVariant.price.toString(),
                            false, false,
                            !selectedCountryLocalizeObj.applyRoundingModel,
                            selectedCountryLocalizeObj).value;
                        }
                        if (doc.variants[i].variantPrices && !empty(doc.variants[i].variantPrices)) {
                            for (let variantPricesIndex = 0; variantPricesIndex < doc.variants[i].variantPrices.length; variantPricesIndex++) {
                                doc.variants[i].variantPrices[variantPricesIndex].price = eswCoreHelper.getMoneyObject(doc.variants[i].variantPrices[variantPricesIndex].price.toString(),
                                false, false,
                                !selectedCountryLocalizeObj.applyRoundingModel,
                                selectedCountryLocalizeObj).value;
                            }
                        }
                        modifiedVariants.add(currentVariant);
                    }
                    doc.variants = modifiedVariants;
                }


                // Product promotion converter
                if (doc.productPromotions && !empty(doc.productPromotions)) {
                    let modifiedProductPromotions = new ArrayList([]);
                    for (let proPromoIndex = 0; proPromoIndex < doc.productPromotions.length; proPromoIndex++) {
                        let currentProductPromo = doc.productPromotions[proPromoIndex];
                        let localeKeys = Object.keys(currentProductPromo.calloutMsg);
                        // Loop through the locale keys using a traditional for loop
                        for (let i = 0; i < localeKeys.length; i++) {
                            let localeKey = localeKeys[i];
                            let promoMsgConverted = eswServiceHelperV3.convertPromotionMessage(currentProductPromo.calloutMsg[localeKey], selectedCountryDetail, selectedCountryLocalizeObj);
                            currentProductPromo.calloutMsg[localeKey] = promoMsgConverted;
                        }
                        modifiedProductPromotions.add(currentProductPromo);
                    }
                    doc.productPromotions = modifiedProductPromotions;
                }
            }
            // custom attribute to check if product is restricted in selected country
            doc.c_eswRestrictedProduct = eswHelperHL.isProductRestricted(doc.id, selectedCountryDetail.countryCode);
            doc.c_eswRestrictedProductMsg = doc.c_eswRestrictedProduct ? Resource.msg('esw.product.notavailable', 'esw', null) : '';
            // custom attribute to check if product return is prohibited in selected country
            doc.c_eswReturnProhibited = !doc.c_eswRestrictedProduct ? eswHelperHL.isReturnProhibited(doc.id, selectedCountryDetail.countryCode) : false;
            doc.c_eswReturnProhibitedMsg = eswPwaHelper.getContentAsset('esw-display-return-prohibited-message');

            doc.currency = shopperCurrency;
        }
    },
    /**
     * This function covers the logic of converting
     * the pricing related attributes to eSW Prices
     * for PLP - Product Listing Page (product_search end-point)
     * @param {Object} doc - Response document
     */
    eswPlpPriceConversions: function (doc) {
        let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
        if (!empty(selectedCountryDetail.countryCode) && doc.count > 0) {
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            let param = request.httpParameters;
            let shopperLocale = !empty(param.locale) ? param.locale[0] : request.getHttpLocale();
            if (!empty(shopperCurrency)) {
                let selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
                for (let i = 0; i < doc.count; i++) {
                    if (!selectedCountryDetail.isFixedPriceModel) {
                        if ('price' in doc.hits[i] && !empty(doc.hits[i].price)) {
                            doc.hits[i].price = eswCoreHelper.getMoneyObject(doc.hits[i].price.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }

                        if ('priceMax' in doc.hits[i] && !empty(doc.hits[i].priceMax)) {
                            doc.hits[i].priceMax = eswCoreHelper.getMoneyObject(doc.hits[i].priceMax.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }

                        if ('pricePerUnit' in doc.hits[i] && !empty(doc.hits[i].pricePerUnit)) {
                            doc.hits[i].pricePerUnit = eswCoreHelper.getMoneyObject(doc.hits[i].pricePerUnit.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }

                        if ('pricePerUnitMax' in doc.hits[i] && !empty(doc.hits[i].pricePerUnitMax)) {
                            doc.hits[i].pricePerUnitMax = eswCoreHelper.getMoneyObject(doc.hits[i].pricePerUnitMax.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }

                        if ('priceRanges' in doc.hits[i] && !empty(doc.hits[i].priceRanges)) {
                            for (let priceRangesIndex = 0; priceRangesIndex < doc.hits[i].priceRanges.length; priceRangesIndex++) {
                                let currentPriceRange = doc.hits[i].priceRanges[priceRangesIndex];
                                if (!empty(currentPriceRange.maxPrice)) {
                                    doc.hits[i].priceRanges[priceRangesIndex].maxPrice = eswCoreHelper.getMoneyObject(currentPriceRange.maxPrice.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                                }
                                if (!empty(currentPriceRange.minPrice)) {
                                    doc.hits[i].priceRanges[priceRangesIndex].minPrice = eswCoreHelper.getMoneyObject(currentPriceRange.minPrice.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                                }
                            }
                        }
                        if (doc.hits[i].variants && doc.hits[i].variants.length > 0) {
                            let modifiedVariants = new ArrayList([]);
                            for (let variantsIndex = 0; variantsIndex < doc.hits[i].variants.length; variantsIndex++) {
                                let currentVariant = doc.hits[i].variants[variantsIndex];
                                // currentVariant.orderable = doc.hits[i].c_eswRestrictedProduct === true;
                                doc.hits[i].variants[variantsIndex].price = eswCoreHelper.getMoneyObject(currentVariant.price.toString(),
                                false, false,
                                !selectedCountryLocalizeObj.applyRoundingModel,
                                selectedCountryLocalizeObj).value;
                                // Variant prices
                                if (doc.hits[i].variants[variantsIndex].variantPrices && !empty(doc.hits[i].variants[variantsIndex].variantPrices)) {
                                    for (let variantPricesIndex = 0; variantPricesIndex < doc.hits[i].variants[variantsIndex].variantPrices.length; variantPricesIndex++) {
                                        doc.hits[i].variants[variantsIndex].variantPrices[variantPricesIndex].price = eswCoreHelper.getMoneyObject(doc.hits[i].variants[variantsIndex].variantPrices[variantPricesIndex].price.toString(),
                                        false, false,
                                        !selectedCountryLocalizeObj.applyRoundingModel,
                                        selectedCountryLocalizeObj).value;
                                    }
                                }
                                // // Variant product promotions
                                // if (doc.hits[i].variants[variantsIndex].productPromotions && !empty(doc.hits[i].variants[variantsIndex].productPromotions)) {

                                // }
                            }
                            doc.hits[i].variants = modifiedVariants;
                        }

                        // Product promotion converter
                        if (doc.hits[i].productPromotions && !empty(doc.hits[i].productPromotions)) {
                            let modifiedProductPromotions = new ArrayList([]);
                            for (let proPromoIndex = 0; proPromoIndex < doc.hits[i].productPromotions.length; proPromoIndex++) {
                                let currentProductPromo = doc.hits[i].productPromotions[proPromoIndex];
                                let localeKeys = Object.keys(currentProductPromo.calloutMsg);
                                // Loop through the locale keys using a traditional for loop
                                for (let localeKeyIndex = 0; localeKeyIndex < localeKeys.length; localeKeyIndex++) {
                                    let localeKey = localeKeys[localeKeyIndex];
                                    let promoMsgConverted = eswServiceHelperV3.convertPromotionMessage(currentProductPromo.calloutMsg[localeKey], selectedCountryDetail, selectedCountryLocalizeObj);
                                    currentProductPromo.calloutMsg[localeKey] = promoMsgConverted;
                                }
                                modifiedProductPromotions.add(currentProductPromo);
                            }
                            doc.hits[i].productPromotions = modifiedProductPromotions;
                        }
                    }

                    doc.hits[i].currency = shopperCurrency;
                    // custom attribute to check if product is restricted in selected country
                    doc.hits[i].c_eswRestrictedProduct = eswHelperHL.isProductRestricted(doc.hits[i].product_id, selectedCountryDetail.countryCode);
                    // custom attribute to check if product return is prohibited in selected country
                    doc.hits[i].c_eswReturnProhibited = eswHelperHL.isReturnProhibited(doc.hits[i].product_id, selectedCountryDetail.countryCode);
                }
                if (selectedCountryDetail.isSupportedByESW) {
                    for (let j = 0; j < doc.refinements.length; j++) {
                        if (doc.refinements[j].attributeId === 'price' && !empty(shopperLocale)) {
                            for (let k = 0; k < doc.refinements[j].values.length; k++) {
                                let values = doc.refinements[j].values[k].label;
                                let localeRegex = /^[a-zA-Z]{2}(-[a-zA-Z]{2})?$/;
                                let priceRange;
                                if (localeRegex.test(shopperLocale)) {
                                    priceRange = values[shopperLocale];
                                }
                                if (!empty(priceRange)) {
                                    let updatedPrices = eswCoreHelper.updatePriceFilterWithCurrency(priceRange, selectedCountryDetail, selectedCountryLocalizeObj);
                                    if (!empty(updatedPrices)) {
                                        doc.refinements[j].values[k].label[shopperLocale] = updatedPrices;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    /**
     * This function sets the override pricebook
     * configured in custom site preference.
     * @param {Object} basket - Basket API object (Optional)
     * if basket object exists then,
     * sets the basketCurrency for pricebook override
     */
    setOverridePriceBooks: function (basket) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
        let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);

        if (!empty(selectedCountryDetail.countryCode) && selectedCountryDetail.isFixedPriceModel) {
            let currencyCode = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(currencyCode)) {
                pricingHelper.setOverridePriceBooks(selectedCountryDetail.countryCode, currencyCode, basket);
            }
        }
    },
    /**
     * Handles eShopWorld Checkout (PreOrder) API Call (Request, Response)
     * @param {Object} order - Order object SFCC API
     * @param {Object} orderResponse - Order object from OCAPI Response
     */
    handleEswPreOrderCall: function (order, orderResponse) {
        let checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            param = request.httpParameters,
            selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);

        if (!empty(selectedCountryDetail.countryCode) && eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
            let shopperCountry = selectedCountryDetail.countryCode;
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency)) {
                // API Includes
                let shopperLocale = !empty(param.locale) ? param.locale[0] : order.customerLocaleID;
                try {
                    var result = checkoutHelper.callEswCheckoutAPI(order, shopperCountry, shopperCurrency, shopperLocale);
                    if (!empty(result)) {
                        orderResponse.c_eswPreOrderResponseStatus = result.status;
                        var resultObjectJson = !empty(result.object) ? JSON.parse(result.object) : JSON.parse(result.errorMessage);
                        if (resultObjectJson.redirectUrl && !empty(resultObjectJson.redirectUrl)) {
                            let eswEmbeddedCheckoutUrl = (eswPwaHelper.getPwaShopperUrl(shopperCountry) + '/esw-checkout');
                            // Replace double slashes with a single slash
                            eswEmbeddedCheckoutUrl = eswEmbeddedCheckoutUrl.replace(/\/\//g, '/');
                            // Ensure the protocol part is not affected
                            eswEmbeddedCheckoutUrl = eswEmbeddedCheckoutUrl.replace('https:/', 'https://').replace('http:/', 'http://');
                            resultObjectJson.redirectUrl = eswHelper.isEswEnabledEmbeddedCheckout() ?
                            eswEmbeddedCheckoutUrl + '?' + Constants.EMBEDDED_CHECKOUT_QUERY_PARAM + '=' + encodeURIComponent(resultObjectJson.redirectUrl) :
                                    resultObjectJson.redirectUrl;
                        }
                        orderResponse.c_eswPreOrderResponse = resultObjectJson;
                    } else {
                        Logger.error('ESW Service Error: No Response found from API.');
                    }
                } catch (e) {
                    Logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
                }
            }
        }
    },
    /**
     * Handles/ sets basket attributes and it's logic
     * @param {Object} basket - basket object SFCC API
     */
    handleEswBasketAttributes: function (basket) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
            checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);

        if (!empty(selectedCountryDetail.countryCode) && eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: selectedCountryDetail.countryCode,
                        currencyCode: shopperCurrency
                    },
                    applyCountryAdjustments: 'true',
                    applyRoundingModel: 'true'
                };
                let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);

                checkoutHelper.setEswBasketAttributes(basket, localizeObj, conversionPrefs);
            }
        }
    },
    /**
     * Handles/ sets order attributes and it's logic
     * @param {Object} order - Order object SFCC API
     */
    handleEswOrderAttributes: function (order) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
            checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            param = request.httpParameters,
            selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
        let obj = JSON.parse(request.httpParameterMap.requestBodyAsString);
        if (empty(selectedCountryDetail) && !empty(obj.c_countryCode)) {
            // Fix for PWA embeded checkout
            selectedCountryDetail = eswHelper.getSelectedCountryDetail(obj.c_countryCode);
        }

        if (!empty(selectedCountryDetail.countryCode) && eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: selectedCountryDetail.countryCode,
                        currencyCode: shopperCurrency
                    },
                    applyCountryAdjustments: !empty(param.applyAdjust) ? param.applyAdjust[0] : 'true',
                    applyRoundingModel: !empty(param.applyRounding) ? param.applyRounding[0] : 'true'
                };
                let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);

                checkoutHelper.setEswOrderAttributes(order, localizeObj, conversionPrefs);
                checkoutHelper.setOverrideShippingMethods(order, localizeObj, conversionPrefs);
            }
        }
    },
    /**
     * Handles/ sets default override shipping method
     * @param {Object} basket - Basket object SFCC API
     */
    setDefaultOverrideShippingMethod: function (basket) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            customizationHelper = require('*/cartridge/scripts/helper/customizationHelper'),
            Transaction = require('dw/system/Transaction'),
            ShippingMgr = require('dw/order/ShippingMgr'),
            shippingOverrides = eswHelper.getOverrideShipping(),
            isOverrideCountry,
            param = request.httpParameters;

        if (!empty(param['country-code']) && eswHelper.checkIsEswAllowedCountry(param['country-code'][0]) && !empty(basket)) {
            if (shippingOverrides.length > 0) {
                isOverrideCountry = JSON.parse(shippingOverrides).filter(function (item) {
                    return item.countryCode === param['country-code'][0];
                });
            }
            Transaction.wrap(function () {
                if (!empty(isOverrideCountry) && isOverrideCountry[0] != null) {
                    if (eswHelperHL.getShippingServiceType(basket, param['country-code'][0], isOverrideCountry) === 'POST') {
                        eswHelperHL.applyShippingMethod(basket, 'POST', param['country-code'][0], true);
                    } else {
                        eswHelperHL.applyShippingMethod(basket, 'EXP2', param['country-code'][0], true);
                    }
                } else {
                    let defaultShippingMethodID = customizationHelper.getDefaultShippingMethodID(ShippingMgr.getDefaultShippingMethod().getID(), basket);
                    eswHelperHL.applyShippingMethod(basket, defaultShippingMethodID, param['country-code'][0], false);
                }
            });
        }
    },
    setSessionBaseCurrency: function (currentBasket) {
        try {
            if (currentBasket) {
                var session = request.getSession();
                var Currency = require('dw/util/Currency');
                if (currentBasket.currencyCode && session && (session.currency.currencyCode !== currentBasket.currencyCode)) {
                    let currency = Currency.getCurrency(currentBasket.currencyCode);
                    session.setCurrency(currency);
                    currentBasket.updateCurrency();
                }
            }
        } catch (error) {
            Logger.error(error.message + error.stack);
        }
    },
    /**
     * Modify basket, this function should use whenever change in basket is required
     * @param {*} basketOrCustomer - is it basket or customer object
     * @param {*} doc - response doc
     * @param {string} calledBy - check where from it is being called
     */
    basketItemsModifyResponse: function (basketOrCustomer, doc, calledBy) {
        let basketLineItems;
        let docBasket;
        let currentBasket = BasketMgr.getCurrentBasket();
        let countryParam = empty(request.httpParameters.get('locale')) && !empty(currentBasket) ? currentBasket.custom.eswShopperCurrency : request.httpParameters;
        if (!empty(countryParam)) {
            switch (calledBy) {
                case 'modifyGETResponse_v2':
                    basketLineItems = doc.baskets[0].productItems;
                    docBasket = doc.baskets[0];
                    break;
                default:
                    basketLineItems = doc.productItems;
                    docBasket = doc;
                    break;
            }

            let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(countryParam);
            let selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            basketHelper.sendOverrideShippingMethods(currentBasket, docBasket);

            if (!empty(selectedCountryDetail.countryCode)) {
                if (!selectedCountryDetail.isFixedPriceModel && !empty(docBasket.productTotal)) {
                    docBasket.productTotal = eswCoreHelper.getMoneyObject(docBasket.productTotal.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                    docBasket.productSubTotal = eswCoreHelper.getMoneyObject(docBasket.productSubTotal.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                    docBasket.currency = shopperCurrency;
                    if (docBasket.shippingTotal) {
                        docBasket.shippingTotal = eswCoreHelper.getMoneyObject(docBasket.shippingTotal.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                    }
                    if (docBasket.orderPriceAdjustments.length > 0) {
                        collections.forEach(docBasket.orderPriceAdjustments, function (orderPriceAdjustment) {
                            orderPriceAdjustment.price = eswCoreHelper.getMoneyObject(orderPriceAdjustment.price.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj, true).value;
                        });
                    }

                    if (docBasket.c_available_shipping_methods && docBasket.c_available_shipping_methods.length > 0) {
                        docBasket.c_available_shipping_methods.forEach((method) => {
                            // Convert price of shipping if no fixed price model
                            method.price = eswCoreHelper.getMoneyObject(
                                method.price.toString(),
                                false,
                                false,
                                !selectedCountryLocalizeObj.applyRoundingModel,
                                selectedCountryLocalizeObj
                            ).value;
                        });
                    }
                }
                let modifiedLi = eswPwaHelper.modifyLineItems(basketLineItems, selectedCountryLocalizeObj);
                docBasket.productItems = modifiedLi.docModifiedLineItems;
                docBasket.c_isOrderAbleBasket = modifiedLi.isOrderableBasket;
                docBasket.orderTotal = eswPwaHelper.getGrandTotal(currentBasket, selectedCountryDetail);
                // Shipping Item promo callout convert
                if (docBasket.shippingItems && !empty(docBasket.shippingItems)) {
                    let modifiedShippingItems = new ArrayList([]);
                    for (let shippingItemsIndex = 0; shippingItemsIndex < docBasket.shippingItems.length; shippingItemsIndex++) {
                        let currentShippingItem = docBasket.shippingItems[shippingItemsIndex];
                        let currentShippingItemPriceAdjustments = currentShippingItem.priceAdjustments;
                        for (let paIndex = 0; paIndex < currentShippingItemPriceAdjustments.length; paIndex++) {
                            let currentShippingItemPriceAdjustment = currentShippingItemPriceAdjustments[paIndex];
                            let shipmentItemConvertedPromoMsg = eswServiceHelperV3.convertPromotionMessage(currentShippingItemPriceAdjustment.itemText, selectedCountryDetail, selectedCountryLocalizeObj);
                            currentShippingItem.priceAdjustments[paIndex].itemText = shipmentItemConvertedPromoMsg;
                            modifiedShippingItems.add(currentShippingItem);
                        }
                    }
                    docBasket.shippingItems = modifiedShippingItems;
                }
            }
        }
    },
    basketModifyGETResponse_v2: function (customer, doc) {
        this.basketItemsModifyResponse(customer, doc, 'modifyGETResponse_v2');
    },
    basketModifyBasketAfterCouponDelete: function (basket) {
        let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        let countryParam = request.httpParameters;
        let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(countryParam);
        let selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
        let subtotal;
        let Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(basket);
            if (selectedCountryDetail.isFixedPriceModel) {
                subtotal = basket.getAdjustedMerchandizeTotalPrice(false).decimalValue;
            } else {
                subtotal = eswCoreHelper.getMoneyObject(basket.getAdjustedMerchandizeTotalPrice(false), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
            }
            OCAPIHelper.adjustThresholdDiscounts(basket, subtotal, selectedCountryLocalizeObj);
            basketCalculationHelpers.calculateTotals(basket);
            eswCoreHelper.removeThresholdPromo(basket);
        });
    },
    basketModifyPUTResponse: function (customer, doc) {
        this.basketItemsModifyResponse(customer, doc);
    },
    deleteBasketItem: function (basket, doc) {
        this.basketItemsModifyResponse(basket, doc, 'modifyDELETEResponse');
    },
    /**
     * Handles eShopWorld order history page request
     * @param {Object} orderResponse - Order object from OCAPI Response
     */
    handleEswOrdersHistoryCall: function (orderResponse) {
        try {
            let eswShopperCurrencyCode = null;
            if (orderResponse.count > 0) {
                let orders = orderResponse.data;
                for (let i = 0; i < orders.length; i++) {
                    let order = orders[i];
                    eswShopperCurrencyCode = 'c_eswShopperCurrencyCode' in order && order.c_eswShopperCurrencyCode ? order.c_eswShopperCurrencyCode : null;
                    orders[i].orderTotal = (eswShopperCurrencyCode != null) ? order.c_eswShopperCurrencyPaymentAmount : order[i].orderTotal;
                    orders[i].currency = (eswShopperCurrencyCode != null) ? eswShopperCurrencyCode : order[i].currency;
                }
            }
        } catch (error) {
            Logger.error(error.message + error.stack);
        }
    },
    /**
     * get subtotal for calculated price model on order history.
     * @param {productItems} productItems - the current line item container
     * @returns {string} the formatted money value
     */
    getCalculatedSubTotal: function (productItems) {
        let subTotal = 0;
        collections.forEach(productItems, function (productLineItem) {
            subTotal += Number((productLineItem.c_eswShopperCurrencyItemPriceInfo * productLineItem.quantity));
        });
        return subTotal;
    },
    /**
     * update product prices for ESW orders.
     * @param {productItems} productItems - the current line item container
     */
    updateProductPrices: function (productItems) {
        collections.forEach(productItems, function (productLineItem) {
            let price = Number((productLineItem.c_eswShopperCurrencyItemPriceInfo * productLineItem.quantity));
            productLineItem.basePrice = price;
            productLineItem.price = price;
            productLineItem.priceAfterItemDiscount = price;
        });
    },
    /**
     * update product prices for ESW orders.
     * @param {shipments} shipments - shipments
     * @param {string} eswTrackingUrl - ESW tracking URL
     */
    updateTrackingNumber: function (shipments, eswTrackingUrl) {
        collections.forEach(shipments, function (shipment) {
            shipment.trackingNumber = !empty(eswTrackingUrl) ? eswTrackingUrl : '#';
        });
    },
    /**
     * update ESW package JSON.
     * @param {Object} order - Order api
     * @param {Object} orderResponse - Order object from OCAPI Response
     */
    updateEswPackageJSON: function (order, orderResponse) {
        let shipmenteswPackageJSONArray = [];
        try {
            let eswPackageJSONExists = eswCoreHelper.isEswSplitShipmentEnabled() &&
                'c_eswPackageJSON' in orderResponse && !empty(orderResponse.c_eswPackageJSON);

            if (!eswPackageJSONExists) {
                orderResponse.c_eswPackageJSON = null;
                return;
            }
            let eswPackageJSON = eswCoreHelper.strToJson(orderResponse.c_eswPackageJSON);
            collections.forEach(order.shipments, function (shipment) {
                let eswPackageJSONArray = [];
                collections.forEach(shipment.productLineItems, function (item) {
                    eswPackageJSON.forEach(function (packageItem) {
                        if (item.productID === packageItem.productLineItem) {
                            eswPackageJSONArray.push(packageItem);
                        }
                    });
                });
                if (eswPackageJSONArray.length > 0) {
                    shipmenteswPackageJSONArray.push({
                        shipmentId: shipment.getID(),
                        eswPackageJSONArray: eswPackageJSONArray
                    });
                }
            });
            orderResponse.c_eswPackageJSON = shipmenteswPackageJSONArray.length > 0 ? shipmenteswPackageJSONArray : null;
        } catch (error) {
            Logger.error(error.message + error.stack);
        }
    },
    /**
     * update order response attributes
     * @param {dw.order.LineItemCtnr} order - the current order
     * @param {Object} paymentInstruments - Order paymentInstruments object from OCAPI Response
     */
    updateBreakPaymentOrderResponse: function (order, paymentInstruments) {
        if (order.getPaymentInstruments() && order.getPaymentInstruments().length > 1) {
            collections.forEach(order.getPaymentInstruments(), function (pis, index) {
                let pisInfo = pis.paymentTransaction;
                if (pisInfo && pisInfo.custom && 'eswPaymentMethodCardBrand' in pisInfo.custom) {
                    paymentInstruments[index].paymentMethodId = pisInfo.custom.eswPaymentMethodCardBrand;
                    paymentInstruments[index].amount = pisInfo.custom.eswPaymentMethodCardBrand !== 'GiftCertificate' && 'eswPaymentAmount' in pisInfo.custom ? pisInfo.custom.eswPaymentAmount : pisInfo.amount.value;
                }
            });
        }
    },
    /**
     * Handles eShopWorld order detail page request
     * @param {Object} apiOrder - Order from OCAPI Response
     * @param {Object} orderResponse - Order object from OCAPI Response
     */
    handleEswOrderDetailCall: function (apiOrder, orderResponse) {
        try {
            let eswShopperCurrencyCode = null,
                order = orderResponse;
            eswShopperCurrencyCode = 'c_eswShopperCurrencyCode' in order && order.c_eswShopperCurrencyCode ? order.c_eswShopperCurrencyCode : null;
            if (eswShopperCurrencyCode != null) {
                orderResponse.orderTotal = order.c_eswShopperCurrencyPaymentAmount;
                orderResponse.currency = eswShopperCurrencyCode;
                orderResponse.shippingTotal = order.c_eswShopperCurrencyDeliveryPriceInfo;
                orderResponse.productSubTotal = this.getCalculatedSubTotal(orderResponse.productItems);
                this.updateProductPrices(orderResponse.productItems);
                this.updateBreakPaymentOrderResponse(apiOrder, orderResponse.paymentInstruments);
                orderResponse.taxTotal = !eswCoreHelper.getEShopWorldTaxInformationEnabled() && 'c_eswShopperCurrencyTaxes' in orderResponse ? orderResponse.c_eswShopperCurrencyTaxes : 0;
                if ('c_eswReceivedASN' in orderResponse && orderResponse.c_eswReceivedASN && 'c_eswPackageReference' in orderResponse) {
                    if (!orderResponse.shipments.empty) {
                        this.updateTrackingNumber(orderResponse.shipments, orderResponse.c_eswTrackingURL);
                    }
                }
                this.updateEswPackageJSON(apiOrder, orderResponse);
            }
        } catch (error) {
            Logger.error(error.message + error.stack);
        }
    },
    handleCustomerPostResponse: function (newCustomer, customerInfo) {
        let ordernumber = eswPwaHelper.getCustomerCustomObject(customerInfo.customer.email),
            order = OrderMgr.getOrder(ordernumber),
            Transaction = require('dw/system/Transaction');
        let emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers'),
            Site = require('dw/system/Site');
        let URLUtils = require('dw/web/URLUtils');
        if (order) {
            Transaction.wrap(function () {
                order.setCustomer(newCustomer);
            });
        }

        let userObject = {
            email: newCustomer.profile.email,
            firstName: newCustomer.profile.firstName,
            lastName: newCustomer.profile.lastName,
            url: URLUtils.https('Login-Show')
        };

        let emailObj = {
            to: newCustomer.profile.email,
            subject: Resource.msg('email.subject.new.registration', 'registration', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
            type: emailHelpers.emailTypes.registration
        };

        emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountRegisteredEmail', userObject);
    },
    /** Adjusts price of discounts based on threshold promotions
     * @param {Object} currentBasket - Basket
     * @param {number} cartTotalsPwa - cartTotalsPwa
     * @param {Object} localizeObj - localizeObj
     */
    adjustThresholdDiscounts: function (currentBasket, cartTotalsPwa, localizeObj) {
        if (empty(currentBasket.priceAdjustments) && empty(currentBasket.getAllShippingPriceAdjustments())) {
            return;
        }
        let allShippingPriceAdjustmentsIter = currentBasket.getAllShippingPriceAdjustments().iterator();
        let cartTotals = cartTotalsPwa;
        let shippingLineItem;
        let fxRate = (!empty(localizeObj.selectedFxRate) && !empty(localizeObj.selectedFxRate.rate)) ? localizeObj.selectedFxRate.rate : '1';
        if (allShippingPriceAdjustmentsIter.hasNext()) {
            let shippingLineItemIter;
            if (!empty(currentBasket.defaultShipment)) {
                shippingLineItemIter = currentBasket.defaultShipment.getShippingLineItems().iterator();
            } else {
                shippingLineItemIter = currentBasket.object.defaultShipment.getShippingLineItems().iterator();
            }
            shippingLineItem = !empty(shippingLineItemIter) ? shippingLineItemIter.next() : null;
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
            if (priceAdjustment.promotion && priceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER && eswCoreHelper.isThresholdEnabled(priceAdjustment.promotion)) {
                discountType = eswCoreHelper.getDiscountType(priceAdjustment.promotion);
                Discount = eswCoreHelper.getPromoThresholdAmount(cartTotals, priceAdjustment.promotion);
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
                if (eswCoreHelper.isThresholdEnabled(priceAdjustment.promotion)) {
                    discountType = eswCoreHelper.getDiscountType(priceAdjustment.promotion);
                    Discount = eswCoreHelper.getPromoThresholdAmount(cartTotals, priceAdjustment.promotion);
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
            eswCoreHelper.removeThresholdPromo(currentBasket);
        }
    },
    /**
     * update product prices for ESW orders.
     * @param {basket} shippingMethodResult - the shippingMethodResult
     */
    updateShippingMethodSelection: function (shippingMethodResult) {
        try {
            let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
            let shippingOverrides = eswCoreHelper.getOverrideShipping();
            var isOverrideCountry;
            if (shippingOverrides.length > 0) {
                isOverrideCountry = JSON.parse(shippingOverrides).filter(function (item) {
                    return item.countryCode == selectedCountryDetail.countryCode;
                });
            }
            if (!empty(isOverrideCountry)) {
                let ids = isOverrideCountry[0].shippingMethod.ID;
                let postIds = ids.filter(id => /^POST/.test(id));
                shippingMethodResult.defaultShippingMethodId = postIds[0];
            } else if (!shippingMethodResult.defaultShippingMethodId && !empty(shippingMethodResult.applicableShippingMethods)) {
                shippingMethodResult.defaultShippingMethodId = shippingMethodResult.applicableShippingMethods[0].id;
            }
        } catch (error) {
            Logger.error(error.message + error.stack);
        }
    }
};

module.exports = OCAPIHelper;
