const formatMoney = require('dw/util/StringUtils').formatMoney;
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const collections = require('*/cartridge/scripts/util/collections');

/**
 * get subtotal for calculated price model on order history.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @param {string} currency - currency of eswShopperCurrencyCode
 * @returns {string} the formatted money value
 */
function getCalculatedSubTotal(lineItemContainer, currency) {
    let subTotal = 0;
    collections.forEach(lineItemContainer.allProductLineItems, function (productLineItem) {
        subTotal += new Number((productLineItem.custom.eswShopperCurrencyItemPriceInfo * productLineItem.quantityValue)); // eslint-disable-line no-new-wrappers
    });
    return (!currency) ? '-' : formatMoney(new dw.value.Money(subTotal, currency));
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
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function orderTotals(lineItemContainer) {
    let orderTotalsObject = {
        subTotal: '-',
        grandTotal: '-',
        totalTax: '-',
        totalShippingCost: '-',
        orderLevelDiscountTotal: '-',
        shippingLevelDiscountTotal: '-',
        priceAdjustments: ''
    };
    if (lineItemContainer) {
        let eswShopperCurrencyCode = lineItemContainer.originalOrder.custom.eswShopperCurrencyCode;
        orderTotalsObject.subTotal = (eswShopperCurrencyCode != null) ? getCalculatedSubTotal(lineItemContainer, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false).decimalValue, lineItemContainer.getCurrencyCode());
        orderTotalsObject.totalShippingCost = (eswShopperCurrencyCode != null) ? getOrderTotals(lineItemContainer.originalOrder.custom.eswShopperCurrencyDeliveryPriceInfo, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.shippingTotalPrice.decimalValue, lineItemContainer.getCurrencyCode());

        if (orderTotalsObject.totalShippingCost === '-') {
            orderTotalsObject.totalTax = '-';
            orderTotalsObject.grandTotal = '-';
        } else if (orderTotalsObject.totalShippingCost !== '-') {
            orderTotalsObject.grandTotal = (eswShopperCurrencyCode != null) ? getOrderTotals(lineItemContainer.originalOrder.custom.eswShopperCurrencyPaymentAmount, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.totalGrossPrice.decimalValue, lineItemContainer.getCurrencyCode());
            orderTotalsObject.totalTax = (eswShopperCurrencyCode != null && !empty(lineItemContainer.originalOrder.custom.eswShopperCurrencyTaxes)) ? getOrderTotals(lineItemContainer.originalOrder.custom.eswShopperCurrencyTaxes, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.totalTax.decimalValue, lineItemContainer.getCurrencyCode());
        }
        /* This Block handles order/ shipping discount for Account Order History (AOH) page
    	   For now, not showing any order/ shipping discount on AOH when order is placed with ESW checkout.
    	   Once order discount is distinct from product prices, (In Checkout v3)
    	   replace null value with discounted amount (data type: Number) in getDiscountForAccountHistory method to display the order/ shipping discount on AOH */
        orderTotalsObject.orderLevelDiscountTotal = (eswShopperCurrencyCode != null) ? getDiscountForAccountHistory(null, eswShopperCurrencyCode) : getOrderLevelDiscountTotal(lineItemContainer, false);
        orderTotalsObject.shippingLevelDiscountTotal = (eswShopperCurrencyCode != null) ? getDiscountForAccountHistory(null, eswShopperCurrencyCode) : getShippingLevelDiscountTotal(lineItemContainer, false);
        if (eswHelper.isESWSupportedCountry()) {
            orderTotalsObject.discounts = getDiscounts(lineItemContainer);
        }
    }
    return orderTotalsObject;
}

module.exports = {
    orderTotals: orderTotals
};

