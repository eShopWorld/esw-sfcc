/* eslint-disable eqeqeq */
/* eslint-disable no-unused-vars */
/* eslint-disable quote-props */
/**
 * Helper script to get all ESW site preferences
 **/
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
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
 * @returns {string} promotionMessageFinal - Converted message
 */
function convertPromotionMessage(promotionMessageString) {
    let promotionMessageFinal = null;
    try {
        let eswCalculationHelper = require('*/cartridge/scripts/helper/eswCalculationHelper').getEswCalculationHelper;
        let selectedCurrency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getDefaultCurrencyForCountry(eswHelper.getAvailableCountry());
        let storeFrontCurrencySymbol = Currency.getCurrency(selectedCurrency).symbol;
        let PromotionMessageWithoutHtml = promotionMessageString.replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, '');
        let selectedFxRate = eswHelper.strToJson(session.privacy.fxRate || null);
        if (empty(selectedFxRate) || (!empty(promotionMessageString) && promotionMessageString.indexOf('esw-price') === -1)) {
            return PromotionMessageWithoutHtml;
        }
        let enableRounding = eswHelper.isEswRoundingsEnabled();
        let disableRounding = !enableRounding && (promotionMessageString.indexOf('data-disable-rounding') !== -1);
        let msgDiscountPriceHtml = promotionMessageString.match(/<span class="esw-price"(.*?)>(.*?)<\/span>/gi);
        let discountPriceFromHtml = (!empty(msgDiscountPriceHtml) && msgDiscountPriceHtml.length > 0) ? msgDiscountPriceHtml[0].replace(/[^0-9.]+/gi, '') : 0;
        let discountCurrency = (!empty(msgDiscountPriceHtml) && msgDiscountPriceHtml.length > 0) ? msgDiscountPriceHtml[0].replace(/[0-9.]+/gi, '').replace(/<[^>]*[>$]|&nbsp;|&zwnj;|&raquo;|&laquo;|&gt;/g, '') : storeFrontCurrencySymbol;
        let eswPrice = eswCalculationHelper.getMoneyObject((!empty(discountPriceFromHtml)) ? Number(discountPriceFromHtml) : 0, false, disableRounding, false, null);
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
 * @returns {Object} - line item pricing info
 */
function getProductUnitPriceInfo(item) {
    try {
        let finalPrice = eswHelper.getMoneyObject(item.basePrice.value, false, false).value,
            itemDiscounts = [],
            currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
            liOrderDiscount,
            discountType,
            discountedAmount,
            productUnitPriceInfo;
        // Apply product level promotions
        // eslint-disable-next-line no-loop-func
        collections.forEach(item.priceAdjustments, function (priceAdjustment) {
            if (priceAdjustment.appliedDiscount.type === 'FIXED_PRICE') {
                discountedAmount = eswHelper.getMoneyObject(priceAdjustment.appliedDiscount.fixedPrice, false, false).value * priceAdjustment.quantity;
                if (priceAdjustment.quantity < item.quantity.value) {
                    discountedAmount += (item.quantity.value - priceAdjustment.quantity) * eswHelper.getMoneyObject(item.basePrice.value, false, false).value;
                }
                discountedAmount = (finalPrice - (discountedAmount / priceAdjustment.quantity));
            } else if (priceAdjustment.appliedDiscount.type === 'BONUS_CHOICE') {
                discountedAmount = (eswHelper.getMoneyObject((priceAdjustment.priceValue * -1), false, false, false).value / item.quantity.value);
            } else {
                discountedAmount = (eswHelper.getMoneyObject((priceAdjustment.priceValue * -1), false, false, true).value / item.quantity.value);
            }
            discountedAmount = discountedAmount.toFixed(3);
            finalPrice = finalPrice.toFixed(3);
            let itemDiscount = {
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
    }
    return null;
}

/**
 * function to get product unit price info
 * @param {Object} cart - productLineItem
 * @param {number} beforeDiscountParam - amount before discount
 * @returns {Object} - cart discount price info
 */
function getCartDiscountPriceInfo(cart, beforeDiscountParam) {
    try {
        let cartSubTotal = eswHelper.getSubtotalObject(cart, true),
            beforeDiscount = beforeDiscountParam,
            obj = {},
            cartDiscounts = [],
            currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
            allPriceAdjustmentIter = cart.priceAdjustments.iterator(),
            cartDiscount = {};
        while (allPriceAdjustmentIter.hasNext()) {
            let eachPriceAdjustment = allPriceAdjustmentIter.next();
            if (eachPriceAdjustment.promotion && eswHelper.isThresholdEnabled(eachPriceAdjustment.promotion)) {
                /* eslint-disable no-continue */
                continue;
            }
            let discountValue = eswHelper.getMoneyObject((eachPriceAdjustment.priceValue * -1), false, false, true).value;
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
 * @returns {Object} - cart items
 */
function getLineItemsV3() {
    let Transaction = require('dw/system/Transaction');
    let currentBasket = BasketMgr.currentBasket,
        lineItems = [],
        loopCtr = 1,
        currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
    let totalDiscount = eswHelper.getOrderDiscount(currentBasket).value,
        totalQuantity = 0,
        finalCartSubtotal = 0;

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

        // eslint-disable-next-line no-loop-func
        Transaction.wrap(function () {
            item.custom.eswLineItemId = loopCtr++;
        });
        let color,
            size,
            eswImageType;
        if (!empty(item.product)) {
            let productVariationModel = item.product.variationModel;
            color = productVariationModel.getProductVariationAttribute('color') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).displayValue : null;
            size = productVariationModel.getProductVariationAttribute('size') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size')).displayValue : null;
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
                'productUnitPriceInfo': getProductUnitPriceInfo(item),
                'imageUrl': !empty(eswImageType) ? item.product.getImage(eswImageType, 0).httpURL.toString() : '',
                'color': !empty(color) ? color : '',
                'size': !empty(size) ? size : '',
                'isNonStandardCatalogItem': false,
                'metadataItems': getProductLineMetadataItems(item),
                'isReturnProhibited': eswHelper.isReturnProhibited(item.product)
            },
            'cartGrouping': 'Group 1',
            'metadataItems': null
        };
        lineItems.push(cartItem);
        finalCartSubtotal += Number(cartItem.product.productUnitPriceInfo.price.amount * item.quantity.value);
    }
    return { lineItems: lineItems, finalCartSubtotal: finalCartSubtotal };
}

/**
 * function to get shopper checkout experience for version 3
 * @returns {Object} target object
 */
function getShopperCheckoutExperience() {
    let currentBasket = BasketMgr.getCurrentBasket();
    let metaDataObj = eswHelper.getMappedBasketMetadata(currentBasket);
    let checkoutExp = {
        'useDeliveryContactDetailsForPaymentContactDetails': !!eswHelper.isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled(),
        'emailMarketingOptIn': customer.profile && customer.profile.custom.eswMarketingOptIn ? customer.profile.custom.eswMarketingOptIn : false,
        'registeredProfileId': customer.profile ? customer.profile.customerNo : null,
        'shopperCultureLanguageIso': request.getHttpCookies()['esw.LanguageIsoCode'].value.replace(/[_]+/g, '-'),
        'expressPaymentMethod': null,
        'metadataItems': metaDataObj.metaDataArray,
        'registration': metaDataObj.registration,
        'sessionTimeout': eswHelper.getEswSessionTimeout()
    };
    return checkoutExp;
}
/**
 * function to get the delivery discounts.
 * @param {dw.basket} cart - DW Basket object
 * @param {boolean} isConversionDisabled - Boolean
 * @return {Object} Object - Discounts
 */
function getDeliveryDiscounts(cart, isConversionDisabled) {
    if (empty(cart)) {
        return null;
    }
    let beforeDiscount = (isConversionDisabled || cart.defaultShipment.shippingTotalNetPrice.value === 0) ? cart.defaultShipment.shippingTotalNetPrice.value : eswHelper.getMoneyObject(cart.defaultShipment.shippingTotalNetPrice.value, true, false, false).value,
        obj = {},
        ShippingDiscounts = [],
        currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
    let shippingPriceAdjustmentIter = cart.defaultShipment.shippingPriceAdjustments.iterator();
    let finalPrice = 0,
        shippingDiscountAmount = 0;
    while (shippingPriceAdjustmentIter.hasNext()) {
        let shippingPriceAdjustment = shippingPriceAdjustmentIter.next();
        if (shippingPriceAdjustment.promotion && eswHelper.isThresholdEnabled(shippingPriceAdjustment.promotion)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        if (shippingPriceAdjustment.appliedDiscount.type === dw.campaign.Discount.TYPE_FREE || (shippingPriceAdjustment.custom.thresholdDiscountType && shippingPriceAdjustment.custom.thresholdDiscountType === 'free')) {
            shippingDiscountAmount = beforeDiscount;
        } else if (shippingPriceAdjustment.appliedDiscount.type === 'FIXED_PRICE') {
            shippingDiscountAmount = (isConversionDisabled || shippingPriceAdjustment.priceValue === 0) ? shippingPriceAdjustment.appliedDiscount.fixedPrice : eswHelper.getMoneyObject(shippingPriceAdjustment.appliedDiscount.fixedPrice, true, false, false).value;
            shippingDiscountAmount = beforeDiscount - shippingDiscountAmount;
        } else {
            shippingDiscountAmount = (isConversionDisabled || shippingPriceAdjustment.priceValue === 0) ? shippingPriceAdjustment.priceValue * -1 : eswHelper.getMoneyObject(shippingPriceAdjustment.priceValue * -1, true, false, true).value;
        }
        let shippingDiscount = {
            'title': shippingPriceAdjustment.promotionID,
            'description': shippingPriceAdjustment.lineItemText,
            'discount': {
                'currency': currencyCode,
                'amount': shippingDiscountAmount.toFixed(3)
            },
            'beforeDiscount': {
                'currency': currencyCode,
                'amount': beforeDiscount.toFixed(3)
            }
        };
        ShippingDiscounts.push(shippingDiscount);
        beforeDiscount -= shippingDiscount.discount.amount;
    }
    obj = {
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
    getProductUnitPriceInfo: getProductUnitPriceInfo
};
