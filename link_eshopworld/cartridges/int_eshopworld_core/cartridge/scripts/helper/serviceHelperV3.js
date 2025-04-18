/* eslint-disable eqeqeq */
/* eslint-disable no-unused-vars */
/* eslint-disable quote-props */
/**
 * Helper script to get all ESW site preferences
 **/
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const collections = require('*/cartridge/scripts/util/collections');

const BasketMgr = require('dw/order/BasketMgr');
const StringUtils = require('dw/util/StringUtils');
const Site = require('dw/system/Site').getCurrent();
const URLUtils = require('dw/web/URLUtils');
const Currency = require('dw/util/Currency');
const Logger = require('dw/system/Logger');

/**
 * function to get the product line item metadata.
 * sends custom attributes in
 * @param {Object} pli - productLineItem
 * @return {Array} arr - metadata Array
 */
function getProductLineMetadataItems(pli) {
    let metadataItems = eswHelper.getProductLineMetadataItemsPreference(),
        obj,
        arr = [],
        i = 0;
    if (!empty(metadataItems)) {
        // eslint-disable-next-line guard-for-in, no-restricted-syntax
        for (let item in metadataItems) {
            let metadataItem = metadataItems[item];
            i = metadataItem.indexOf('|');

            // Product line custom attribute ID
            let pliCustomAttrID = metadataItem.substring(i + 1);
            let pliCustomAttrValue = (pliCustomAttrID in pli.custom && !!pli.custom[pliCustomAttrID]) ? pli.custom[pliCustomAttrID] : null;

            if (!empty(pliCustomAttrValue)) {
                obj = {
                    name: metadataItem.substring(0, i),
                    value: pliCustomAttrValue
                };
                arr.push(obj);
            }
        }
    }
    return arr.length > 0 ? arr : null;
}

/**
 * Convert promotion message, remove all HTML and done price conversion
 * base upon HTML markup e.g: <span class="esw-price">C$35</span>
 * @param {string} promotionMessageString - Promotion callout
 * @param {Obj} selectedCountryDetail - PWA kit parameter for country detail
 * @param {Obj} selectedCountryLocalizeObj - PWA kit parameter for country localize object
 * @returns {string} promotionMessageFinal - Converted message
 */
function convertPromotionMessage(promotionMessageString, selectedCountryDetail, selectedCountryLocalizeObj) {
    let promotionMessageFinal = null,
        eswPrice,
        selectedCurrency,
        selectedFxRate;
    try {
        let eswCalculationHelper = require('*/cartridge/scripts/helper/eswCalculationHelper').getEswCalculationHelper;
        if (!empty(selectedCountryDetail)) {
            selectedCurrency = selectedCountryDetail.defaultCurrencyCode;
            selectedFxRate = selectedCountryLocalizeObj.selectedFxRate;
        } else {
            selectedCurrency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getDefaultCurrencyForCountry(eswHelper.getAvailableCountry());
            selectedFxRate = eswHelper.strToJson(session.privacy.fxRate || null);
        }
        let storeFrontCurrencySymbol = Currency.getCurrency(selectedCurrency).symbol;
        let PromotionMessageWithoutHtml = !empty(promotionMessageString) ? promotionMessageString.replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, '') : '';
        if (empty(selectedFxRate) || empty(promotionMessageString) || promotionMessageString.indexOf('esw-price') === -1) {
            return PromotionMessageWithoutHtml;
        }
        let enableRounding = eswHelper.isEswRoundingsEnabled();
        let disableRounding = !enableRounding && (promotionMessageString.indexOf('data-disable-rounding') !== -1);
        let msgDiscountPriceHtml = promotionMessageString.match(/<span class="esw-price"(.*?)>(.*?)<\/span>/gi);
        let discountPriceFromHtml = (!empty(msgDiscountPriceHtml) && msgDiscountPriceHtml.length > 0) ? msgDiscountPriceHtml[0].replace(/[^0-9.]+/gi, '') : 0;
        let discountCurrency = (!empty(msgDiscountPriceHtml) && msgDiscountPriceHtml.length > 0) ? msgDiscountPriceHtml[0].replace(/[0-9.]+/gi, '').replace(/<[^>]*[>$]|&nbsp;|&zwnj;|&raquo;|&laquo;|&gt;/g, '') : storeFrontCurrencySymbol;
        if (!empty(selectedCountryDetail)) {
            eswPrice = eswHelper.getMoneyObject((!empty(discountPriceFromHtml)) ? Number(discountPriceFromHtml) : 0, false, disableRounding, false, selectedCountryLocalizeObj).value;
        } else {
            eswPrice = eswCalculationHelper.getMoneyObject((!empty(discountPriceFromHtml)) ? Number(discountPriceFromHtml) : 0, false, disableRounding, false, null);
        }
        promotionMessageFinal = PromotionMessageWithoutHtml
            .replace(discountCurrency, storeFrontCurrencySymbol)
            .replace(discountPriceFromHtml, eswPrice);
    } catch (e) {
        Logger.error('ESW convert promotion message error: ' + e);
    }
    return promotionMessageFinal;
}

