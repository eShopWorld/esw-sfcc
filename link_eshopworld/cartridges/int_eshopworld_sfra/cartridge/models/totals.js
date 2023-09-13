'use strict';

const formatMoney = require('dw/util/StringUtils').formatMoney;
const collections = require('*/cartridge/scripts/util/collections');
const HashMap = require('dw/util/HashMap');
const Template = require('dw/util/Template');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

const base = module.superModule;

/**
 * Accepts a total object and formats the value
 * @param {dw.value.Money} total - Total price of the cart
 * @returns {string} the formatted money value
 */
function getTotals(total) {
    return !total.available ? '-' : formatMoney(total);
}

/**
 * Accepts a total object and formats the value for order history
 * @param {dw.value.Money} total - Total price of the cart
 * @param {string} currency - currency of eswShopperCurrencyCode
 * @returns {string} the formatted money value
 */
function getOrderTotals(total, currency) {
    if (!empty(total) && currency) {
        return formatMoney(new dw.value.Money(total, currency));
    }
    return '-';
}

/**
 * Gets the order discount amount by subtracting the basket's total including the discount from
 *      the basket's total excluding the order discount.
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @param {boolean} isESWSupportedCountry - flag to check if current country isESWSupportedCountry
 * @returns {Object} an object that contains the value and formatted value of the order discount
 */
function getOrderLevelDiscountTotal(lineItemContainer, isESWSupportedCountry) {
    let totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
    let totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
    let orderDiscount = isESWSupportedCountry ? eswHelper.getOrderDiscount(lineItemContainer) : totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);

    return {
        value: orderDiscount.value,
        formatted: formatMoney(orderDiscount)
    };
}

/**
 * Gets the shipping discount total by subtracting the adjusted shipping total from the
 *      shipping total price
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @param {boolean} isESWSupportedCountry - flag to check if current country isESWSupportedCountry
 * @returns {Object} an object that contains the value and formatted value of the shipping discount
 */
function getShippingLevelDiscountTotal(lineItemContainer, isESWSupportedCountry) {
    let totalExcludingShippingDiscount = lineItemContainer.shippingTotalPrice;
    let totalIncludingShippingDiscount = lineItemContainer.adjustedShippingTotalPrice;
    let shippingDiscount = isESWSupportedCountry ? eswHelper.getShippingDiscount(lineItemContainer) : totalExcludingShippingDiscount.subtract(totalIncludingShippingDiscount);

    return {
        value: shippingDiscount.value,
        formatted: formatMoney(shippingDiscount)
    };
}

/**
 * Adds discounts to a discounts object
 * @param {dw.util.Collection} collection - a collection of price adjustments
 * @param {Object} discounts - an object of price adjustments
 * @param {boolean} isShippingDiscount - discount type is shipping?
 * @returns {Object} an object of price adjustments
 */
function createDiscountObject(collection, discounts, isShippingDiscount) {
    let result = discounts;
    collections.forEach(collection, function (item) {
        if (!item.basedOnCoupon) {
            // convert price to shopper currency if it is shipping discount,
            // if it is order/ product discount then, don't convert price on amount off type of discount.
            let itemPrice = isShippingDiscount ? eswHelper.getMoneyObject(item.price, true, false, true) : (item.appliedDiscount.type === dw.campaign.Discount.TYPE_AMOUNT) ? new dw.value.Money(item.price.value, eswHelper.getCurrentEswCurrencyCode()) : eswHelper.getMoneyObject(item.price, false, false, true); // eslint-disable-line no-nested-ternary
            result[item.UUID] = {
                UUID: item.UUID,
                lineItemText: item.lineItemText,
                price: formatMoney(itemPrice),
                type: 'promotion',
                callOutMsg: (typeof item.promotion !== 'undefined' && item.promotion !== null) ? item.promotion.calloutMsg : ''
            };
        }
    });

    return result;
}

/**
 * creates an array of discounts.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Array} an array of objects containing promotion and coupon information
 */
function getDiscounts(lineItemContainer) {
    let discounts = {};

    collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
        let priceAdjustments = collections.map(
            couponLineItem.priceAdjustments,
            function (priceAdjustment) {
                return { callOutMsg: (typeof priceAdjustment.promotion !== 'undefined' && priceAdjustment.promotion !== null) ? priceAdjustment.promotion.calloutMsg : '' };
            });
        discounts[couponLineItem.UUID] = {
            type: 'coupon',
            UUID: couponLineItem.UUID,
            couponCode: couponLineItem.couponCode,
            applied: couponLineItem.applied,
            valid: couponLineItem.valid,
            relationship: priceAdjustments
        };
    });

    discounts = createDiscountObject(lineItemContainer.priceAdjustments, discounts, false);
    discounts = createDiscountObject(lineItemContainer.allShippingPriceAdjustments, discounts, true);

    return Object.keys(discounts).map(function (key) {
        return discounts[key];
    });
}

