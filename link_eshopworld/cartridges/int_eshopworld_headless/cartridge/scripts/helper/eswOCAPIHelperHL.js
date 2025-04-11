/* eslint-disable block-scoped-var */
/* eslint-disable no-param-reassign */
'use strict';

// API Includes
const Site = require('dw/system/Site').getCurrent();

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

// Script Includes
const priceBookKeyWords = Site.getCustomPreferenceValue('eswPriceBookKeyWords');
const retailerCurrencies = new RegExp(priceBookKeyWords, 'gi');

// Public Methods
const OCAPIHelper = {
    /**
     * This function covers the logic of converting
     * the pricing related attributes to eSW Prices
     * for PDP - Product Detail Page (products end-point)
     * @param {Object} scriptProduct - Product Object
     * @param {Object} doc - Response document
     */
    eswPdpPriceConversions: function (scriptProduct, doc) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
        let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
        let param = request.httpParameters;

        if (!empty(param['country-code']) && !empty(doc.price)) {
            let shopperCurrency = !empty(param['currency-code']) ? param['currency-code'][0] : pricingHelper.getShopperCurrency(param['country-code'][0]);
            if (!pricingHelper.isFixedPriceCountry(param['country-code'][0]) && !empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: param['country-code'][0],
                        currencyCode: shopperCurrency
                    },
                    applyCountryAdjustments: !empty(param.applyAdjust) ? param.applyAdjust[0] : 'true',
                    applyRoundingModel: !empty(param.applyRounding) ? param.applyRounding[0] : 'true'
                };

                let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);

                if ('price' in doc && !empty(doc.price)) {
                    doc.c_eswPrice = pricingHelper.getConvertedPrice(Number(doc.price), localizeObj, conversionPrefs);
                }

                if ('priceMax' in doc && !empty(doc.priceMax)) {
                    doc.c_eswPrice_max = pricingHelper.getConvertedPrice(Number(doc.priceMax), localizeObj, conversionPrefs);
                }

                if ('pricePerUnit' in doc && !empty(doc.pricePerUnit)) {
                    doc.c_eswPrice_per_unit = pricingHelper.getConvertedPrice(Number(doc.pricePerUnit), localizeObj, conversionPrefs);
                }

                if ('pricePerUnitMax' in doc && !empty(doc.pricePerUnitMax)) {
                    doc.c_eswPrice_per_unit_max = pricingHelper.getConvertedPrice(Number(doc.pricePerUnitMax), localizeObj, conversionPrefs);
                }

                if ('prices' in doc && !empty(doc.prices)) {
                    doc.c_eswPrices = {};
                    doc.prices.keySet().toArray().forEach(function (priceBookId) {
                        doc.c_eswPrices['eswPriceOf-' + priceBookId.replace(retailerCurrencies, 'base')] = pricingHelper.getConvertedPrice(Number(doc.prices[priceBookId]), localizeObj, conversionPrefs);
                    });
                }
                doc.c_shopperCurrency = shopperCurrency;
            } else {
                if ('price' in doc && !empty(doc.price)) {
                    doc.c_eswPrice = Number(doc.price);
                }

                if ('priceMax' in doc && !empty(doc.priceMax)) {
                    doc.c_eswPrice_max = Number(doc.priceMax);
                }

                if ('pricePerUnit' in doc && !empty(doc.pricePerUnit)) {
                    doc.c_eswPrice_per_unit = Number(doc.pricePerUnit);
                }

                if ('pricePerUnitMax' in doc && !empty(doc.pricePerUnitMax)) {
                    doc.c_eswPrice_per_unit_max = Number(doc.pricePerUnitMax);
                }

                if ('prices' in doc && !empty(doc.prices)) {
                    doc.c_eswPrices = {};
                    doc.prices.keySet().toArray().forEach(function (priceBookId) {
                        doc.c_eswPrices['eswPriceOf-' + priceBookId.replace(retailerCurrencies, 'base')] = Number(doc.prices[priceBookId]);
                    });
                }
                doc.c_shopperCurrency = !empty(param.currency) ? param.currency[0] : shopperCurrency;
            }
            // custom attribute to check if product is restricted in selected country
            doc.c_eswRestrictedProduct = eswHelperHL.isProductRestricted(doc.id, param['country-code'][0]);
            // custom attribute to check if product return is prohibited in selected country
            doc.c_eswReturnProhibited = eswHelperHL.isReturnProhibited(doc.id, param['country-code'][0]);
        }
    },
    /**
     * This function covers the logic of converting
     * the pricing related attributes to eSW Prices
     * for PLP - Product Listing Page (product_search end-point)
     * @param {Object} doc - Response document
     */
    eswPlpPriceConversions: function (doc) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
        let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
        let param = request.httpParameters;

        if (!empty(param['country-code']) && doc.count > 0) {
            let shopperCurrency = !empty(param['currency-code']) ? param['currency-code'][0] : pricingHelper.getShopperCurrency(param['country-code'][0]);
            if (!pricingHelper.isFixedPriceCountry(param['country-code'][0]) && !empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: param['country-code'][0],
                        currencyCode: shopperCurrency
                    },
                    applyCountryAdjustments: !empty(param.applyAdjust) ? param.applyAdjust[0] : 'true',
                    applyRoundingModel: !empty(param.applyRounding) ? param.applyRounding[0] : 'true'
                };

                let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);

                for (let i = 0; i < doc.count; i++) {
                    if ('price' in doc.hits[i] && !empty(doc.hits[i].price)) {
                        doc.hits[i].c_eswPrice = pricingHelper.getConvertedPrice(Number(doc.hits[i].price), localizeObj, conversionPrefs);
                    }

                    if ('priceMax' in doc.hits[i] && !empty(doc.hits[i].priceMax)) {
                        doc.hits[i].c_eswPrice_max = pricingHelper.getConvertedPrice(Number(doc.hits[i].priceMax), localizeObj, conversionPrefs);
                    }

                    if ('pricePerUnit' in doc.hits[i] && !empty(doc.hits[i].pricePerUnit)) {
                        doc.hits[i].c_eswPrice_per_unit = pricingHelper.getConvertedPrice(Number(doc.hits[i].pricePerUnit), localizeObj, conversionPrefs);
                    }

                    if ('pricePerUnitMax' in doc.hits[i] && !empty(doc.hits[i].pricePerUnitMax)) {
                        doc.hits[i].c_eswPrice_per_unit_max = pricingHelper.getConvertedPrice(Number(doc.hits[i].pricePerUnitMax), localizeObj, conversionPrefs);
                    }

                    if ('prices' in doc.hits[i] && !empty(doc.hits[i].prices)) {
                        doc.hits[i].c_eswPrices = {};
                        doc.hits[i].prices.keySet().toArray().forEach(function (priceBookId) { // eslint-disable-line no-loop-func
                            doc.hits[i].c_eswPrices['eswPriceOf-' + priceBookId.replace(retailerCurrencies, 'base')] = pricingHelper.getConvertedPrice(Number(doc.hits[i].prices[priceBookId]), localizeObj, conversionPrefs);
                        });
                    }
                    doc.hits[i].c_shopperCurrency = shopperCurrency;
                    // custom attribute to check if product is restricted in selected country
                    doc.hits[i].c_eswRestrictedProduct = eswHelperHL.isProductRestricted(doc.hits[i].product_id, param['country-code'][0]);
                    // custom attribute to check if product return is prohibited in selected country
                    doc.hits[i].c_eswReturnProhibited = eswHelperHL.isReturnProhibited(doc.hits[i].product_id, param['country-code'][0]);
                }
            } else {
                for (let i = 0; i < doc.count; i++) {
                    if ('price' in doc.hits[i] && !empty(doc.hits[i].price)) {
                        doc.hits[i].c_eswPrice = Number(doc.hits[i].price);
                    }

                    if ('priceMax' in doc.hits[i] && !empty(doc.hits[i].priceMax)) {
                        doc.hits[i].c_eswPrice_max = Number(doc.hits[i].priceMax);
                    }

                    if ('pricePerUnit' in doc.hits[i] && !empty(doc.hits[i].pricePerUnit)) {
                        doc.hits[i].c_eswPrice_per_unit = Number(doc.hits[i].pricePerUnit);
                    }

                    if ('pricePerUnitMax' in doc.hits[i] && !empty(doc.hits[i].pricePerUnitMax)) {
                        doc.hits[i].c_eswPrice_per_unit_max = Number(doc.hits[i].pricePerUnitMax);
                    }

                    if ('prices' in doc.hits[i] && !empty(doc.hits[i].prices)) {
                        doc.hits[i].c_eswPrices = {};
                        doc.hits[i].prices.keySet().toArray().forEach(function (priceBookId) { // eslint-disable-line no-loop-func
                            doc.hits[i].c_eswPrices['eswPriceOf-' + priceBookId.replace(retailerCurrencies, 'base')] = Number(doc.hits[i].prices[priceBookId]);
                        });
                    }
                    doc.hits[i].c_shopperCurrency = !empty(param.currency) ? param.currency[0] : shopperCurrency;
                    // custom attribute to check if product is restricted in selected country
                    doc.hits[i].c_eswIsRestrictedProduct = eswHelperHL.isProductRestricted(doc.hits[i].product_id, param['country-code'][0]);
                    // custom attribute to check if product return is prohibited in selected country
                    doc.hits[i].c_eswReturnProhibited = eswHelperHL.isReturnProhibited(doc.hits[i].product_id, param['country-code'][0]);
                }
            }
        }
    },
    /**
     * This function sets the override pricebook
     * configured in custom site preference.
     * @param {Object} basket - Basket API object (Optional)
     * if basket object exists then,
     * sets the basketCurrency for pricebook override
     */
    setOverridePriceBooks: function (basket) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
            param = request.httpParameters;

        if (!empty(param['country-code'])) {
            let currencyCode = !empty(param.currency) ? param.currency[0] : (!!basket && pricingHelper.isFixedPriceCountry(param['country-code'][0])) ? basket.getCurrencyCode() : null; // eslint-disable-line no-nested-ternary
            if (!empty(currencyCode)) {
                pricingHelper.setOverridePriceBooks(param['country-code'][0], currencyCode, basket);
            }
        }
    },
    /**
     * Handles eShopWorld Checkout (PreOrder) API Call (Request, Response)
     * @param {Object} order - Order object SFCC API
     * @param {Object} orderResponse - Order object from OCAPI Response
     */
    handleEswPreOrderCall: function (order, orderResponse) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
            checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            param = request.httpParameters;

        if (!empty(param['country-code']) && eswHelper.checkIsEswAllowedCountry(param['country-code'][0])) {
            let shopperCountry = param['country-code'][0];
            let shopperCurrency = !empty(param['currency-code']) ? param['currency-code'][0] : pricingHelper.getShopperCurrency(shopperCountry);
            if (!empty(shopperCurrency)) {
                // API Includes
                let Logger = require('dw/system/Logger');
                let shopperLocale;
                if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                    shopperLocale = request.locale;
                } else {
                    shopperLocale = !empty(param.locale) ? param.locale[0] : order.customerLocaleID;
                }
                try {
                    let result = checkoutHelper.callEswCheckoutAPI(order, shopperCountry, shopperCurrency, shopperLocale);
                    if (!empty(result)) {
                        orderResponse.c_eswPreOrderResponseStatus = result.status;
                        orderResponse.c_eswPreOrderResponse = !empty(result.object) ? JSON.parse(result.object) : JSON.parse(result.errorMessage);
                    } else {
                        Logger.error('ESW Service Error: No Response found from API.');
                    }
                } catch (e) {
                    Logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
                }
            }
        }
    },
    /**
     * Handles/ sets basket attributes and it's logic
     * @param {Object} basket - basket object SFCC API
     */
    handleEswBasketAttributes: function (basket) {
        let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
            checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            param = request.httpParameters;

        if (!empty(param['country-code']) && eswHelper.checkIsEswAllowedCountry(param['country-code'][0])) {
            let shopperCurrency = !empty(param['currency-code']) ? param['currency-code'][0] : pricingHelper.getShopperCurrency(param['country-code'][0]);
            if (!empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: param['country-code'][0],
                        currencyCode: shopperCurrency
                    },
                    applyCountryAdjustments: !empty(param.applyAdjust) ? param.applyAdjust[0] : 'true',
                    applyRoundingModel: !empty(param.applyRounding) ? param.applyRounding[0] : 'true'
                };
                let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);

                checkoutHelper.setEswBasketAttributes(basket, localizeObj, conversionPrefs);
                if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                    eswHelperHL.adjustThresholdDiscounts(basket, localizeObj, !pricingHelper.isFixedPriceCountry(param['country-code'][0]) ? conversionPrefs : {});
                    checkoutHelper.setOverrideShippingMethods(basket, localizeObj, conversionPrefs);
                }
            }
        }
    },
    /**
     * Handles/ sets order attributes and it's logic
     * @param {Object} order - Order object SFCC API
     */
    handleEswOrderAttributes: function (order) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
            checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            param = request.httpParameters;

        if (!empty(param['country-code']) && eswHelper.checkIsEswAllowedCountry(param['country-code'][0])) {
            let shopperCurrency = !empty(param['currency-code']) ? param['currency-code'][0] : pricingHelper.getShopperCurrency(param['country-code'][0]);
            if (!empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: param['country-code'][0],
                        currencyCode: shopperCurrency
                    },
                    applyCountryAdjustments: !empty(param.applyAdjust) ? param.applyAdjust[0] : 'true',
                    applyRoundingModel: !empty(param.applyRounding) ? param.applyRounding[0] : 'true'
                };
                let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);

                checkoutHelper.setEswOrderAttributes(order, localizeObj, conversionPrefs);
                checkoutHelper.setOverrideShippingMethods(order, localizeObj, conversionPrefs);
            }
        }
    },
    /**
     * Handles/ sets default override shipping method
     * @param {Object} basket - Basket object SFCC API
     */
    setDefaultOverrideShippingMethod: function (basket) {
        let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL'),
            customizationHelper = require('*/cartridge/scripts/helper/customizationHelper'),
            Transaction = require('dw/system/Transaction'),
            ShippingMgr = require('dw/order/ShippingMgr'),
            shippingOverrides = eswHelper.getOverrideShipping(),
            isOverrideCountry,
            param = request.httpParameters;

        if (!empty(param['country-code']) && eswHelper.checkIsEswAllowedCountry(param['country-code'][0]) && !empty(basket)) {
            if (shippingOverrides.length > 0) {
                isOverrideCountry = JSON.parse(shippingOverrides).filter(function (item) {
                    return item.countryCode === param['country-code'][0];
                });
            }
            Transaction.wrap(function () {
                if (!empty(isOverrideCountry) && isOverrideCountry[0] != null) {
                    if (eswHelperHL.getShippingServiceType(basket, param['country-code'][0], isOverrideCountry) === 'POST') {
                        eswHelperHL.applyShippingMethod(basket, 'POST', param['country-code'][0], true);
                    } else {
                        eswHelperHL.applyShippingMethod(basket, 'EXP2', param['country-code'][0], true);
                    }
                } else {
                    let defaultShippingMethodID = customizationHelper.getDefaultShippingMethodID(ShippingMgr.getDefaultShippingMethod().getID(), basket);
                    eswHelperHL.applyShippingMethod(basket, defaultShippingMethodID, param['country-code'][0], false);
                }
            });
        }
    },
    handleEswOrderDetailCall: function (order, orderResponse) {
        if (orderResponse.c_eswPackageJSON && !empty(orderResponse.c_eswPackageJSON)) {
            orderResponse.c_eswPackageJSON = eswHelper.strToJson(orderResponse.c_eswPackageJSON);
        }
    }
};

module.exports = OCAPIHelper;