/**
 * function to get product unit price info
 * @param {Object} item - productLineItem
 * @param {Object} order - order
 * @param {Object} localizeObj - localizeObj
 * @param {Object} conversionPrefs - conversionPrefs
 * @returns {Object} - line item pricing info
 */
function getProductUnitPriceInfo(item, order, localizeObj, conversionPrefs) {
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
    let finalPrice;
    let itemDiscounts = [],
        currencyCode,
        liOrderDiscount,
        discountType,
        discountedAmount,
        productUnitPriceInfo,
        itemDiscount = {};
    try {
        if (!empty(order)) {
            finalPrice = pricingHelper.getConvertedPrice(item.basePrice.value, localizeObj, conversionPrefs);
        } else {
            finalPrice = eswHelper.getMoneyObject(item.basePrice.value, false, false).value;
        }
        if (!empty(localizeObj)) {
            currencyCode = localizeObj.localizeCountryObj.currencyCode;
        } else {
            currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
        }
        // Apply product level promotions
        // eslint-disable-next-line no-loop-func
        collections.forEach(item.priceAdjustments, function (priceAdjustment) {
            if (priceAdjustment.appliedDiscount.type === 'FIXED_PRICE') {
                if (!empty(localizeObj)) {
                    let selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters);
                    let selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);
                    localizeObj.applyRoundingModel = selectedCountryLocalizeObj.applyRoundingModel.toString();
                    discountedAmount = eswHelper.getMoneyObject(priceAdjustment.appliedDiscount.fixedPrice, false, false, false, selectedCountryLocalizeObj).value * item.quantity.value;
                } else {
                    discountedAmount = eswHelper.getMoneyObject(priceAdjustment.appliedDiscount.fixedPrice, false, false).value * priceAdjustment.quantity;
                }
                if (priceAdjustment.quantity < item.quantity.value) {
                    if (!empty(localizeObj)) {
                        discountedAmount = pricingHelper.getConvertedPrice(priceAdjustment.appliedDiscount.fixedPrice, localizeObj, conversionPrefs) * item.quantity.value;
                    } else {
                        discountedAmount += (item.quantity.value - priceAdjustment.quantity) * eswHelper.getMoneyObject(item.basePrice.value, false, false).value;
                    }
                }
                discountedAmount = (finalPrice - (discountedAmount / priceAdjustment.quantity));
            } else if (priceAdjustment.appliedDiscount.type === 'BONUS_CHOICE') {
                if (!empty(localizeObj)) {
                    let selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters);
                    let selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);
                    discountedAmount = (eswHelper.getMoneyObject((priceAdjustment.priceValue * -1), false, false, false, selectedCountryLocalizeObj).value / item.quantity.value).toFixed(3);
                } else {
                    discountedAmount = (eswHelper.getMoneyObject((priceAdjustment.priceValue * -1), false, false, false).value / item.quantity.value).toFixed(3);
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (!empty(localizeObj)) {
                    let selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters);
                    let selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);
                    discountedAmount = (eswHelper.getMoneyObject((priceAdjustment.priceValue * -1), false, false, false, selectedCountryLocalizeObj).value / item.quantity.value).toFixed(3);
                } else {
                    discountedAmount = (eswHelper.getMoneyObject((priceAdjustment.priceValue * -1), false, false, true).value / item.quantity.value).toFixed(3);
                }
            }
            discountedAmount = empty(order) ? parseFloat(discountedAmount).toFixed(3) : parseFloat(discountedAmount);
            finalPrice = finalPrice.toFixed(3);
            itemDiscount = {
                'title': priceAdjustment.promotionID,
                'description': convertPromotionMessage(priceAdjustment.lineItemText),
                'discount': {
                    'currency': currencyCode,
                    'amount': discountedAmount
                },
                'beforeDiscount': {
                    'currency': currencyCode,
                    'amount': finalPrice
                }
            };
            itemDiscounts.push(itemDiscount);
            // multiply by quantity for next iteration
            finalPrice -= discountedAmount;
        });
        productUnitPriceInfo = {
            'price': {
                'currency': currencyCode,
                'amount': Number.parseFloat(finalPrice).toFixed(3)
            },
            'discounts': itemDiscounts
        };
        return productUnitPriceInfo;
    } catch (e) {
        Logger.error('ESW product unit price error: ' + e);
        return null;
    }
}

