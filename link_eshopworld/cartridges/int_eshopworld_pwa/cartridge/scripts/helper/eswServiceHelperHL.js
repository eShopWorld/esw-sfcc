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
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const collections = require('*/cartridge/scripts/util/collections');
const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const Discount = require('dw/campaign/Discount');

/**
 * function to get product unit price info
 * @param {Object} item - productLineItem
 * @param {Object} order - order object
 * @param {Object} localizeObj - localizeObj object
 * @param {Object} conversionPrefs - conversionPrefs object
 * @returns {Object} - line item pricing info
 */
function getProductUnitPriceInfo(item, order, localizeObj, conversionPrefs) {
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
        eswServiceHelperV3 = require('*/cartridge/scripts/helper/serviceHelperV3'),
        selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters),
        selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
    localizeObj.applyRoundingModel = selectedCountryLocalizeObj.applyRoundingModel.toString();
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
            localizeObj.applyRoundingModel = selectedCountryLocalizeObj.applyRoundingModel.toString();
            discountedAmount = pricingHelper.getConvertedPrice(priceAdjustment.appliedDiscount.fixedPrice, localizeObj, conversionPrefs) * item.quantity.value;
            localizeObj.applyRoundingModel = 'false';
            discountedAmount = (finalPrice - (discountedAmount / item.quantity.value)).toFixed(2);
        } else {
            discountedAmount = (pricingHelper.getConvertedPrice((priceAdjustment.priceValue * -1), localizeObj, conversionPrefs) / item.quantity.value).toFixed(2);
        }
        let itemDiscount = {
            'title': priceAdjustment.promotionID,
            'description': eswServiceHelperV3.convertPromotionMessage(priceAdjustment.lineItemText, selectedCountryDetail, selectedCountryLocalizeObj),
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
        if (allLineItems[i] instanceof dw.order.PriceAdjustment && allLineItems[i].appliedDiscount.type == Discount.TYPE_FREE) {
            discountType = Discount.TYPE_FREE;
        }
    }
    let orderLevelProratedDiscount = eswHelper.getOrderProratedDiscount(order);
    if (discountType == Discount.TYPE_FREE || (orderLevelProratedDiscount > 0 && item.proratedPrice.value < item.adjustedPrice.value)) {
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
 * function to get the delivery discounts.
 * @param {Object} cart - Cart
 * @param {Object} isConversionDisabled - Boolean
 * @param {Object} localizeObj - Object
 * @param {Object} conversionPrefs - Object
 * @return {Object} Object - Discounts
 */
function getDeliveryDiscounts(cart, isConversionDisabled, localizeObj, conversionPrefs) {
    let selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(localizeObj.localizeCountryObj.countryCode);
    let selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
    let beforeDiscount = (isConversionDisabled || cart.defaultShipment.shippingTotalNetPrice.value === 0) ? cart.defaultShipment.shippingTotalNetPrice.value : eswHelper.getMoneyObject(Number(cart.defaultShipment.shippingTotalNetPrice), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value,
        obj = {},
        currencyCode = localizeObj.localizeCountryObj.currencyCode,
        ShippingDiscounts = [];
    let shippingPriceAdjustmentIter = cart.defaultShipment.shippingPriceAdjustments.iterator();
    let finalPrice = 0,
        shippingDiscountAmount = 0;
    localizeObj.applyRoundingModel = 'false';
    while (shippingPriceAdjustmentIter.hasNext()) {
        let shippingPriceAdjustment = shippingPriceAdjustmentIter.next();
        if (shippingPriceAdjustment.promotion && eswHelper.isThresholdEnabled(shippingPriceAdjustment.promotion)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        if (shippingPriceAdjustment.appliedDiscount.type === Discount.TYPE_FREE || (shippingPriceAdjustment.custom.thresholdDiscountType && shippingPriceAdjustment.custom.thresholdDiscountType === 'free')) {
            shippingDiscountAmount = beforeDiscount;
        } else if (shippingPriceAdjustment.appliedDiscount.type === 'FIXED_PRICE') {
            localizeObj.applyRoundingModel = 'true';
            shippingDiscountAmount = (isConversionDisabled || shippingPriceAdjustment.priceValue === 0) ? shippingPriceAdjustment.appliedDiscount.fixedPrice : pricingHelper.getConvertedPrice(Number(shippingPriceAdjustment.appliedDiscount.fixedPrice), localizeObj, conversionPrefs);
            shippingDiscountAmount = beforeDiscount - shippingDiscountAmount;
            localizeObj.applyRoundingModel = 'false';
        } else {
            shippingDiscountAmount = (isConversionDisabled || shippingPriceAdjustment.priceValue === 0) ? shippingPriceAdjustment.priceValue * -1 : pricingHelper.getConvertedPrice(Number(shippingPriceAdjustment.priceValue * -1), localizeObj, conversionPrefs);
        }
        let shippingDiscount = {
            'title': shippingPriceAdjustment.promotionID,
            'description': shippingPriceAdjustment.lineItemText,
            'discount': {
                'currency': currencyCode,
                'amount': shippingDiscountAmount.toFixed(2)
            },
            'beforeDiscount': {
                'currency': currencyCode,
                'amount': beforeDiscount.toFixed(2)
            }
        };
        ShippingDiscounts.push(shippingDiscount);
        beforeDiscount -= shippingDiscount.discount.amount;
    }
    localizeObj.applyRoundingModel = 'true';
    obj = {
        'ShippingDiscounts': ShippingDiscounts,
        'finalPrice': beforeDiscount
    };

    return obj;
}

/**
 * function to get product unit price info
 * @param {Object} cart - productLineItem
 * @returns {Object} - cart discount price info
 */
function getCartDiscountPriceInfo(cart) {
    let cartSubTotal = eswHelper.getSubtotalObject(cart, true),
        beforeDiscount = cartSubTotal.value,
        obj = {},
        cartDiscounts = [],
        currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
        allPriceAdjustmentIter = cart.priceAdjustments.iterator(),
        cartDiscountTotal = 0;
    while (allPriceAdjustmentIter.hasNext()) {
        let eachPriceAdjustment = allPriceAdjustmentIter.next();
        if (eachPriceAdjustment.promotion && eswHelper.isThresholdEnabled(eachPriceAdjustment.promotion)) {
             /* eslint-disable no-continue */
            continue;
        }
        if ((eachPriceAdjustment.promotion && eachPriceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER) || eachPriceAdjustment.custom.thresholdDiscountType === 'order') {
            let cartDiscount = {
                'title': eachPriceAdjustment.promotionID,
                'description': eachPriceAdjustment.lineItemText,
                'discount': {
                    'currency': currencyCode,
                    'amount': eachPriceAdjustment.priceValue * -1
                },
                'beforeDiscount': {
                    'currency': currencyCode,
                    'amount': beforeDiscount
                }
            };
            cartDiscountTotal += eachPriceAdjustment.priceValue;
            cartDiscounts.push(cartDiscount);
            beforeDiscount -= eachPriceAdjustment.priceValue * -1;
        }
    }
    if (cartDiscounts.length > 0) {
        obj = {
            'price': {
                'currency': currencyCode,
                'amount': cartSubTotal.value - cartDiscountTotal
            },
            'discounts': cartDiscounts
        };
    }
    return obj;
}

module.exports = {
    getDeliveryDiscounts: getDeliveryDiscounts
};
