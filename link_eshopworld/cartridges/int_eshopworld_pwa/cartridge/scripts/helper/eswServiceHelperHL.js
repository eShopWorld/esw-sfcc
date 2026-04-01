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
        selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters),
        selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);
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
module.exports = {};