/**
 * function to get HeadlessCartDiscountamount
 * @param {string} shopperCurrency - shopperCurrency
 * @param {Object} eachPriceAdjustment - eachPriceAdjustment
 * @returns {Object} - cart discount converted price info
 */
function getHeadlessCartDiscountamount(shopperCurrency, eachPriceAdjustment) {
    let isPwa = false;
    let selectedCountryDetail = null;
    let selectedCountryLocalizeObj = null;
    let discountPrice;
    let param = request.httpParameters;
    let countryCode = !empty(param['country-code']) && !empty(param['country-code'][0]) ? param['country-code'][0] : null;
    let applyCountryAdjustments = !empty(param.applyAdjust) && !empty(param.applyAdjust[0]) ? param.applyAdjust[0] : 'true';
    let applyRoundingModel = !empty(param.applyRounding) && !empty(param.applyRounding[0]) ? param.applyRounding[0] : 'true';

    // if countryCode is null, its PWA
    if (empty(countryCode)) {
        isPwa = true;
        selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters);
        selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);
        countryCode = selectedCountryDetail.countryCode;
        applyCountryAdjustments = selectedCountryLocalizeObj.applyCountryAdjustments;
        applyRoundingModel = selectedCountryLocalizeObj.applyRoundingModel;
    }

    try {
        if (isPwa) {
            // Directly convert the price from getMoneyObject
            discountPrice = eswHelper.getMoneyObject((eachPriceAdjustment.priceValue * -1), false, false, true, selectedCountryLocalizeObj).value;
        } else {
            let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
            let localizeObj,
                conversionPrefs;
            if (!empty(countryCode) && eswHelper.checkIsEswAllowedCountry(countryCode)) {
                if (!empty(shopperCurrency)) {
                    localizeObj = {
                        localizeCountryObj: {
                            countryCode: countryCode,
                            currencyCode: shopperCurrency
                        },
                        applyCountryAdjustments: applyCountryAdjustments,
                        applyRoundingModel: applyRoundingModel
                    };
                    conversionPrefs = pricingHelper.getConversionPreference(localizeObj);
                }
            }
            if (eachPriceAdjustment.appliedDiscount.type !== dw.campaign.Discount.TYPE_FIXED_PRICE) {
                localizeObj.applyRoundingModel = 'false';
            }
            discountPrice = pricingHelper.getConvertedPrice((eachPriceAdjustment.priceValue * -1), localizeObj, conversionPrefs);
        }
    } catch (error) {
        Logger.error('ESW cart discount calculation price error: ' + error);
    }
    return discountPrice;
}

/**
 * function to get product unit price info
 * @param {Object} cart - productLineItem
 * @param {number} beforeDiscountParam - amount before discount
 * @param {string} shopperCurrency - The currency of the shopper
 * @param {boolean} isExternalCall - isExternalCall
 * @returns {Object} - cart discount price info
 */
function getCartDiscountPriceInfo(cart, beforeDiscountParam, shopperCurrency, isExternalCall) {
    try {
        let cartSubTotal = eswHelper.getSubtotalObject(cart, true),
            beforeDiscount = beforeDiscountParam,
            obj = {},
            cartDiscounts = [],
            currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
            allPriceAdjustmentIter = cart.priceAdjustments.iterator(),
            cartDiscount = {};
        if (!empty(shopperCurrency)) {
            currencyCode = shopperCurrency;
        }
        while (allPriceAdjustmentIter.hasNext()) {
            let eachPriceAdjustment = allPriceAdjustmentIter.next();
            if (eachPriceAdjustment.promotion && eswHelper.isThresholdEnabled(eachPriceAdjustment.promotion)) {
                /* eslint-disable no-continue */
                continue;
            }
            let discountValue = empty(isExternalCall) ? eswHelper.getMoneyObject((eachPriceAdjustment.priceValue * -1), false, false, true).value : getHeadlessCartDiscountamount(shopperCurrency, eachPriceAdjustment);
            if ((eachPriceAdjustment.promotion && eachPriceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER) || eachPriceAdjustment.custom.thresholdDiscountType === 'order') {
                cartDiscount = {
                    'title': eachPriceAdjustment.promotionID,
                    'description': eachPriceAdjustment.lineItemText,
                    'discount': {
                        'currency': currencyCode,
                        'amount': discountValue.toFixed(3)
                    },
                    'beforeDiscount': {
                        'currency': currencyCode,
                        'amount': beforeDiscount.toFixed(3)
                    }
                };
                cartDiscounts.push(cartDiscount);
                beforeDiscount -= discountValue;
            }
        }
        if (cartDiscounts.length > 0) {
            let finalAmount = cartDiscount.beforeDiscount.amount - cartDiscount.discount.amount;
            obj = {
                'price': {
                    'currency': currencyCode,
                    'amount': finalAmount.toFixed(3)
                },
                'discounts': cartDiscounts
            };
        }
        return obj;
    } catch (e) {
        Logger.error('ESW cart discount price error: {0} {1}', e.message, e.stack);
    }
    return null;
}

