/* eslint-disable no-param-reassign */
'use strict';

const Money = require('dw/value/Money');
const Promotion = require('dw/campaign/Promotion');
const HookMgr = require('dw/system/HookMgr');

// Public Helper Methods
const eswHelperHL = {

    /**
     * Returns unit price of the productLineItem
     * @param {Object} lineItem - the productLineItem object
     * @param {Object} localizeObj - local country currency preference
     * @param {Object} conversionPrefs - the conversion preferences which contains selected fxRate, countryAdjustments and roundingRule
     * @returns {dw.Money} - the unit price of line item
     */
    getUnitPriceCost: function (lineItem, localizeObj, conversionPrefs) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
        return new dw.value.Money((eswHelper.getSubtotalObject(lineItem, false, false, false, localizeObj, conversionPrefs).value / lineItem.quantity.value), localizeObj.localizeCountryObj.currencyCode);
    },
    /**
     * This function is used to get Order Pro-rated Discount
     * @param {Object} order - Order API object
     * @returns {Object} order level pro-rated discount
     */
    getOrderProratedDiscount: function (order) {
        let orderLevelProratedDiscount = 0;
        let allPriceAdjustmentIter = order.priceAdjustments.iterator();
        while (allPriceAdjustmentIter.hasNext()) {
            let eachPriceAdjustment = allPriceAdjustmentIter.next();
            if (!empty(eachPriceAdjustment.promotion) && eachPriceAdjustment.promotion.promotionClass === Promotion.PROMOTION_CLASS_ORDER) {
                orderLevelProratedDiscount += eachPriceAdjustment.priceValue;
            } else if (empty(eachPriceAdjustment.promotion) && eachPriceAdjustment.promotionID && eachPriceAdjustment.promotionID === 'orderthresholdPromo') {
                orderLevelProratedDiscount += eachPriceAdjustment.priceValue;
            }
        }
        if (orderLevelProratedDiscount < 0) {
            orderLevelProratedDiscount *= -1;
        }
        return orderLevelProratedDiscount;
    },
    /**
    * This function is used to get order discount if it exist
    * @param {Object} order - Order API object
    * @param {Object} localizeObj - local country currency preference
    * @param {Object} conversionPrefs - the conversion preferences which contains selected fxRate, countryAdjustments and roundingRule
    * @returns {Object} order discount
    */
    getOrderDiscount: function (order, localizeObj, conversionPrefs) {
        let totalDiscount = 0;
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
        let orderLevelProratedDiscount = this.getOrderProratedDiscount(order);
        if (order != null) {
            // eslint-disable-next-line guard-for-in
            for (let lineItemNumber in order.productLineItems) { // eslint-disable-line no-restricted-syntax
                let item = order.productLineItems[lineItemNumber];
                // Apply order level discount
                if (orderLevelProratedDiscount > 0 && item.proratedPrice.value < item.adjustedPrice.value) {
                    localizeObj.applyRoundingModel = 'false';
                    totalDiscount += pricingHelper.getConvertedPrice(Number(item.adjustedPrice.value), localizeObj, conversionPrefs) - pricingHelper.getConvertedPrice(Number(item.proratedPrice.value), localizeObj, conversionPrefs);
                    localizeObj.applyRoundingModel = 'true';
                }
            }
        }
        if (totalDiscount < 0) {
            totalDiscount *= -1;
        }
        return new Money(totalDiscount, localizeObj.localizeCountryObj.currencyCode);
    },
    /**
     * This function is used to apply applicable shipping method and return applied shipping method
     * @param {Object} order - created order api object
     * @param {string} shippingMethodID - shipping method ID
     * @param {string} shopperCountry - shopper selected country
     * @param {boolean} isNotifyReq - request coming from order confirmation or preorder
     * @returns {Object} shipping method or null
     */
    applyShippingMethod: function (order, shippingMethodID, shopperCountry, isNotifyReq) {
        let ShippingMgr = require('dw/order/ShippingMgr'),
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper'),
            cart = order,
            isOverrideShippingCountry,
            shippingOverrides = eswHelper.getOverrideShipping();

        if (shippingOverrides.length > 0) {
            isOverrideShippingCountry = JSON.parse(shippingOverrides).filter(function (item) {
                return item.countryCode === shopperCountry;
            });
        }

        let shipment = cart.getShipment(cart.getDefaultShipment().getID());
        let shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();
        // eslint-disable-next-line guard-for-in
        for (let shippingMethod in shippingMethods) { // eslint-disable-line no-restricted-syntax
            let method = shippingMethods[shippingMethod];
            try {
                if (isNotifyReq && method.displayName.equals(shippingMethodID) && method.currencyCode === cart.getCurrencyCode()) {
                    if (!empty(isOverrideShippingCountry)) {
                        if (isOverrideShippingCountry[0].shippingMethod.ID.indexOf(method.ID) !== -1) {
                            shipment.setShippingMethod(method);
                            ShippingMgr.applyShippingCost(cart);
                            dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart, isNotifyReq);
                            eswServiceHelper.updatePaymentInstrument(cart);
                            return method;
                        }
                    }
                } else if (!isNotifyReq && method.ID.equals(shippingMethodID) && method.currencyCode === cart.getCurrencyCode()) {
                    shipment.setShippingMethod(method);
                    HookMgr.callHook('dw.order.calculate', 'calculate', cart, false);
                    return method;
                } else if (!isNotifyReq && method.displayName.equals(shippingMethodID) && method.currencyCode === cart.getCurrencyCode()) {
                    if (!empty(isOverrideShippingCountry)) {
                        if (isOverrideShippingCountry[0].shippingMethod.ID.indexOf(method.ID) !== -1) {
                            shipment.setShippingMethod(method);
                            HookMgr.callHook('dw.order.calculate', 'calculate', cart, false);
                            return method;
                        }
                    }
                }
            } catch (e) {
                eswHelper.eswInfoLogger('Error in PWA: applyShippingMethod', e, e.message, e.stack);
            }
        }
        return null;
    },
    /**
    * This function is used to get line item level prorated converted price
    * @param {Object} cart - Basket API object
    * @param {Object} item - Line Item API object
    * @param {Object} localizeObj - local country currency preference
    * @param {Object} conversionPrefs - the conversion preferences which contains selected fxRate, countryAdjustments and roundingRule
    * @returns {dw.Money} - converted prorated price
    */
    getLineItemConvertedProrated: function (cart, item, localizeObj, conversionPrefs) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
        let orderLevelProratedDiscount = eswHelper.getOrderProratedDiscount(cart);
        let price = eswHelper.getSubtotalObject(item, false, false, false, localizeObj, conversionPrefs).value;
        if (orderLevelProratedDiscount > 0 && item.proratedPrice.value < item.adjustedPrice.value) {
            localizeObj.applyRoundingModel = 'false';
            // Subtracting item's pro-rated price from item's adjusted price provides, the order level discount.
            let liOrderDiscount = pricingHelper.getConvertedPrice(item.adjustedPrice.value / item.quantity.value, localizeObj, conversionPrefs) - pricingHelper.getConvertedPrice(item.proratedPrice.value / item.quantity.value, localizeObj, conversionPrefs);
            price -= liOrderDiscount * item.quantity.value;
            localizeObj.applyRoundingModel = 'true';
        }
        return new dw.value.Money(price, localizeObj.localizeCountryObj.currencyCode);
    },
    /**
    * This function is used to get line item level prorated converted price
    * @param {Object} cart - Basket API object
    * @param {Object} localizeObj - local country currency preference
    * @param {Object} conversionPrefs - the conversion preferences which contains selected fxRate, countryAdjustments and roundingRule
    * @returns {dw.Money} - converted order total
    */
    getFinalOrderTotalsObject: function (cart, localizeObj, conversionPrefs) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
        return new dw.value.Money((eswHelper.getSubtotalObject(cart, true, false, false, localizeObj, conversionPrefs).value - this.getOrderDiscount(cart, localizeObj, conversionPrefs).value), localizeObj.localizeCountryObj.currencyCode);
    },
    /**
     * function to get the product line item metadata sends custom attributes in
     * @param {Object} pli - productLineItem
     * @return {Array} arr - metadata Array
     */
    getProductLineMetadataItems: function (pli) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            metadataItems = eswHelper.getProductLineMetadataItemsPreference(),
            obj,
            arr = [],
            i = 0;
        if (!empty(metadataItems)) {
            // eslint-disable-next-line guard-for-in
            for (let item in metadataItems) { // eslint-disable-line no-restricted-syntax
                let metadataItem = metadataItems[item];
                i = metadataItem.indexOf('|');

                // Product line custom attribute ID
                let pliCustomAttrID = metadataItem.substring(i + 1);
                let pliCustomAttrValue = (pliCustomAttrID in pli.custom && !!pli.custom[pliCustomAttrID]) ? pli.custom[pliCustomAttrID] : null;

                if (!empty(pliCustomAttrValue)) {
                    if (metadataItem.substring(0, i) === 'CartItemAdditionalMessage') {
                        let additionalMessagesArr = JSON.parse(pliCustomAttrValue);
                        // eslint-disable-next-line guard-for-in
                        for (let msg in additionalMessagesArr) { // eslint-disable-line no-restricted-syntax
                            obj = {
                                name: metadataItem.substring(0, i),
                                value: additionalMessagesArr[msg]
                            };
                            arr.push(obj);
                        }
                    } else {
                        obj = {
                            name: metadataItem.substring(0, i),
                            value: pliCustomAttrValue
                        };
                        arr.push(obj);
                    }
                }
            }
        }
        return arr.length > 0 ? arr : null;
    },
    /**
     * function is used to set the pricebook and update session currency
     * @param {string} currencyCode - localize shopper currency
     * @param {Object} basket - SFCC Basket Object
     */
    setBaseCurrencyPriceBook: function (currencyCode, basket) {
        try {
            let Transaction = require('dw/system/Transaction');
            let Currency = require('dw/util/Currency'),
                currency = Currency.getCurrency(currencyCode);
            Transaction.wrap(function () {
                session.setCurrency(currency);
                if (basket) {
                    basket.updateCurrency();
                    HookMgr.callHook('dw.order.calculate', 'calculate', basket);
                } else {
                    let Cart = require('*/cartridge/scripts/models/CartModel');
                    let currentCart = Cart.get();
                    if (currentCart) {
                        currentCart.updateCurrency();
                        currentCart.calculate();
                    }
                }
            });
        } catch (e) {
            // Do nothing
        }
    },

    /**
     * function is used to get & set first override shipping method
     * @param {Object} cart - Basket SFCC API
     * @param {string} shopperCountry - ISO shopper currency
     * @param {array} shippingOverrides - Override Shipping Method
     * @return {string} String - First override shipping method
     */
    getShippingServiceType: function (cart, shopperCountry, shippingOverrides) {
        let ShippingMgr = require('dw/order/ShippingMgr');

        if (!empty(shippingOverrides) && shippingOverrides[0] != null) {
            let shippingMethodIDsOfCountry = shippingOverrides[0].shippingMethod.ID;
            if (shippingMethodIDsOfCountry.length > 0) {
                let applicableShippingMethodsOnCart = ShippingMgr.getShipmentShippingModel(cart.shipments[0]).applicableShippingMethods.toArray();
                let shippingservice = applicableShippingMethodsOnCart.filter(function (ship) {
                    let shippingMethod;
                    if (shippingMethodIDsOfCountry[0] === ship.ID) {
                        shippingMethod = ship;
                    }
                    return shippingMethod;
                });
                if (shippingservice[0] != null && shippingservice[0].displayName === 'POST') {
                    return 'POST';
                }
            }
        }
        return 'EXP2';
    },
    /**
     * Check if product is restricted in current selected Country
     * @param {string} productID - Product id
     * @param {string} shopperCountry - Selected country
     * @return {boolean} - true/ false
     */
    isProductRestricted: function (productID, shopperCountry) {
        let ProductMgr = require('dw/catalog/ProductMgr');
        let product = ProductMgr.getProduct(productID);
        let restrictedCountries = ('eswProductRestrictedCountries' in product.custom && !!product.custom.eswProductRestrictedCountries) ? product.custom.eswProductRestrictedCountries : null;
        if (!empty(restrictedCountries)) {
            // eslint-disable-next-line no-restricted-syntax
            for (let country in restrictedCountries) {
                if (restrictedCountries[country].toLowerCase() === 'all' || restrictedCountries[country].toLowerCase() === shopperCountry.toLowerCase()) {
                    return true;
                }
            }
        }
        return false;
    },
    /**
     * Check if product is return prohibited in current selected Country
     * @param {string} productID - Product id
     * @param {string} shopperCountry - Selected country
     * @return {boolean} - true/ false
     */
    isReturnProhibited: function (productID, shopperCountry) {
        let Site = require('dw/system/Site').getCurrent();
        let ProductMgr = require('dw/catalog/ProductMgr');
        let product = ProductMgr.getProduct(productID);
        if (Site.getCustomPreferenceValue('eswEnableReturnProhibition')) {
            let returnProhibitedCountries = ('eswProductReturnProhibitedCountries' in product.custom) ? product.custom.eswProductReturnProhibitedCountries : null;
            if (!empty(returnProhibitedCountries)) {
                // eslint-disable-next-line no-restricted-syntax
                for (let country in returnProhibitedCountries) {
                    if (returnProhibitedCountries[country].toLowerCase() === 'all' || returnProhibitedCountries[country].toLowerCase() === shopperCountry.toLowerCase()) {
                        return true;
                    }
                }
            }
        }
        return false;
    },
    /**
     * Get Cart Page Converted ESW shipping cost
     * @param {dw.value.Money} shippingCost - Total shipping cost
     * @param {Object} localizeObj - local country currency preference
     * @param {Object} conversionPrefs - the conversion preferences which contains selected fxRate, countryAdjustments and roundingRule
     * @returns {dw.value.Money} convertedShippingCost - Converted Shipping Cost
     */
    getEswCartShippingCost: function (shippingCost, localizeObj, conversionPrefs) {
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
        if (!pricingHelper.isShippingCostConversionEnabled(localizeObj.localizeCountryObj.countryCode)) {
            return new Money(shippingCost.decimalValue, localizeObj.localizeCountryObj.currencyCode);
        }
        localizeObj.applyCountryAdjustments = 'false';
        let eswEstimatedShippingTotal = pricingHelper.getConvertedPrice(shippingCost, localizeObj, conversionPrefs);
        localizeObj.applyCountryAdjustments = 'true';
        return new Money(eswEstimatedShippingTotal, localizeObj.localizeCountryObj.currencyCode);
    },
    /**
    * Check if promotion's threshold check is enabled
    * @param {Object} promotion - promotion
    * @return {boolean} - true/ false
    */
    isThresholdEnabled: function (promotion) {
        if (promotion.custom.eswLocalizedThresholdEnabled) {
            return true;
        }
        return false;
    },
   /**
    * Get promotion's discount type
    * @param {Object} promotion - promotion
    * @return {string} - discount type
    */
    getDiscountType: function (promotion) {
        return promotion.custom.eswPromotionDiscountType;
    }
};

module.exports = eswHelperHL;
