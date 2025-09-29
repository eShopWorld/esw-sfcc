/**
 * Helper script to get all ESW site preferences
 **/
const Transaction = require('dw/system/Transaction');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const formatMoney = require('dw/util/StringUtils').formatMoney;
const Money = require('dw/value/Money');

/*
 * Function to apply pricebook if country is override
 */
eswHelper.overridePrice = function (selectedCountry) {
    let logger = require('dw/system/Logger'),
        PriceBookMgr = require('dw/catalog/PriceBookMgr'),
        arrPricebooks = [],
        overridePricebooks = this.getOverridePriceBooks(selectedCountry);

    if (overridePricebooks.length > 0 && eswHelper.getSelectedCountryDetail(selectedCountry).isFixedPriceModel) {
        // eslint-disable-next-line array-callback-return
        overridePricebooks.map(function (pricebookId) {
            arrPricebooks.push(PriceBookMgr.getPriceBook(pricebookId));
        });
        try {
            PriceBookMgr.setApplicablePriceBooks(arrPricebooks);
            let priceBookCurrency = eswHelper.getPriceBookCurrency(overridePricebooks[0]);
            if (priceBookCurrency != null) {
                eswHelper.setBaseCurrencyPriceBook(priceBookCurrency);
            }
            if (request.httpCookies['esw.currency'] == null) {
                eswHelper.selectCountry(selectedCountry, priceBookCurrency, request.locale);
            } else {
                eswHelper.selectCountry(selectedCountry, request.httpCookies['esw.currency'].value, request.locale);
            }
        } catch (e) {
            logger.error('ESW Error overriding pricebook {0} {1}', e.message, e.stack);
        }
        return true;
    }
    return false;
};

/**
 * Check if product is restricted in current selected Country
 * @param {Object} prd - Product object
 * @return {boolean} - true/ false
 */
eswHelper.isProductRestricted = function (prd) {
    let currCountry = this.getAvailableCountry();
    let restrictedCountries = ('eswProductRestrictedCountries' in prd.custom && !!prd.custom.eswProductRestrictedCountries) ? prd.custom.eswProductRestrictedCountries : null;
    if (!empty(restrictedCountries)) {
        // eslint-disable-next-line no-restricted-syntax
        for (let con in restrictedCountries) {
            // eslint-disable-next-line eqeqeq
            if ((restrictedCountries[con].toLowerCase() == 'all' || restrictedCountries[con] == currCountry) && eswHelper.isESWSupportedCountry()) {
                return true;
            }
        }
    }
    return false;
};

/*
 * This function is used to rebuild cart on redirecting back to storefront from ESW Checkout for sitegenesis.
 */
eswHelper.rebuildCart = function () {
    let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
    // ESW fail order if order no is set in session
    if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) {
        if (session.privacy.orderNo && !empty(session.privacy.orderNo)) {
            eswServiceHelper.failOrder();
        }
    }
};

/**
 * Check if esw for order history totals
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @return {boolean} - true/false
 */
eswHelper.isEswOrderHistory = function (lineItemContainer) {
    if (Object.hasOwnProperty.call(lineItemContainer, 'orderNo')) {
        if (lineItemContainer.orderNo != null) {
            return true;
        }
    }
    return false;
};

/**
     * Function to rebuild basket from back to ESW checkout
     * @return {boolean} - boolean
     */
eswHelper.rebuildCartUponBackFromESW = function () {
    let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
    let BasketMgr = require('dw/order/BasketMgr');
    let orderID = session.privacy.confirmedOrderID;
    try {
        let currentBasket = BasketMgr.getCurrentBasket();
        if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) {
            if (orderID && eswHelper.isOrderPlaced(orderID)) {
                if (!empty(currentBasket)) {
                    Transaction.wrap(function () {
                        let coupons = currentBasket.getCouponLineItems();
                        let products = currentBasket.getAllProductLineItems();
                        if (!empty(coupons)) {
                            let couponsItr = coupons.iterator();
                            while (couponsItr.hasNext()) {
                                let coupon = couponsItr.next();
                                currentBasket.removeCouponLineItem(coupon);
                            }
                        }
                        if (!empty(products)) {
                            let productsItr = products.iterator();
                            while (productsItr.hasNext()) {
                                let product = productsItr.next();
                                currentBasket.removeProductLineItem(product);
                            }
                        }
                    });
                }
                if (empty(session.privacy.keepOrderIDForRegistration)) {
                    delete session.privacy.confirmedOrderID;
                }
                return true;
            }
            if (!currentBasket) {
                eswHelper.rebuildCart();
                currentBasket = BasketMgr.getCurrentBasket();
            }
            if (currentBasket) {
                // Apply orderride shipping method only when the shipping for basket is not setup for rest call this part will be skipped out
                if (empty(currentBasket.shipments[0].shippingMethodID)) {
                    Transaction.wrap(function () {
                        if (eswHelper.getShippingServiceType(currentBasket) === 'POST') {
                            eswServiceHelper.applyShippingMethod(currentBasket, 'POST', eswHelper.getAvailableCountry(), true);
                        } else {
                            eswServiceHelper.applyShippingMethod(currentBasket, 'EXP2', eswHelper.getAvailableCountry(), true);
                        }
                        eswHelper.adjustThresholdDiscounts(currentBasket);
                    });
                }
            }
        }
        return true;
    } catch (e) {
        return false;
    }
};

/*
 * Function is used to get Order total including shipping cost
 */
eswHelper.getOrderTotalWithShippingCost = function (totalShippingCost) {
    let BasketMgr = require('dw/order/BasketMgr');
    // eslint-disable-next-line no-mixed-operators
    return formatMoney(new Money(eswHelper.getFinalOrderTotalsObject().value + totalShippingCost.decimalValue - eswHelper.getShippingDiscount(BasketMgr.currentBasket), request.httpCookies['esw.currency'].value));
};
    /**
 * renders PackageJSON tracking information
 * @param {productLineItems} productLineItems - the current line items
 * @param {dw.order.LineItemCtnr} order - the current line item container
 * @return {Object|null} - object/null
 */
eswHelper.getEswPackageJSON = function (productLineItems, order) {
    let logger = require('dw/system/Logger'),
        collections = require('*/cartridge/scripts/util/collections'),
        eswPackageJSONProducts = [];
    try {
        if (eswHelper.isEswSplitShipmentEnabled() && ('eswPackageJSON' in order.custom && !empty(order.custom.eswPackageJSON))) {
            let eswPackageJSON = eswHelper.strToJson(order.custom.eswPackageJSON);
            collections.forEach(productLineItems, function (lineItem) {
                eswPackageJSON.forEach(function (item) {
                    if (lineItem.productID === item.productLineItem) {
                        eswPackageJSONProducts.push(item);
                    }
                });
            });
        }
        return eswPackageJSONProducts.length > 0 ? eswPackageJSONProducts : null;
    } catch (error) {
        logger.error('ESW Error fetchinh split package {0} {1}', error.message, error.stack);
    }
    return null;
};

module.exports = {
    getEswHelper: function () {
        return eswHelper;
    }
};