/**
 * function to get line items for version 3
 * @param {Object} order - order
 * @param {Object} countryCode - countryCode
 * @param {Object} currencyCode - currencyCode
* @returns {Object} - cart items
 */
function getLineItemsV3(order, countryCode, currencyCode) {
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
    let Transaction = require('dw/system/Transaction');
    let currentBasket = order || BasketMgr.currentBasket,
        lineItems = [],
        loopCtr = 1;
    let totalQuantity = 0,
        finalCartSubtotal = 0,
        localizeObj,
        conversionPrefs;
    if (empty(currencyCode)) {
        currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
    }
    if (!empty(order)) {
        localizeObj = {
            localizeCountryObj: {
                countryCode: countryCode,
                currencyCode: currencyCode
            },
            applyCountryAdjustments: 'true',
            applyRoundingModel: 'true'
        };

        conversionPrefs = pricingHelper.getConversionPreference(localizeObj);
        let customizationHelper = require('*/cartridge/scripts/helper/customizationHelper');

        let totalDiscount = eswHelper.getOrderDiscountHL(order, localizeObj, conversionPrefs).value,
            remainingDiscount = totalDiscount; // eslint-disable-line no-unused-vars
    } else {
        let totalDiscount = eswHelper.getOrderDiscount(currentBasket).value;
    }

    collections.forEach(currentBasket.allProductLineItems, function (item) {
        if (!item.bonusProductLineItem) {
            totalQuantity += item.quantity.value;
        }
    });
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (let lineItemNumber in currentBasket.allProductLineItems) {
        let item = currentBasket.allProductLineItems[lineItemNumber],
            liOrderDiscount,
            discountType;

        if (empty(order)) {
            // eslint-disable-next-line no-loop-func
            Transaction.wrap(function () {
                item.custom.eswLineItemId = loopCtr++;
            });
        }
        let color,
            size,
            eswImageType;
        if (!empty(item.product)) {
            let productVariationModel = item.product.variationModel;
            color = productVariationModel.getProductVariationAttribute('color') && !empty(productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color'))) ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).displayValue : null;
            size = productVariationModel.getProductVariationAttribute('size') && !empty(productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size'))) ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size')).displayValue : null;
            eswImageType = eswHelper.geteswImageType();
        }

        let productTitle = StringUtils.truncate(item.productName, 100, 'TRUNCATE_CHAR', '');
        let cartItem = {
            'quantity': item.quantity.value,
            'estimatedDeliveryDateFromRetailer': null,
            'lineItemId': item.custom.eswLineItemId,
            'product': {
                'productCode': item.productID,
                'upc': null,
                'title': productTitle,
                'description': item.productName, // we are using product name/title instead of description. ESW checkout page displays description as product title. same field is used for product title name in ESW OMS which is used for logistic flows.
                'productUnitPriceInfo': !empty(order) ? getProductUnitPriceInfo(item, order, localizeObj, conversionPrefs) : getProductUnitPriceInfo(item),
                'imageUrl': !empty(eswImageType) ? item.product.getImage(eswImageType, 0).httpURL.toString() : '',
                'productUrl': URLUtils.https('Product-Show', 'pid', item.product.ID).toString(),
                'color': !empty(color) ? color : '',
                'size': !empty(size) ? size : '',
                'isNonStandardCatalogItem': false,
                'metadataItems': getProductLineMetadataItems(item),
                'isReturnProhibited': eswHelper.isReturnProhibited(item.product, countryCode)
            },
            'cartGrouping': 'Group 1',
            'metadataItems': null
        };
        if (eswHelper.isEnabledMultiOrigin()) {
            cartItem.FulfilmentCountryIso = !empty(item.custom.eswFulfilmentCountryIso) ? item.custom.eswFulfilmentCountryIso : '';
        }
        lineItems.push(cartItem);
        finalCartSubtotal += Number(cartItem.product.productUnitPriceInfo.price.amount * item.quantity.value);
    }
    return { lineItems: lineItems, finalCartSubtotal: finalCartSubtotal };
}

