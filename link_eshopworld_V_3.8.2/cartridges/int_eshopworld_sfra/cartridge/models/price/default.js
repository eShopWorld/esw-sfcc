'use strict';

const base = module.superModule;
const formatMoney = require('dw/util/StringUtils').formatMoney;
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * Convert API price to an object
 * @param {dw.value.Money} price - Price object returned from the API
 * @returns {Object} price formatted as a simple object
 */
function toPriceModel(price) {
    let value = price.available ? price.getDecimalValue().get() : null;
    let currency = price.available ? price.getCurrencyCode() : null;
    let formattedPrice = price.available ? formatMoney(price) : null;
    let decimalPrice;

    if (formattedPrice) { decimalPrice = price.getDecimalValue().toString(); }

    return {
        value: value,
        currency: currency,
        formatted: (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) ? eswHelper.getMoneyObject(price, false) : formattedPrice,
        decimalPrice: (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) ? eswHelper.getMoneyObject(decimalPrice, false) : decimalPrice
    };
}

/**
 * @constructor
 * @classdesc Default price class
 * @param {dw.value.Money} salesPrice - Sales price
 * @param {dw.value.Money} listPrice - List price
 */
function DefaultPrice(salesPrice, listPrice) {
    base.call(this, salesPrice, listPrice);
    this.sales = toPriceModel(salesPrice);
    this.list = listPrice ? toPriceModel(listPrice) : null;
}

module.exports = DefaultPrice;
