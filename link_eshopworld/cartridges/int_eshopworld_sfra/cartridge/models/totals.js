'use strict';

const formatMoney = require('dw/util/StringUtils').formatMoney;
const collections = require('*/cartridge/scripts/util/collections');
const HashMap = require('dw/util/HashMap');
const Template = require('dw/util/Template');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

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
            if (eswHelper.isEswNativeShippingHidden() && !eswHelper.isSelectedCountryOverrideShippingEnabled() && !Object.hasOwnProperty.call(lineItemContainer, 'orderNo')) {
                let isESWSupportedCountry = eswHelper.isESWSupportedCountry(),
                    orderHistoryFlag = false;
                if (Object.hasOwnProperty.call(lineItemContainer, 'orderNo')) {
                    orderHistoryFlag = true;
                }
                this.subTotal = (isESWSupportedCountry) ? formatMoney(eswHelper.getFinalOrderTotalsObject()) : getTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false));
                this.totalShippingCost = getTotals(lineItemContainer.shippingTotalPrice);
                this.totalTax = (isESWSupportedCountry && lineItemContainer.totalTax.available) ? formatMoney(new dw.value.Money(lineItemContainer.totalTax.decimalValue, request.getHttpCookies()['esw.currency'].value)) : getTotals(lineItemContainer.totalTax);
                // Exclude shipping cost from grand total
                let cartPageShippingCost = new dw.value.Money(0, request.getHttpCookies()['esw.currency'].value);
                this.grandTotal = (isESWSupportedCountry) ? eswHelper.getOrderTotalWithShippingCost(cartPageShippingCost) : getTotals(lineItemContainer.totalGrossPrice);
                if (!orderHistoryFlag) {
                    this.orderLevelDiscountTotal = eswHelper.getOrderLevelDiscountTotal(lineItemContainer, isESWSupportedCountry);
                    this.shippingLevelDiscountTotal = eswHelper.getShippingLevelDiscountTotal(lineItemContainer, isESWSupportedCountry);
                }
                if (isESWSupportedCountry) {
                    this.discounts = eswHelper.getDiscounts(lineItemContainer);
                    this.discountsHtml = getDiscountsHtml(this.discounts);
                }
            } else {
                let orderHistoryFlag = false,
                    eswShopperCurrencyCode = null,
                    eswTrackingNumber = null,
                    eswTrackingURL = null,
                    eswPaymentMethod,
                    transaction,
                    isESWSupportedCountry = eswHelper.isESWSupportedCountry(),
                    cartPageShippingCost = 0;
                if (Object.hasOwnProperty.call(lineItemContainer, 'orderNo')) {
                    if (lineItemContainer.orderNo != null) {
                        orderHistoryFlag = true;
                        eswShopperCurrencyCode = lineItemContainer.originalOrder.custom.eswShopperCurrencyCode;
                        eswTrackingNumber = ('eswPackageReference' in lineItemContainer.originalOrder.custom) ? lineItemContainer.originalOrder.custom.eswPackageReference : null;
                        eswTrackingURL = ('eswTrackingURL' in lineItemContainer.originalOrder.custom) ? lineItemContainer.originalOrder.custom.eswTrackingURL : null;
                        transaction = lineItemContainer.originalOrder.getPaymentTransaction();
                        if (!empty(transaction.custom.eswPaymentMethodCardBrand)) {
                            eswPaymentMethod = transaction.custom.eswPaymentMethodCardBrand;
                        } else if (!empty(lineItemContainer.originalOrder.custom.eswPaymentMethod)) {
                            eswPaymentMethod = lineItemContainer.originalOrder.custom.eswPaymentMethod;
                        }
                    }
                }
                this.eswTrackingNumber = eswTrackingNumber;
                this.eswTrackingURL = eswTrackingURL;
                this.eswPaymentMethod = eswHelper.isOrderDetailEnabled() ? eswPaymentMethod : null;

                if (!orderHistoryFlag) {
                    this.subTotal = (isESWSupportedCountry) ? formatMoney(eswHelper.getFinalOrderTotalsObject()) : getTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false));
                    cartPageShippingCost = getEswCartShippingCost(lineItemContainer.adjustedShippingTotalPrice);
                    this.totalShippingCost = (isESWSupportedCountry) ? formatMoney(cartPageShippingCost) : getTotals(lineItemContainer.adjustedShippingTotalPrice);
                } else if (eswHelper.isOrderDetailEnabled()) {
                    this.subTotal = (eswShopperCurrencyCode != null) ? getCalculatedSubTotal(lineItemContainer, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false).decimalValue, lineItemContainer.getCurrencyCode());
                    let shippingCost = getDiscountedAmount(lineItemContainer, 'beforeDiscount');
                    this.totalShippingCost = (eswShopperCurrencyCode != null) ? getOrderTotals(!empty(shippingCost) ? shippingCost : lineItemContainer.originalOrder.custom.eswShopperCurrencyDeliveryPriceInfo, eswShopperCurrencyCode) : eswHelper.getShippingLevelDiscountTotal(lineItemContainer, false);
                }
                if (this.totalShippingCost === '-') {
                    this.totalTax = '-';
                    this.grandTotal = '-';
                } else if (this.totalShippingCost !== '-') {
                    if (!orderHistoryFlag) {
                        this.grandTotal = (isESWSupportedCountry) ? eswHelper.getOrderTotalWithShippingCost(getEswCartShippingCost(lineItemContainer.shippingTotalPrice)) : getTotals(lineItemContainer.totalGrossPrice);
                        this.totalTax = (isESWSupportedCountry && lineItemContainer.totalTax.available) ? formatMoney(new dw.value.Money(lineItemContainer.totalTax.decimalValue, request.getHttpCookies()['esw.currency'].value)) : getTotals(lineItemContainer.totalTax);
                    } else if (eswHelper.isOrderDetailEnabled()) {
                        this.grandTotal = (eswShopperCurrencyCode != null) ? getOrderTotals(lineItemContainer.originalOrder.custom.eswShopperCurrencyPaymentAmount, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.totalGrossPrice.decimalValue, lineItemContainer.getCurrencyCode());
                        let eswTotalTax = 0;
                        if (!empty(lineItemContainer.totalTax.decimalValue) || !empty(lineItemContainer.originalOrder.custom.eswShopperCurrencyTaxes)) {
                            eswTotalTax = (!empty(lineItemContainer.originalOrder.custom.eswShopperCurrencyTaxes)) ? lineItemContainer.originalOrder.custom.eswShopperCurrencyTaxes : lineItemContainer.totalTax.decimalValue;
                        }
                        this.totalTax = (eswShopperCurrencyCode != null) ? getOrderTotals(eswTotalTax, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.totalTax.decimalValue, lineItemContainer.getCurrencyCode());
                    }
                }
                if (!orderHistoryFlag) {
                    this.orderLevelDiscountTotal = eswHelper.getOrderLevelDiscountTotal(lineItemContainer, isESWSupportedCountry);
                    this.shippingLevelDiscountTotal = eswHelper.getShippingLevelDiscountTotal(lineItemContainer, isESWSupportedCountry);
                } else if (eswHelper.isOrderDetailEnabled()) {
                    /* This Block handles order/ shipping discount for Account Order History (AOH) page
                    For now, not showing any order/ shipping discount on AOH when order is placed with ESW checkout.
                    Once order discount is distinct from product prices, (In Checkout v3)
                    replace null value with discounted amount (data type: Number) in getDiscountForAccountHistory method to display the order/ shipping discount on AOH */
                    this.orderLevelDiscountTotal = (eswShopperCurrencyCode != null) ? getDiscountForAccountHistory(lineItemContainer.custom.eswShopperCurrencyTotalOrderDiscount, eswShopperCurrencyCode) : eswHelper.getOrderLevelDiscountTotal(lineItemContainer, false);
                    let shippingLevelDiscount = getDiscountedAmount(lineItemContainer, 'discount');
                    this.shippingLevelDiscountTotal = (eswShopperCurrencyCode != null) ? getDiscountForAccountHistory(!empty(shippingLevelDiscount) ? shippingLevelDiscount : null, eswShopperCurrencyCode) : eswHelper.getShippingLevelDiscountTotal(lineItemContainer, false);
                }
                if (isESWSupportedCountry) {
                    this.discounts = eswHelper.getDiscounts(lineItemContainer);
                    this.discountsHtml = getDiscountsHtml(this.discounts);
                }
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
