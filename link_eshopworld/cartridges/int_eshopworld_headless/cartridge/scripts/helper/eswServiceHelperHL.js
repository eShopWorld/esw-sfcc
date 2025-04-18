/* eslint-disable eqeqeq */
/* eslint-disable no-unused-vars */
/* eslint-disable quote-props */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/**
 * Helper script to get all ESW site preferences
 **/
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const collections = require('*/cartridge/scripts/util/collections');
const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');

/**
 * function to get product unit price info
 * @param {Object} item - productLineItem
 * @param {Object} order - order object
 * @param {Object} localizeObj - localizeObj object
 * @param {Object} conversionPrefs - conversionPrefs object
 * @returns {Object} - line item pricing info
 */
function getProductUnitPriceInfo(item, order, localizeObj, conversionPrefs) {
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
    localizeObj.applyRoundingModel = 'true';
    let finalPrice = pricingHelper.getConvertedPrice(item.basePrice.value, localizeObj, conversionPrefs) * item.quantity.value;
    localizeObj.applyRoundingModel = 'false';
    let itemDiscounts = [],
        currencyCode = localizeObj.localizeCountryObj.currencyCode,
        liOrderDiscount,
        discountType,
        discountedAmount,
        productUnitPriceInfo;
	// Apply product level promotions
	// eslint-disable-next-line no-loop-func
    collections.forEach(item.priceAdjustments, function (priceAdjustment) {
        finalPrice = (finalPrice / item.quantity.value).toFixed(2);
        if (priceAdjustment.appliedDiscount.type === 'FIXED_PRICE') {
            localizeObj.applyRoundingModel = 'true';
            discountedAmount = pricingHelper.getConvertedPrice(priceAdjustment.appliedDiscount.fixedPrice, localizeObj, conversionPrefs) * item.quantity.value;
            localizeObj.applyRoundingModel = 'false';
            discountedAmount = (finalPrice - (discountedAmount / item.quantity.value)).toFixed(2);
        } else {
            discountedAmount = (pricingHelper.getConvertedPrice((priceAdjustment.priceValue * -1), localizeObj, conversionPrefs) / item.quantity.value).toFixed(2);
        }
        let itemDiscount = {
            'title': priceAdjustment.promotionID,
            'description': priceAdjustment.lineItemText,
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
        finalPrice = (finalPrice * item.quantity.value).toFixed(2);
    });
	// Apply order level promotions or Buy X Get Y prorated price to qualifying line items
    let allLineItems = item.lineItemCtnr.allLineItems;
    for (let i = 0; i < allLineItems.length; i++) {
        if (allLineItems[i] instanceof dw.order.PriceAdjustment && allLineItems[i].appliedDiscount.type == dw.campaign.Discount.TYPE_FREE) {
            discountType = dw.campaign.Discount.TYPE_FREE;
        }
    }
    let orderLevelProratedDiscount = eswHelper.getOrderProratedDiscount(order);
    if (discountType == dw.campaign.Discount.TYPE_FREE || (orderLevelProratedDiscount > 0 && item.proratedPrice.value < item.adjustedPrice.value)) {
        liOrderDiscount = pricingHelper.getConvertedPrice(item.adjustedPrice.value, localizeObj, conversionPrefs) - pricingHelper.getConvertedPrice(item.proratedPrice.value, localizeObj, conversionPrefs);
        if (liOrderDiscount > 0) {
            finalPrice = (finalPrice / item.quantity.value).toFixed(2);
            let itemDiscount = {
                'title': 'OrderLevelDiscount',
                'description': 'Prorated Order discount',
                'discount': {
                    'currency': currencyCode,
                    'amount': (liOrderDiscount / item.quantity.value).toFixed(2)
                },
                'beforeDiscount': {
                    'currency': currencyCode,
                    'amount': finalPrice
                }
            };
            itemDiscounts.push(itemDiscount);
            finalPrice -= (liOrderDiscount / item.quantity.value).toFixed(2);
            finalPrice = (finalPrice * item.quantity.value).toFixed(2);
        }
    }

    finalPrice = (finalPrice / item.quantity.value).toFixed(2);
    if (item.bonusProductLineItem) {
        finalPrice = 0;
    }
    productUnitPriceInfo = {
        'price': {
            'currency': currencyCode,
            'amount': finalPrice
        },
        'discounts': itemDiscounts
    };
    return productUnitPriceInfo;
}
/**
 * function to get line items for version 3
 * @param {Object} order - Order API object
 * @param {string} countryCode - shopper's countryCode
 * @param {string} currencyCode - shopper's currencyCode
 * @returns {Object} - the cart items
 */
function getLineItemsV3(order, countryCode, currencyCode) {
    let lineItems = [],
        pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
        eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL'),
        totalQuantity = 0; // eslint-disable-line no-unused-vars

    let localizeObj = {
        localizeCountryObj: {
            countryCode: countryCode,
            currencyCode: currencyCode
        },
        applyCountryAdjustments: 'true',
        applyRoundingModel: 'true'
    };

    let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);
    let customizationHelper = require('*/cartridge/scripts/helper/customizationHelper');

    let totalDiscount = eswHelperHL.getOrderDiscountHL(order, localizeObj, conversionPrefs).value,
        remainingDiscount = totalDiscount; // eslint-disable-line no-unused-vars

    collections.forEach(order.productLineItems, function (item) {
        if (!item.bonusProductLineItem) {
            totalQuantity += item.quantity.value;
        }
    });

    for (let lineItemNumber in order.productLineItems) {
        let item = order.productLineItems[lineItemNumber];
        let productVariationModel = item.product.variationModel;
        let color = productVariationModel.getProductVariationAttribute('color') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).displayValue : null;
        let size = productVariationModel.getProductVariationAttribute('size') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size')).displayValue : null;
        let cartItem = {
            quantity: item.quantity.value,
            estimatedDeliveryDateFromRetailer: null,
            lineItemId: item.custom.eswLineItemId,
            product: {
                productCode: item.productID,
                upc: null,
                title: item.productName,
                description: item.productName,
                productUnitPriceInfo: getProductUnitPriceInfo(item, order, localizeObj, conversionPrefs),
                imageUrl: customizationHelper.getProductImage(item.product),
                productUrl: URLUtils.https('Product-Show', 'pid', item.product.ID).toString(),
                color: color,
                size: size,
                isNonStandardCatalogItem: false,
                metadataItems: eswHelperHL.getProductLineMetadataItems(item),
                isReturnProhibited: eswHelperHL.isReturnProhibited(item.productID, countryCode)
            },
            cartGrouping: 'Group 1',
            metadataItems: null
        };
        lineItems.push(cartItem);
    }
    return lineItems;
}

