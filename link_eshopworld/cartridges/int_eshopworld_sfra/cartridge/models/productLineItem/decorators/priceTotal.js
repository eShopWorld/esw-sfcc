'use strict';

const formatMoney = require('dw/util/StringUtils').formatMoney;
const Money = require('dw/value').Money;

const collections = require('*/cartridge/scripts/util/collections');
const renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
const eswHelper = require('*/cartridge/scripts/helper/eswSFRAHelper');
/**
 * get the total price for the product line item
 * @param {dw.order.ProductLineItem} lineItem - API ProductLineItem instance
 * @returns {Object} an object containing the product line item total info.
 */
function getTotalPrice(lineItem) {
    let context;
    let price;
    let result = {};
    let template = 'checkout/productCard/productCardProductRenderedTotalPrice';
    let orderHistoryFlag = false;
    let eswShopperCurrencyCode = null;
    let eswModuleEnabled = eswHelper.getEShopWorldModuleEnabled();
    if (lineItem.lineItemCtnr && Object.hasOwnProperty.call(lineItem.lineItemCtnr, 'orderNo')) {
        if (lineItem.lineItemCtnr.orderNo != null) {
            orderHistoryFlag = true;
            eswShopperCurrencyCode = lineItem.lineItemCtnr.originalOrder.custom.eswShopperCurrencyCode;
        }
    }
    if (lineItem.priceAdjustments.getLength() > 0) {
        if (orderHistoryFlag) {
            result.nonAdjustedPrice = (eswShopperCurrencyCode != null) ? new Money(Number(lineItem.custom.eswUnitPrice * lineItem.quantity.value), eswShopperCurrencyCode) : lineItem.getPrice();
        } else {
            let nonAdjustedPrice = (eswModuleEnabled) ? eswHelper.getMoneyObject(lineItem.basePrice, false, false).value * lineItem.quantity.value : lineItem.getPrice();
            result.nonAdjustedPrice = (eswModuleEnabled) ? new Money(nonAdjustedPrice, eswHelper.getCurrentEswCurrencyCode()) : nonAdjustedPrice;
        }
    }
    // If not for order history calculations
    if (!orderHistoryFlag) {
        price = lineItem.adjustedPrice;
        // The platform does not include prices for selected option values in a line item product's
        // price by default.  So, we must add the option price to get the correct line item total price.
        collections.forEach(lineItem.optionProductLineItems, function (item) {
            price = price.add(item.adjustedPrice);
        });
        if (lineItem.quantityValue !== 1) {
            result.price = (eswModuleEnabled) ? formatMoney(eswHelper.getSubtotalObject(lineItem, false)) : formatMoney(price);
        } else {
            result.price = (eswModuleEnabled) ? formatMoney(eswHelper.getUnitPriceCost(lineItem)) : formatMoney(price);
        }
    } else if (orderHistoryFlag) {
        // If order placed using calculated price model
        if (eswShopperCurrencyCode != null) {
            price = new Number((lineItem.custom.eswShopperCurrencyItemPriceInfo * lineItem.quantityValue)); // eslint-disable-line no-new-wrappers
            result.price = formatMoney(new dw.value.Money(price, eswShopperCurrencyCode));
        } else {
            price = lineItem.adjustedPrice;
            // The platform does not include prices for selected option values in a line item product's
            // price by default.  So, we must add the option price to get the correct line item total price.
            collections.forEach(lineItem.optionProductLineItems, function (item) {
                price = price.add(item.adjustedPrice);
            });
            result.price = formatMoney(price);
        }
    }
    context = { lineItem: { priceTotal: result } };

    result.renderedPrice = renderTemplateHelper.getRenderedHtml(context, template);

    return result;
}


module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'priceTotal', {
        enumerable: true,
        value: getTotalPrice(lineItem)
    });
};