/**
 * function to get shopper checkout experience for version 3
 * @param {string} shopperLocale - shopperLocale
 * @returns {Object} target object
 */
function getShopperCheckoutExperience(shopperLocale) {
    let currentBasket = BasketMgr.getCurrentBasket();
    let metaDataObj = eswHelper.getMappedBasketMetadata(currentBasket);
    let checkoutExp = {
        'useDeliveryContactDetailsForPaymentContactDetails': !!eswHelper.isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled(),
        'emailMarketingOptIn': customer.profile && customer.profile.custom.eswMarketingOptIn ? customer.profile.custom.eswMarketingOptIn : false,
        'smsMarketingOptIn': customer.profile && customer.profile.custom.eswSMSMarketingOptIn ? customer.profile.custom.eswSMSMarketingOptIn : false,
        'registeredProfileId': customer.profile ? customer.profile.customerNo : null,
        'shopperCultureLanguageIso': !empty(shopperLocale) ? shopperLocale.replace(/[_]+/g, '-') : request.getHttpCookies()['esw.LanguageIsoCode'].value.replace(/[_]+/g, '-'),
        'expressPaymentMethod': null,
        'metadataItems': metaDataObj.metaDataArray,
        'registration': metaDataObj.registration,
        'sessionTimeout': eswHelper.getEswSessionTimeout()
    };
    return checkoutExp;
}
/**
 * Gets the delivery discounts.
 * @param {Object} cart - he cart object.
 * @param {Object} isConversionDisabled - Whether conversion is disabled.
 * @param {Object} localizeObj - The localization object.
 * @param {Object} conversionPrefs - The conversion preferences.
 * @returns {Object|null} - The delivery discounts object or null if the cart is empty.
 */
function getDeliveryDiscounts(cart, isConversionDisabled, localizeObj, conversionPrefs) {
    if (empty(cart)) return null;

    let priceFormat = eswHelper.getDeliveryDiscountsPriceFormat(cart, localizeObj, conversionPrefs);

    let beforeDiscount = (isConversionDisabled || cart.defaultShipment.shippingTotalNetPrice.value === 0)
        ? cart.defaultShipment.shippingTotalNetPrice.value
        : priceFormat;

    let ShippingDiscounts = [];
    let currencyCode = eswHelper.getDeliveryDiscountsCurrencyCode(localizeObj, session);
    let shippingPriceAdjustmentIter = cart.defaultShipment.shippingPriceAdjustments.iterator();

    if (localizeObj) localizeObj.applyRoundingModel = 'false';

    while (shippingPriceAdjustmentIter.hasNext()) {
        let shippingPriceAdjustment = shippingPriceAdjustmentIter.next();
        if (shippingPriceAdjustment.promotion && eswHelper.isThresholdEnabled(shippingPriceAdjustment.promotion)) {
            continue;
        }

        let shippingDiscountAmount = eswHelper.calculateShippingDiscountAmount(
            shippingPriceAdjustment,
            beforeDiscount,
            isConversionDisabled,
            localizeObj,
            conversionPrefs
        );

        let shippingDiscount = eswHelper.createShippingDiscount(
            shippingPriceAdjustment,
            shippingDiscountAmount,
            beforeDiscount,
            currencyCode,
            localizeObj,
            conversionPrefs
        );

        ShippingDiscounts.push(shippingDiscount);
        beforeDiscount -= shippingDiscount.discount.amount;
    }

    if (localizeObj) localizeObj.applyRoundingModel = 'true';

    let obj = {
        'ShippingDiscounts': ShippingDiscounts,
        'finalPrice': beforeDiscount
    };

    return obj;
}

module.exports = {
    getLineItemsV3: getLineItemsV3,
    getCartDiscountPriceInfo: getCartDiscountPriceInfo,
    getShopperCheckoutExperience: getShopperCheckoutExperience,
    getDeliveryDiscounts: getDeliveryDiscounts,
    convertPromotionMessage: convertPromotionMessage,
    getProductUnitPriceInfo: getProductUnitPriceInfo,
    getHeadlessCartDiscountamount: getHeadlessCartDiscountamount
};