/**
 * create the discount results html
 * @param {Array} discounts - an array of objects that contains coupon and priceAdjustment
 * information
 * @returns {string} The rendered HTML
 */
function getDiscountsHtml(discounts) {
    let context = new HashMap();
    let object = {
        totals: {
            discounts: discounts
        }
    };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    let template = new Template('cart/cartCouponDisplay');
    return template.render(context).text;
}

/**
 * get subtotal for calculated price model on order history.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @param {string} currency - currency of eswShopperCurrencyCode
 * @returns {string} the formatted money value
 */
function getCalculatedSubTotal(lineItemContainer, currency) {
    let subTotal = 0;
    collections.forEach(lineItemContainer.allProductLineItems, function (productLineItem) {
        subTotal += Number((productLineItem.custom.eswShopperCurrencyItemPriceInfo * productLineItem.quantityValue));
    });
    return (!currency) ? '-' : formatMoney(new dw.value.Money(subTotal, currency));
}

/**
 * Get Order/ Shipping level discounts for Account Order History
 * From originalOrder (ESW Orders) custom attributes
 * @param {number} discountAmount - Order/ Shipping discount Amount
 * @param {string} currency - currency of eswShopperCurrencyCode
 * @returns {Object} discountObj - discount object
 */
function getDiscountForAccountHistory(discountAmount, currency) {
    let discountObj = {
        value: 0,
        formatted: formatMoney(new dw.value.Money(0, currency))
    };
    if (!empty(discountAmount) && !empty(currency)) {
        discountObj.value = discountAmount;
        discountObj.formatted = formatMoney(new dw.value.Money(discountAmount, currency));
    }
    return discountObj;
}

/**
 * Get Cart Page Converted ESW shipping cost
 * @param {dw.value.Money} shippingCost - Total shipping cost
 * @returns {dw.value.Money} convertedShippingCost - Converted Shipping Cost
 */
function getEswCartShippingCost(shippingCost) {
    if (!eswHelper.isShippingCostConversionEnabled()) {
        return new dw.value.Money(shippingCost.decimalValue, request.getHttpCookies()['esw.currency'].value);
    }
    return eswHelper.getMoneyObject(shippingCost, true, false, false);
}

/**
 * Get Cart Page Converted ESW shipping cost
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @param {string} type - shipping discount type
 * @returns {number} convertedShippingCost - Converted Shipping Cost
 */
