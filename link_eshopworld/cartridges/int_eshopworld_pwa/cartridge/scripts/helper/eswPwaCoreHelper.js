'use strict';

const ArrayList = require('dw/util/ArrayList');
const Site = require('dw/system/Site').getCurrent();

const ContentMgr = require('dw/content/ContentMgr');
const Resource = require('dw/web/Resource');

const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswPricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
const eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
const eswTimeZoneHelper = require('*/cartridge/scripts/helper/eswTimeZoneHelper');

const PwaCoreHelper = {
    /**
     * get country part from locale
     * @param {*} locale - country locale, eg: en-IE, IE
     * @returns {string} - country code from locale
     */
    getLocaleCountry: function (locale) {
        let countryCode = locale;
        if (locale.indexOf('-') !== -1) {
            let localeArr = locale.split('-');
            if (localeArr.length > 1) {
                countryCode = localeArr[1];
            }
        }
        return countryCode;
    },
    getPwaUrl: function () {
        return Site.getCustomPreferenceValue('eswPwaUrl');
    },
    /**
     * Return contry detail by local in httpParam or country id (IE, CA) string
     * @param {*} httpParams - httpParam or country id (IE, CA) string
     * @returns {Object} - getSelectedCountryDetail function
     */
    getCountryDetailByParam: function (httpParams) {
        if (empty(httpParams)) {
            return null;
        }
        let locale = httpParams;
        try {
            locale = httpParams.get('locale')[0];
        } catch (e) {
            locale = httpParams;
        }
        let loclaeCountryDetail = this.getLocaleCountry(locale);
        let countryDetail = eswCoreHelper.getSelectedCountryDetail(loclaeCountryDetail);
        return countryDetail;
    },
    /**
     * Get localize country object for getMoneyObject function
     * @param {Object} selectedCountryDetail - object of selected country
     * @returns {Object} - localize object
     */
    getCountryLocalizeObj: function (selectedCountryDetail) {
        let selectedFxRate = eswCoreHelper.getESWCurrencyFXRate(selectedCountryDetail.defaultCurrencyCode, selectedCountryDetail.countryCode);
        let selectedCountryAdjustments = eswCoreHelper.getESWCountryAdjustments(selectedCountryDetail.countryCode);
        let localizeObj = {
            currencyCode: selectedCountryDetail.defaultCurrencyCode,
            countryCode: selectedCountryDetail.countryCode,
            applyRoundingModel: !selectedCountryDetail.isFixedPriceModel && eswCoreHelper.isEswRoundingsEnabled(),
            applyCountryAdjustments: true, // !selectedCountryDetail.isFixedPriceModel
            selectedFxRate: selectedFxRate[0],
            selectedCountryAdjustments: selectedCountryAdjustments[0],
            isFixedPriceModel: selectedCountryDetail.isFixedPriceModel
        };
        let selectedRoundingRule = eswPricingHelper.getESWRoundingModel(localizeObj);
        localizeObj.selectedRoundingRule = selectedRoundingRule[0];
        localizeObj.selectedCountry = localizeObj;
        return localizeObj;
    },
    /**
     * Change product prices from basket line item, this function should be used whenever need to change product price
     * @param {*} basketLineItems - basket line items from basket
     * @param {*} selectedCountryLocalizeObj - selectedCountryLocalizeObj
     * @returns {Object} - modified line items
     */
    modifyLineItems: function (basketLineItems, selectedCountryLocalizeObj) {
        let docModifiedLineItems = new ArrayList([]);
        let isOrderableBasket = true;
        for (let i = 0; i < basketLineItems.length; i++) {
            let productItem = basketLineItems[i];
            if (!selectedCountryLocalizeObj.isFixedPriceModel) {
                productItem.price = eswCoreHelper.getMoneyObject(productItem.price.toString(), false, false, false, selectedCountryLocalizeObj).value;
                productItem.basePrice = eswCoreHelper.getMoneyObject(productItem.basePrice.toString(), false, false, false, selectedCountryLocalizeObj).value;
                productItem.priceAfterItemDiscount = eswCoreHelper.getMoneyObject(productItem.priceAfterItemDiscount.toString(), false, false, false, selectedCountryLocalizeObj).value;
                productItem.priceAfterOrderDiscount = eswCoreHelper.getMoneyObject(productItem.priceAfterOrderDiscount.toString(), false, false, false, selectedCountryLocalizeObj).value;
                for (let j = 0; j < productItem.priceAdjustments.length; j++) {
                    productItem.priceAdjustments[j].price = eswCoreHelper.getMoneyObject(productItem.priceAdjustments[0].price.toString(), false, false, false, selectedCountryLocalizeObj).value;
                }
            }
            // restricted product
            productItem.c_eswRestrictedProduct = eswHelperHL.isProductRestricted(productItem.productId, selectedCountryLocalizeObj.countryCode);
            if (isOrderableBasket === true && productItem.c_eswRestrictedProduct === true) {
                isOrderableBasket = false;
            }
            // Return restricted product
            productItem.c_eswReturnProhibited = !productItem.c_eswRestrictedProduct ? eswHelperHL.isReturnProhibited(productItem.productId, selectedCountryLocalizeObj.countryCode) : false;
            productItem.c_eswReturnProhibitedMsg = this.getContentAsset('esw-display-return-prohibited-message');
            docModifiedLineItems.add(productItem);
        }
        return { docModifiedLineItems: docModifiedLineItems, isOrderableBasket: isOrderableBasket };
    },
    /**
     * Get content asset
     * @param {*} contentAssetId - content asset id
     * @returns {string} - content body
     */
    getContentAsset: function (contentAssetId) {
        let contentBody = null;
        try {
            let content = ContentMgr.getContent(contentAssetId);
            if (content) {
                contentBody = content.custom ? content.custom.body.markup : '';
            }
        } catch (e) {
            contentBody = Resource.msg('warning.product.not.returnable', 'esw', null);
        }
        return contentBody;
    },
    /**
     * Get PWA sites.js data
     * @param {string} selectedCountryCode - Country code
     * @returns {Object} - Site.js complete object to export
     */
    getPwaSitesData: function (selectedCountryCode) {
        let allEswCountries = eswCoreHelper.getAllCountries();
        let currentSite = Site.getCurrent();
        let currentSiteId = currentSite.getID();
        let allowedLocales = currentSite.getAllowedLocales();
        let allowedLocalesArr = !empty(allowedLocales) ? allowedLocales.toArray() : [];
        let supportedLocals = [];
        let supportedCurrencies = [];
        for (let i = 0; i < allEswCountries.length; i++) {
            let currentEswCountry = allEswCountries[i];
            if (allowedLocalesArr.indexOf(currentEswCountry.locale) !== -1) {
                let preferedCurrency = currentEswCountry.isFixedPriceModel ? currentEswCountry.defaultCurrencyCode : eswCoreHelper.getBaseCurrency();
                let siteConfigLocale = currentEswCountry.locale.replace('_', '-');
                if (supportedCurrencies.indexOf(preferedCurrency) === -1) {
                    supportedCurrencies.push(preferedCurrency);
                }
                supportedLocals.push({
                    id: siteConfigLocale,
                    alias: currentEswCountry.value.toLowerCase(),
                    preferredCurrency: preferedCurrency,
                    supportedLocales: [siteConfigLocale],
                    isFixedPriceModel: currentEswCountry.isFixedPriceModel,
                    isSupportedByESW: currentEswCountry.isSupportedByESW,
                    countryCode: currentEswCountry.value,
                    actualCurrency: currentEswCountry.defaultCurrencyCode
                });
            }
        }
        let defaultCurrency = eswCoreHelper.getBaseCurrencyPreference();
        let defaultLocale = 'en-US';
        if (!empty(selectedCountryCode)) {
            let defaultSiteSetting = supportedLocals.filter(function (local) {
                return local.countryCode === selectedCountryCode;
            });
            if (defaultSiteSetting.length > 0) {
                defaultSiteSetting = defaultSiteSetting[0];
                defaultCurrency = defaultSiteSetting.preferredCurrency;
                defaultLocale = defaultSiteSetting.supportedLocales[0];
            }
        }
        return [{
            id: currentSiteId,
            l10n: {
                supportedCurrencies: supportedCurrencies,
                defaultCurrency: defaultCurrency,
                defaultLocale: defaultLocale,
                supportedLocales: supportedLocals
            }
        }];
    },
    /**
     * set customer custom object
     * @param {*} customerEmail - customer email
     * @param {*} orderNumber - order number
     */
    setCustomerCustomObject: function (customerEmail, orderNumber) {
        let CustomObjectMgr = require('dw/object/CustomObjectMgr'),
            Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            let co = CustomObjectMgr.getCustomObject('ESW_PWA_ORDER_DATA', customerEmail);

            if (co) {
                CustomObjectMgr.remove(co);
            }
            co = CustomObjectMgr.createCustomObject('ESW_PWA_ORDER_DATA', customerEmail);
            co.custom.orderNumber = orderNumber;
        });
    },
    /**
     * Get customer custom object
     * @param {*} customerEmail - customer email
     * @returns {string}- order number
     */
    getCustomerCustomObject: function (customerEmail) {
        let CustomObjectMgr = require('dw/object/CustomObjectMgr'),
            Transaction = require('dw/system/Transaction'),
            orderNumber;
        Transaction.wrap(function () {
            let co = CustomObjectMgr.getCustomObject('ESW_PWA_ORDER_DATA', customerEmail);

            if (co) {
                orderNumber = co.getCustom().orderNumber;
                CustomObjectMgr.remove(co);
            }
        });
        return orderNumber;
    },
    /**
     * Get country by time zone
     * Needs this fix due to cloudflare or other proxy implementation
     * @param {*} timezone - timezone
     * @returns {string} - country code
     */
    getCountryByTimeZone: function (timezone) {
        return eswTimeZoneHelper.getCountryByTimeZone(timezone);
    },
    /*  function to get promo(s) or voucher code(s) entered on the cart by the shopper
    * @param {Object} order - Order API object
    * @param coupons - Returns (Binnian) Object} - the coupons Array
    */
    getRetailerPromoCodes: function (order) {
        let coupons = [],
            collections = require('*/cartridge/scripts/util/collections');
        // eslint-disable-next-line no-prototype-builtins
        if ((order.hasOwnProperty('couponLineItems') || order.couponLineItems) && !empty(order.couponLineItems)) {
            collections.forEach(order.couponLineItems, function (couponLineItem) {
                if (couponLineItem.couponCode) {
                    coupons.push({ code: couponLineItem.couponCode });
                }
            });
        }
        return coupons;
    },
    /**
     * Get PWA shopper url
     * @param {string} countryCode - country code
     * @returns {string} - PWA shopper url
     */
    getPwaShopperUrl: function (countryCode) {
        let baseUrl = this.getPwaUrl();
        if (!empty(countryCode)) {
            // eslint-disable-next-line no-param-reassign
            countryCode = countryCode.toLowerCase();
            baseUrl += '/' + countryCode;
        }
        return baseUrl;
    },
    /**
     * Get PWA shopper url
     * @param {obj} currentBasket - Basket
     * @param {obj} selectedCountryDetail - selected country detail
     * @param {obj} docBasket - basket object
     * @returns {number} grandTotal - grand order total
     */
    getGrandTotal: function (currentBasket, selectedCountryDetail, docBasket) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelperHL');
        let localizeObj = {
            localizeCountryObj: {
                countryCode: selectedCountryDetail.countryCode,
                currencyCode: selectedCountryDetail.defaultCurrencyCode
            },
            applyCountryAdjustments: 'true',
            applyRoundingModel: 'true'
        };
        let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);
        let grandTotal = eswHelperHL.getFinalOrderTotalsObject(currentBasket, localizeObj, conversionPrefs).value;
        grandTotal = !empty(grandTotal) ? grandTotal + docBasket.shippingTotal : null;
        return grandTotal;
    }
};

module.exports = PwaCoreHelper;
