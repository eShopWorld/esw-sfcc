/* eslint-disable no-param-reassign */
'use strict';

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
    /*  function to return basket and required info from order
    * @param {string} eswClientLastOrderId - eswClientLastOrderId API object
    * @returns {Object} - the basket object
    */
    generateBasketFromOrder: function (eswClientLastOrderId, sgRequest) {
        let OrderMgr = require('dw/order/OrderMgr'),
            BasketMgr = require('dw/order/BasketMgr'),
            Transaction = require('dw/system/Transaction');
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        if (!empty(sgRequest)) {
            eswHelper = require('int_eshopworld_controllers/cartridge/scripts/helper/eswHelper').getEswHelper();
        }

        let orderItems = { products: [] },
            basketItems = { products: [] },
            coupons = [],
            order = null;
        if (!empty(eswClientLastOrderId) && eswClientLastOrderId !== 'null') {
            order = OrderMgr.getOrder(eswClientLastOrderId);

            if (order && !empty(order) &&
                (order.status.value === dw.order.Order.ORDER_STATUS_FAILED ||
                order.status.value === dw.order.Order.ORDER_STATUS_CREATED ||
                order.status.value === dw.order.Order.ORDER_STATUS_NEW)) {
                eswHelper.rebuildCartUponBackFromESW(order.getOrderNo());

                if (order.status.value === dw.order.Order.ORDER_STATUS_CREATED) {
                    Transaction.wrap(function () {
                        OrderMgr.failOrder(order, true);
                    });
                }

                let allLineItems = order.getAllLineItems().iterator();

                while (allLineItems.hasNext()) {
                    let currentLineItem = allLineItems.next();
                    if (currentLineItem instanceof dw.order.ProductLineItem) {
                        orderItems.products.push({
                            productId: currentLineItem.getProductID(),
                            price: currentLineItem.getPriceValue(),
                            quantity: currentLineItem.getQuantityValue()
                        });
                    }
                }

                // Re-iterate since previous iterator is consumed
                allLineItems = order.getAllLineItems().iterator();
                while (allLineItems.hasNext()) {
                    let lineItem = allLineItems.next();
                    if (lineItem instanceof dw.order.ProductLineItem) {
                        basketItems.products.push({
                            productId: lineItem.getProductID(),
                            lineItemId: lineItem.getUUID()
                        });
                    }
                }

                coupons = this.getRetailerPromoCodes(order);
            } else {
                response.setStatus(404);
                return {
                    Error: 'The order is either unavailable or was not successfully placed. Please verify the details and try again.'
                };
            }
        }

        let customerBasket = BasketMgr.getCurrentOrNewBasket();
        let currentBasketId = customerBasket.getUUID();
        return {
            orderLineItems: orderItems,
            basketId: currentBasketId,
            couponCodes: coupons,
            removeLineItems: !empty(order) ? (
                order.status.value === dw.order.Order.ORDER_STATUS_NEW ||
                order.status.value === dw.order.Order.ORDER_STATUS_OPEN
            ) : false,
            basketItems: basketItems
        };
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
            if (!empty(eachPriceAdjustment.promotion) && (eachPriceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER || eachPriceAdjustment.custom.thresholdDiscountType === 'order')) {
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
    getOrderDiscountHL: function (order, localizeObj, conversionPrefs) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
        localizeObj.selectedFxRate = conversionPrefs.selectedFxRate[0];
        localizeObj.selectedCountryAdjustments = conversionPrefs.selectedCountryAdjustments[0];
        return eswHelper.getOrderDiscount(order, localizeObj);
    },
    /**
     * This function is used to apply applicable shipping method and return applied shipping method
     * @param {Object} order - created order api object
     * @param {string} shippingMethodID - shipping method ID
     * @param {string} shopperCountry - shopper selected country
     * @param {boolean} isNotifyReq - request coming from order confirmation or preorder
     * @param {string} currentMethodID - current shipping method ID
     * @returns {Object} shipping method or null
     */
    applyShippingMethod: function (order, shippingMethodID, shopperCountry, isNotifyReq, currentMethodID) {
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
            if (isNotifyReq && method.displayName.equals(shippingMethodID) && method.currencyCode === cart.getCurrencyCode()) {
                if (!empty(isOverrideShippingCountry)) {
                    if (isOverrideShippingCountry[0].shippingMethod.ID.indexOf(method.ID) !== -1) {
                        shipment.setShippingMethod(method);
                        ShippingMgr.applyShippingCost(cart);
                        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart, isNotifyReq, currentMethodID);
                        eswServiceHelper.updatePaymentInstrument(cart);
                        return method;
                    }
                }
            } else if (!isNotifyReq && method.ID.equals(shippingMethodID) && method.currencyCode === cart.getCurrencyCode()) {
                shipment.setShippingMethod(method);
                dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart, false, currentMethodID);
                return method;
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
        return new dw.value.Money((eswHelper.getSubtotalObject(cart, true, false, false, localizeObj, conversionPrefs).value - this.getOrderDiscountHL(cart, localizeObj, conversionPrefs).value), localizeObj.localizeCountryObj.currencyCode);
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
        let Currency = require('dw/util/Currency'),
            Transaction = require('dw/system/Transaction'),
            currency = Currency.getCurrency(currencyCode);
        Transaction.wrap(function () {
            session.setCurrency(currency);
            if (basket) {
                basket.updateCurrency();
                dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', basket);
            } else {
                let Cart = require('*/cartridge/scripts/models/CartModel');
                let currentCart = Cart.get();
                if (currentCart) {
                    currentCart.updateCurrency();
                    currentCart.calculate();
                }
            }
        });
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
            return new dw.value.Money(shippingCost.decimalValue, localizeObj.localizeCountryObj.currencyCode);
        }
        localizeObj.applyCountryAdjustments = 'false';
        let eswEstimatedShippingTotal = pricingHelper.getConvertedPrice(shippingCost, localizeObj, conversionPrefs);
        localizeObj.applyCountryAdjustments = 'true';
        return new dw.value.Money(eswEstimatedShippingTotal, localizeObj.localizeCountryObj.currencyCode);
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
    },
    /**
    * Get promotion's threshold amount
    * @param {string} orderTotal - orderTotal
    * @param {Object} promotion - promotion
    * @return {string} - discount type
    */
    getPromoThresholdAmount: function (orderTotal, promotion) {
        let thresholds = promotion.custom.eswMinThresholdAmount[0].split(','),
            discount = '0.1',
            maxTotalThreshold = 0;
        for (let i = 0; i < thresholds.length; i++) {
            let thresholdAmount = thresholds[i].split(':');
            if (orderTotal >= Number(thresholdAmount[0]) && Number(thresholdAmount[0]) > Number(maxTotalThreshold)) {
                maxTotalThreshold = Number(thresholdAmount[0]);
                discount = thresholdAmount[1];
            }
        }
        return discount;
    },
    /** Adjusts price of discounts based on threshold promotions
    * @param {Object} currentBasket - Basket
    * @param {Object} localizeObj - localized object
    * @param {Object} conversionPrefs - conversion preferences
    */
    adjustThresholdDiscounts: function (currentBasket, localizeObj, conversionPrefs) {
        if (empty(currentBasket.priceAdjustments) && empty(currentBasket.getAllShippingPriceAdjustments())) {
            return;
        }
        let collections = require('*/cartridge/scripts/util/collections'),
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            cartTotals = eswHelper.getSubtotalObject(currentBasket, true, false, false, localizeObj, conversionPrefs),
            shippingLineItemIter;

        if (!empty(currentBasket.defaultShipment)) {
            shippingLineItemIter = currentBasket.defaultShipment.getShippingLineItems().iterator();
        } else {
            shippingLineItemIter = currentBasket.object.defaultShipment.getShippingLineItems().iterator();
        }
        let shippingLineItem = !empty(shippingLineItemIter) ? shippingLineItemIter.next() : null;
        /* Check if threshold Promo Already exists */
        if (shippingLineItem) {
            collections.forEach(shippingLineItem.shippingPriceAdjustments, function (lineItemAdjustment) {
                if (lineItemAdjustment.promotionID === 'thresholdPromo' || lineItemAdjustment.promotion.ID === 'THRESHOLD-SHIPPING-PROMO') {
                    shippingLineItem.removeShippingPriceAdjustment(lineItemAdjustment);
                }
            });
        }
        collections.forEach(currentBasket.priceAdjustments, function (eachPriceAdjustment) {
            if (eachPriceAdjustment.promotionID === 'orderthresholdPromo') {
                currentBasket.removePriceAdjustment(eachPriceAdjustment);
            }
        });
        let fxRate = (!empty(conversionPrefs.selectedFxRate) && !empty(conversionPrefs.selectedFxRate[0].rate)) ? Number(conversionPrefs.selectedFxRate[0].rate) : '1';
        let allLineItemIter = currentBasket.getAllLineItems().iterator();
        let discountType,
            Discount,
            percentangeDiscountValue,
            orderPriceAdjustment;
        while (allLineItemIter.hasNext()) {
            let priceAdjustment = allLineItemIter.next();
            if (!(priceAdjustment instanceof dw.order.PriceAdjustment)) {
                /* eslint-disable no-continue */
                continue;
            }
            if (priceAdjustment.promotion && priceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER && this.isThresholdEnabled(priceAdjustment.promotion)) {
                discountType = this.getDiscountType(priceAdjustment.promotion);
                Discount = this.getPromoThresholdAmount(cartTotals.value, priceAdjustment.promotion);
                /* eslint-disable eqeqeq */
                if (discountType == 'amount_off') {
                    orderPriceAdjustment = currentBasket.createPriceAdjustment('orderthresholdPromo', new dw.campaign.AmountDiscount(Discount / fxRate));
                    orderPriceAdjustment.custom.thresholdDiscountType	= 'order';
                } else if (discountType == 'percentage_off') {
                    percentangeDiscountValue = (cartTotals.value / 100) * Discount;
                    orderPriceAdjustment = currentBasket.createPriceAdjustment('orderthresholdPromo', new dw.campaign.AmountDiscount(percentangeDiscountValue / fxRate));
                    orderPriceAdjustment.custom.thresholdDiscountType	= 'order';
                }
            } else if (priceAdjustment.promotion && priceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_SHIPPING && this.isThresholdEnabled(priceAdjustment.promotion)) {
                discountType = this.getDiscountType(priceAdjustment.promotion);
                Discount = this.getPromoThresholdAmount(cartTotals.value, priceAdjustment.promotion);
                let shippingPrice = !empty(currentBasket.defaultShipment) ? currentBasket.defaultShipment.adjustedShippingTotalPrice : currentBasket.object.defaultShipment.adjustedShippingTotalPrice;
                /* eslint-disable eqeqeq */
                /* eslint-disable new-cap */
                if (discountType == 'free' || Discount == '0') {
                    let newPriceAdjustment = shippingLineItem.createShippingPriceAdjustment('thresholdPromo', dw.campaign.AmountDiscount(shippingPrice.value));
                    newPriceAdjustment.custom.thresholdDiscountType	= 'free';
                } else if (discountType == 'amount_off') {
                    shippingLineItem.createShippingPriceAdjustment('thresholdPromo', dw.campaign.AmountDiscount(Discount / fxRate));
                } else if (discountType == 'percentage_off') {
                    let shippingRate = shippingPrice * fxRate;
                    percentangeDiscountValue = (shippingRate / 100) * Discount;
                    shippingLineItem.createShippingPriceAdjustment('thresholdPromo', dw.campaign.AmountDiscount(percentangeDiscountValue / fxRate));
                }
            }
        }
        currentBasket.updateTotals();
        eswHelper.removeThresholdPromo(currentBasket);
    }
};

module.exports = eswHelperHL;