function getDiscountedAmount(lineItemContainer, type) {
    let result = null;
    if ('eswShopperCurrencyDeliveryDiscountsInfo' in lineItemContainer.originalOrder.custom &&
    !empty(lineItemContainer.originalOrder.custom.eswShopperCurrencyDeliveryDiscountsInfo)) {
        let deliveryDiscounts = JSON.parse(lineItemContainer.originalOrder.custom.eswShopperCurrencyDeliveryDiscountsInfo);
        try {
            if (deliveryDiscounts && !empty(deliveryDiscounts.deliveryOptionPriceInfo) &&
                !empty(deliveryDiscounts.deliveryOptionPriceInfo.discounts)) {
                for (let i = 0; i <= deliveryDiscounts.deliveryOptionPriceInfo.discounts.length; i++) {
                    if (!empty(deliveryDiscounts.deliveryOptionPriceInfo.discounts[i])) {
                        let discounts = deliveryDiscounts.deliveryOptionPriceInfo.discounts[i];
                        if (type === 'discount' && !empty(discounts.discount) && !empty(discounts.discount.shopper)) {
                            result = Number(discounts.discount.shopper.substring(3));
                            break;
                        } else if (type === 'beforeDiscount' && !empty(discounts.beforeDiscount) && !empty(discounts.beforeDiscount.shopper)) {
                            result = Number(discounts.beforeDiscount.shopper.substring(3));
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            result = null;
        }
    }
    return result;
}

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);

    if (eswHelper.getEShopWorldModuleEnabled()) {
        if (lineItemContainer) {
            let orderHistoryFlag = false,
                eswShopperCurrencyCode = null,
                eswTrackingNumber = null,
                isESWSupportedCountry = eswHelper.isESWSupportedCountry(),
                cartPageShippingCost = 0;
            if (Object.hasOwnProperty.call(lineItemContainer, 'orderNo')) {
                if (lineItemContainer.orderNo != null) {
                    orderHistoryFlag = true;
                    eswShopperCurrencyCode = lineItemContainer.originalOrder.custom.eswShopperCurrencyCode;
                    eswTrackingNumber = ('eswPackageReference' in lineItemContainer.originalOrder.custom) ? lineItemContainer.originalOrder.custom.eswPackageReference : null;
                }
            }
            this.eswTrackingNumber = eswTrackingNumber;
            if (!orderHistoryFlag) {
                this.subTotal = (isESWSupportedCountry) ? formatMoney(eswHelper.getFinalOrderTotalsObject()) : getTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false));
                cartPageShippingCost = getEswCartShippingCost(lineItemContainer.shippingTotalPrice);
                this.totalShippingCost = (isESWSupportedCountry) ? formatMoney(cartPageShippingCost) : getTotals(lineItemContainer.shippingTotalPrice);
            } else {
                this.subTotal = (eswShopperCurrencyCode != null) ? getCalculatedSubTotal(lineItemContainer, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false).decimalValue, lineItemContainer.getCurrencyCode());
                let shippingCost = getDiscountedAmount(lineItemContainer, 'beforeDiscount');
                this.totalShippingCost = (eswShopperCurrencyCode != null) ? getOrderTotals(!empty(shippingCost) ? shippingCost : lineItemContainer.originalOrder.custom.eswShopperCurrencyDeliveryPriceInfo, eswShopperCurrencyCode) : getShippingLevelDiscountTotal(lineItemContainer, false);
            }
            if (this.totalShippingCost === '-') {
                this.totalTax = '-';
                this.grandTotal = '-';
            } else if (this.totalShippingCost !== '-') {
                if (!orderHistoryFlag) {
                    this.grandTotal = (isESWSupportedCountry) ? eswHelper.getOrderTotalWithShippingCost(cartPageShippingCost) : getTotals(lineItemContainer.totalGrossPrice);
                    this.totalTax = (isESWSupportedCountry && lineItemContainer.totalTax.available) ? formatMoney(new dw.value.Money(lineItemContainer.totalTax.decimalValue, request.getHttpCookies()['esw.currency'].value)) : getTotals(lineItemContainer.totalTax);
                } else {
                    this.grandTotal = (eswShopperCurrencyCode != null) ? getOrderTotals(lineItemContainer.originalOrder.custom.eswShopperCurrencyPaymentAmount, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.totalGrossPrice.decimalValue, lineItemContainer.getCurrencyCode());
                    let eswTotalTax = 0;
                    if (!empty(lineItemContainer.totalTax.decimalValue) || !empty(lineItemContainer.originalOrder.custom.eswShopperCurrencyTaxes)) {
                        eswTotalTax = (!empty(lineItemContainer.originalOrder.custom.eswShopperCurrencyTaxes)) ? lineItemContainer.originalOrder.custom.eswShopperCurrencyTaxes : lineItemContainer.totalTax.decimalValue;
                    }
                    this.totalTax = (eswShopperCurrencyCode != null) ? getOrderTotals(eswTotalTax, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.totalTax.decimalValue, lineItemContainer.getCurrencyCode());
                }
            }
            if (!orderHistoryFlag) {
                this.orderLevelDiscountTotal = getOrderLevelDiscountTotal(lineItemContainer, isESWSupportedCountry);
                this.shippingLevelDiscountTotal = getShippingLevelDiscountTotal(lineItemContainer, isESWSupportedCountry);
            } else {
                /* This Block handles order/ shipping discount for Account Order History (AOH) page
                   For now, not showing any order/ shipping discount on AOH when order is placed with ESW checkout.
                   Once order discount is distinct from product prices, (In Checkout v3)
                   replace null value with discounted amount (data type: Number) in getDiscountForAccountHistory method to display the order/ shipping discount on AOH */
                this.orderLevelDiscountTotal = (eswShopperCurrencyCode != null) ? getDiscountForAccountHistory(lineItemContainer.custom.eswShopperCurrencyTotalOrderDiscount, eswShopperCurrencyCode) : getOrderLevelDiscountTotal(lineItemContainer, false);
                let shippingLevelDiscount = getDiscountedAmount(lineItemContainer, 'discount');
                this.shippingLevelDiscountTotal = (eswShopperCurrencyCode != null) ? getDiscountForAccountHistory(!empty(shippingLevelDiscount) ? shippingLevelDiscount : null, eswShopperCurrencyCode) : getShippingLevelDiscountTotal(lineItemContainer, false);
            }
            if (isESWSupportedCountry) {
                this.discounts = getDiscounts(lineItemContainer);
                this.discountsHtml = getDiscountsHtml(this.discounts);
            }
        } else {
            this.subTotal = '-';
            this.grandTotal = '-';
            this.totalTax = '-';
            this.totalShippingCost = '-';
            this.orderLevelDiscountTotal = '-';
            this.shippingLevelDiscountTotal = '-';
            this.priceAdjustments = null;
        }
    }
}

module.exports = totals;
