const formatMoney = require('dw/util/StringUtils').formatMoney;
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
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
        let eswShopperCurrencyCode = 'originalOrder' in lineItemContainer ? lineItemContainer.originalOrder.custom.eswShopperCurrencyCode : null;
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
        orderTotalsObject.orderLevelDiscountTotal = (eswShopperCurrencyCode != null) ? getDiscountForAccountHistory(null, eswShopperCurrencyCode) : eswHelper.getOrderLevelDiscountTotal(lineItemContainer, false);
        orderTotalsObject.shippingLevelDiscountTotal = (eswShopperCurrencyCode != null) ? getDiscountForAccountHistory(null, eswShopperCurrencyCode) : eswHelper.getShippingLevelDiscountTotal(lineItemContainer, false);
        if (eswHelper.isESWSupportedCountry()) {
            orderTotalsObject.discounts = eswHelper.getDiscounts(lineItemContainer);
        }
        if (eswHelper.isEswNativeShippingHidden() && eswHelper.isSelectedCountryOverrideShippingEnabled()) {
            orderTotalsObject.cartPageShippingCost = eswHelper.isESWSupportedCountry() ? getEswCartShippingCost(lineItemContainer.adjustedShippingTotalPrice) : null;
            orderTotalsObject.grandTotal = eswHelper.getOrderTotalWithShippingCost(getEswCartShippingCost(lineItemContainer.shippingTotalPrice));
        }
    }
    return orderTotalsObject;
}

module.exports = {
    orderTotals: orderTotals
};

