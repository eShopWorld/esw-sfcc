/**
 * Helper script to get all ESW site preferences
 **/

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Transaction = require('dw/system/Transaction');
const logger = require('dw/system/Logger');
const formatMoney = require('dw/util/StringUtils').formatMoney;
const collections = require('*/cartridge/scripts/util/collections');

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
    if (eswHelper.getSelectedCountryDetail(selectedCountry).isFixedPriceModel) {
        let PriceBookMgr = require('dw/catalog/PriceBookMgr'),
            overridePriceBooks = eswHelper.getOverridePriceBooks(selectedCountry),
            priceBookCurrency = selectedCurrency,
            arrPricebooks = [];
        if (overridePriceBooks.length > 0) {
            // eslint-disable-next-line array-callback-return
            overridePriceBooks.map(function (pricebookId) {
                let pBook = PriceBookMgr.getPriceBook(pricebookId);
                if (!empty(pBook)) {
                    arrPricebooks.push(pBook);
                }
            });
            try {
                PriceBookMgr.setApplicablePriceBooks(arrPricebooks);
                priceBookCurrency = eswHelper.getPriceBookCurrency(overridePriceBooks[0]);
                if (priceBookCurrency !== null) {
                    eswHelper.setBaseCurrencyPriceBook(req, priceBookCurrency);
                }
                if (request.httpCookies['esw.currency'] === null || typeof request.httpCookies['esw.currency'] === 'undefined' || typeof request.httpCookies['esw.currency'] === 'undefined') {
                    eswHelper.selectCountry(selectedCountry, priceBookCurrency, req.locale.id);
                } else {
                    eswHelper.selectCountry(selectedCountry, request.httpCookies['esw.currency'].value, req.locale.id);
                }
            } catch (e) {
                logger.error(e.message + e.stack);
            }
        }
        return true;
    }
    return false;
};

/*
 * Function is used to get Order total including shipping cost
 */
eswHelper.getOrderTotalWithShippingCost = function (totalShippingCost) {
    let BasketMgr = require('dw/order/BasketMgr');
    // eslint-disable-next-line no-mixed-operators
    return formatMoney(new dw.value.Money(eswHelper.getFinalOrderTotalsObject().value + totalShippingCost.decimalValue - eswHelper.getShippingDiscount(BasketMgr.currentBasket), request.httpCookies['esw.currency'].value));
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
 * @param {boolean} isCart - true/ false
 */
eswHelper.rebuildCart = function () {
    let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
    // ESW fail order if order no is set in session
    if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) {
        if (session.privacy.eswfail || !empty(session.privacy.orderNo)) { // eslint-disable-line no-undef
            eswServiceHelper.failOrder();
        }
    }
};

module.exports = {
    getEswHelper: function () {
        return eswHelper;
    }
};
