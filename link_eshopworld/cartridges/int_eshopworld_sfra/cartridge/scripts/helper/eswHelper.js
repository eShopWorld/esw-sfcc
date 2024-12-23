/**
 * Helper script to get all ESW site preferences
 **/

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Transaction = require('dw/system/Transaction');
const formatMoney = require('dw/util/StringUtils').formatMoney;
const collections = require('*/cartridge/scripts/util/collections');
const Money = require('dw/value/Money');

/*
 * Function that is used to set the pricebook and update session currency
 */
eswHelper.setBaseCurrencyPriceBook = function (req, currencyCode) {
    let Currency = require('dw/util/Currency');
    let BasketMgr = require('dw/order/BasketMgr');
    let HookMgr = require('dw/system/HookMgr');
    let currentBasket = BasketMgr.getCurrentOrNewBasket();
    let currency = Currency.getCurrency(currencyCode);

    Transaction.wrap(function () {
        req.session.setCurrency(currency);
        // if (!empty(currentBasket.productLineItems)) {
        currentBasket.updateCurrency();
        HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
        //  }
    });
};
/*
 * Function is used to set default currency locale from given country
 */
eswHelper.setDefaultCurrencyLocal = function (req, foundCountry) {
    let Site = require('dw/system/Site');
    let language;
    if (empty(foundCountry)) { // eslint-disable-line no-undef
        eswHelper.setAllAvailablePriceBooks();
        eswHelper.setBaseCurrencyPriceBook(req, eswHelper.getBaseCurrencyPreference());
        eswHelper.createCookie('esw.currency', session.getCurrency(), '/');
        eswHelper.createCookie('esw.LanguageIsoCode', Site.getCurrent().getDefaultLocale(), '/');
        req.setLocale(Site.getCurrent().getDefaultLocale());
        language = Site.getCurrent().getDefaultLocale();
    }
    return language;
};
/*
 * Function is used to get override country from given country and currency
 */
eswHelper.getOverrideCountry = function (selectedCountry, selectedCurrency) {
    let overrideCountries = null;
    let overrideCountry = [];
    let overridePricebooks = this.getOverridePriceBook();

    if (overridePricebooks.length > 0) {
        overrideCountries = JSON.parse(overridePricebooks).filter(function (item) {
            return item.countryCode === selectedCountry;
        });
        if (!empty(overrideCountries)) { // eslint-disable-line no-undef
            if ((!request.httpCookies['esw.location'] && selectedCurrency) || (request.httpCookies['esw.location'] && selectedCountry === request.httpCookies['esw.location'].value)) {
                overrideCountry = overrideCountries.filter(function (item) {
                    return item.currencyCode === selectedCurrency;
                });
                if (empty(overrideCountry)) {
                    overrideCountry.push(overrideCountries[0]);
                }
            } else {
                overrideCountry.push(overrideCountries[0]);
                if (request.httpCookies['esw.currency'] && selectedCurrency !== request.httpCookies['esw.currency'].value) {
                    overrideCountry = overrideCountries.filter(function (item) {
                        return item.currencyCode === selectedCurrency;
                    });
                }
            }
        }
    }
    return overrideCountry;
};
/*
 * Function to apply pricebook if country is override country
 */
eswHelper.overridePrice = function (req, selectedCountry, selectedCurrency) {
    return eswHelper.overridePriceCore(req, selectedCountry, selectedCurrency);
};

/*
 * Function is used to get Order total including shipping cost
 */
eswHelper.getOrderTotalWithShippingCost = function (totalShippingCost) {
    let BasketMgr = require('dw/order/BasketMgr');
    // eslint-disable-next-line no-mixed-operators
    return formatMoney(new Money(eswHelper.getFinalOrderTotalsObject().value + totalShippingCost.decimalValue - eswHelper.getShippingDiscount(BasketMgr.currentBasket), request.httpCookies['esw.currency'].value));
};

/*
 * FUnction is used to return matching line item from current basket
 */
eswHelper.getMatchingLineItem = function (lineItem) {
    let currentBasket = dw.order.BasketMgr.getCurrentBasket();
    let matchingLineItem;
    if (currentBasket != null) {
        matchingLineItem = collections.find(currentBasket.productLineItems, function (item) {
            return item.productID === lineItem.id && item.UUID === lineItem.UUID;
        });
    }
    return matchingLineItem;
};

/*
 * FUnction is used to return matching line item from current basket Using UUID
 */
eswHelper.getMatchingLineItemWithID = function (lineItemID, lineItemUUID) {
    let currentBasket = dw.order.BasketMgr.getCurrentBasket();
    let matchingLineItem;
    if (currentBasket != null) {
        matchingLineItem = collections.find(currentBasket.productLineItems, function (item) {
            return item.productID === lineItemID && item.UUID === lineItemUUID;
        });
    }
    return matchingLineItem;
};

/**
 * Check if product is restricted in current selected Country
 * @param {Object} prdCustomAttr - Product object
 * @return {boolean} - true/ false
 */
eswHelper.isProductRestricted = function (prdCustomAttr) {
    let currCountry = this.getAvailableCountry();
    let restrictedCountries = 'eswProductRestrictedCountries' in prdCustomAttr && !!prdCustomAttr.eswProductRestrictedCountries ? prdCustomAttr.eswProductRestrictedCountries : null;
    if (!empty(restrictedCountries)) {
        // eslint-disable-next-line no-restricted-syntax
        for (let con in restrictedCountries) {
            if ((restrictedCountries[con].toLowerCase() === 'all' || restrictedCountries[con] === currCountry) && eswHelper.isESWSupportedCountry()) {
                return true;
            }
        }
    }
    return false;
};


/**
 * This function is used to rebuild cart on redirecting back to store front from ESW Checkout for SFRA.
 * @param {string|null} orderId - order id
 */
eswHelper.rebuildCart = function (orderId) {
    let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
    // ESW fail order if order no is set in session
    if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) {
        if ((!empty(orderId)) || session.privacy.eswfail || !empty(session.privacy.orderNo)) { // eslint-disable-line no-undef
            eswServiceHelper.failOrder(orderId);
        }
    }
};

/**
 * This function is used to rebuild cart on redirecting back to store front from ESW Checkout for SFRA.
 * @param {request} req - req
 */
eswHelper.setEnableMultipleFxRatesCurrency = function (req) {
    let country = eswHelper.getAvailableCountry();
    if (eswHelper.checkIsEswAllowedCountry(country)) {
        if (!eswHelper.overridePrice(req, country)) {
            eswHelper.setBaseCurrencyPriceBook(req, eswHelper.getBaseCurrencyPreference());
        }
    }
};

module.exports = {
    getEswHelper: function () {
        return eswHelper;
    }
};