/**
 * function to get line items for version 2
 * @param {Object} order - Order API object
 * @param {string} countryCode - shopper's countryCode
 * @param {string} currencyCode - shopper's currencyCode
 * @returns {Object} - the cart items
 */
function getLineItemsV2(order, countryCode, currencyCode) {
    let lineItems = [],
        pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
        eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL'),
        totalQuantity = 0; // eslint-disable-line no-unused-vars

    let localizeObj = {
        localizeCountryObj: {
            countryCode: countryCode,
            currencyCode: currencyCode
        },
        applyCountryAdjustments: 'true',
        applyRoundingModel: 'true'
    };

    let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);
    let customizationHelper = require('*/cartridge/scripts/helper/customizationHelper');

    let totalDiscount = eswHelperHL.getOrderDiscountHL(order, localizeObj, conversionPrefs).value,
        remainingDiscount = totalDiscount; // eslint-disable-line no-unused-vars

    collections.forEach(order.productLineItems, function (item) {
        if (!item.bonusProductLineItem) {
            totalQuantity += item.quantity.value;
        }
    });

    for (let lineItemNumber in order.productLineItems) {
        let item = order.productLineItems[lineItemNumber];
        let beforeDiscount = eswHelper.getMoneyObject(item.basePrice.value, false, false).value * item.quantity.value,
            price = beforeDiscount,
            discountAmount;
        let productVariationModel = item.product.variationModel;
        let color = productVariationModel.getProductVariationAttribute('color') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).displayValue : null;
        let size = productVariationModel.getProductVariationAttribute('size') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size')).displayValue : null;

        // Apply product level promotions
        // eslint-disable-next-line no-loop-func
        collections.forEach(item.priceAdjustments, function (priceAdjustment) {
            if (priceAdjustment.appliedDiscount.type === 'FIXED_PRICE') {
                price = eswHelper.getMoneyObject(priceAdjustment.appliedDiscount.fixedPrice, false, false).value * priceAdjustment.quantity;
                if (priceAdjustment.quantity < item.quantity.value) {
                    price += (item.quantity.value - priceAdjustment.quantity) * eswHelper.getMoneyObject(item.basePrice.value, false, false).value;
                }
            } else {
                let adjustedUnitPrice = eswHelper.getMoneyObject(priceAdjustment.price, false, false, false).value;
                price -= (adjustedUnitPrice) * -1;
            }
        });
        price = (price / item.quantity.value).toFixed(3);
        discountAmount = (beforeDiscount - price).toFixed(3);
        if (item.bonusProductLineItem) {
            price = 0;
        }
        let cartItem = {
            quantity: item.quantity.value,
            estimatedDeliveryDate: null,
            lineItemId: item.custom.eswLineItemId,
            product: {
                productCode: item.productID,
                upc: null,
                title: item.productName,
                description: item.productName,
                shopperCurrencyProductPriceInfo: {
                    'price': currencyCode + price,
                    'discountAmount': currencyCode + discountAmount,
                    'beforeDiscount': currencyCode + beforeDiscount,
                    'discountPercentage': null
                },
                imageUrl: customizationHelper.getProductImage(item.product),
                color: color,
                size: size,
                isNonStandardCatalogItem: false,
                metadataItems: eswHelperHL.getProductLineMetadataItems(item),
                isReturnProhibited: eswHelperHL.isReturnProhibited(item.productID, countryCode)
            },
            cartGrouping: 'Group 1',
            metadataItems: null
        };
        lineItems.push(cartItem);
    }
    return lineItems;
}

/**
 * function to get shopper checkout experience for version 3
 * @param {string} shopperLocale - shopper locale
 * @returns {Object} target object
 */
function getShopperCheckoutExperience(shopperLocale) {
    let checkoutExp = {
        useDeliveryContactDetailsForPaymentContactDetails: eswHelper.isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled(),
        emailMarketingOptIn: false,
        registeredProfileId: customer.profile ? customer.profile.customerNo : null,
        customerNumber: customer.profile ? customer.profile.customerNo : null,
        shopperCultureLanguageIso: shopperLocale.replace(/[_]+/g, '-'),
        expressPaymentMethod: null,
        metadataItems: null,
        'sessionTimeout': eswHelper.getEswSessionTimeout()
    };
    return checkoutExp;
}
module.exports = {
    getLineItemsV3: getLineItemsV3,
    getShopperCheckoutExperience: getShopperCheckoutExperience,
    getLineItemsV2: getLineItemsV2
};
