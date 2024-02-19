/* eslint-disable block-scoped-var */
/* eslint-disable no-param-reassign */
'use strict';

const collections = require('*/cartridge/scripts/util/collections');
const Logger = require('dw/system/Logger');
const Resource = require('dw/web/Resource');
const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');

// Script Includes
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');

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
        let selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters);
        if (!empty(selectedCountryDetail.countryCode) && !empty(doc.price)) {
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency) && !selectedCountryDetail.isFixedPriceModel) {
                let selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);

                if ('price' in doc && !empty(doc.price)) {
                    doc.price = eswCoreHelper.getMoneyObject(doc.price.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }

                if ('priceMax' in doc && !empty(doc.priceMax)) {
                    doc.priceMax = eswCoreHelper.getMoneyObject(doc.priceMax.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }

                if ('pricePerUnit' in doc && !empty(doc.pricePerUnit)) {
                    doc.pricePerUnit = eswCoreHelper.getMoneyObject(doc.pricePerUnit.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }

                if ('pricePerUnitMax' in doc && !empty(doc.pricePerUnitMax)) {
                    doc.pricePerUnitMax = eswCoreHelper.getMoneyObject(doc.pricePerUnitMax.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }
            }
            // custom attribute to check if product is restricted in selected country
            doc.c_eswRestrictedProduct = eswHelperHL.isProductRestricted(doc.id, selectedCountryDetail.countryCode);
            doc.c_eswRestrictedProductMsg = doc.c_eswRestrictedProduct ? Resource.msg('esw.product.notavailable', 'esw', null) : '';
            // custom attribute to check if product return is prohibited in selected country
            doc.c_eswReturnProhibited = !doc.c_eswRestrictedProduct ? eswHelperHL.isReturnProhibited(doc.id, selectedCountryDetail.countryCode) : false;
            doc.c_eswReturnProhibitedMsg = eswPwaHelper.getContentAsset('esw-display-return-prohibited-message');

            doc.currency = shopperCurrency;
            let modifiedVariants = [];
            if (doc.c_eswRestrictedProduct && doc.variants && doc.variants.length > 0) {
                for (let i = 0; i < doc.variants.length; i++) {
                    let currentVariant = doc.variants[i];
                    currentVariant.orderable = false;
                    modifiedVariants.push(currentVariant);
                }
                doc.variants = modifiedVariants;
            }
        }
    },
    /**
     * This function covers the logic of converting
     * the pricing related attributes to eSW Prices
     * for PLP - Product Listing Page (product_search end-point)
     * @param {Object} doc - Response document
     */
    eswPlpPriceConversions: function (doc) {
        let selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters);
        if (!empty(selectedCountryDetail.countryCode) && doc.count > 0) {
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency)) {
                let selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
                for (let i = 0; i < doc.count; i++) {
                    if (!selectedCountryDetail.isFixedPriceModel) {
                        if ('price' in doc.hits[i] && !empty(doc.hits[i].price)) {
                            doc.hits[i].price = eswCoreHelper.getMoneyObject(doc.hits[i].price.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }

                        if ('priceMax' in doc.hits[i] && !empty(doc.hits[i].priceMax)) {
                            doc.hits[i].priceMax = eswCoreHelper.getMoneyObject(doc.hits[i].priceMax.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }

                        if ('pricePerUnit' in doc.hits[i] && !empty(doc.hits[i].pricePerUnit)) {
                            doc.hits[i].pricePerUnit = eswCoreHelper.getMoneyObject(doc.hits[i].pricePerUnit.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }

                        if ('pricePerUnitMax' in doc.hits[i] && !empty(doc.hits[i].pricePerUnitMax)) {
                            doc.hits[i].pricePerUnitMax = eswCoreHelper.getMoneyObject(doc.hits[i].pricePerUnitMax.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        }
                    }

                    doc.hits[i].currency = shopperCurrency;
                    // custom attribute to check if product is restricted in selected country
                    doc.hits[i].c_eswRestrictedProduct = eswHelperHL.isProductRestricted(doc.hits[i].product_id, selectedCountryDetail.countryCode);
                    // custom attribute to check if product return is prohibited in selected country
                    doc.hits[i].c_eswReturnProhibited = eswHelperHL.isReturnProhibited(doc.hits[i].product_id, selectedCountryDetail.countryCode);
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
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
        let selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters);

        if (!empty(selectedCountryDetail.countryCode) && selectedCountryDetail.isFixedPriceModel) {
            let currencyCode = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(currencyCode)) {
                pricingHelper.setOverridePriceBooks(selectedCountryDetail.countryCode, currencyCode, basket);
            }
        }
    },
    /**
     * Handles eShopWorld Checkout (PreOrder) API Call (Request, Response)
     * @param {Object} order - Order object SFCC API
     * @param {Object} orderResponse - Order object from OCAPI Response
     */
    handleEswPreOrderCall: function (order, orderResponse) {
        let checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            param = request.httpParameters,
            selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters);

        if (!empty(selectedCountryDetail.countryCode) && eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
            let shopperCountry = selectedCountryDetail.countryCode;
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency)) {
                // API Includes
                let shopperLocale = !empty(param.locale) ? param.locale[0] : order.customerLocaleID;
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
        let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
            checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters);

        if (!empty(selectedCountryDetail.countryCode) && eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: selectedCountryDetail.countryCode,
                        currencyCode: shopperCurrency
                    },
                    applyCountryAdjustments: 'true',
                    applyRoundingModel: 'true'
                };
                let conversionPrefs = pricingHelper.getConversionPreference(localizeObj);

                checkoutHelper.setEswBasketAttributes(basket, localizeObj, conversionPrefs);
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
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            param = request.httpParameters,
            selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters);

        if (!empty(selectedCountryDetail.countryCode) && eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency)) {
                let localizeObj = {
                    localizeCountryObj: {
                        countryCode: selectedCountryDetail.countryCode,
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
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
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
    /**
     * Modify basket, this function should use whenever change in basket is required
     * @param {*} basketOrCustomer - is it basket or customer object
     * @param {*} doc - response doc
     * @param {string} calledBy - check where from it is being called
     */
    basketItemsModifyResponse: function (basketOrCustomer, doc, calledBy) {
        let basketLineItems;
        let docBasket;
        let currentBasket = BasketMgr.getCurrentBasket();
        let countryParam = empty(request.httpParameters.get('locale')) && !empty(currentBasket) ? currentBasket.custom.eswShopperCurrency : request.httpParameters;
        if (!empty(countryParam)) {
            switch (calledBy) {
                case 'modifyGETResponse_v2':
                    basketLineItems = doc.baskets[0].productItems;
                    docBasket = doc.baskets[0];
                    break;
                default:
                    basketLineItems = doc.productItems;
                    docBasket = doc;
                    break;
            }
            let selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(countryParam);
            let selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(selectedCountryDetail.countryCode)) {
                if (!selectedCountryDetail.isFixedPriceModel) {
                    docBasket.productTotal = eswCoreHelper.getMoneyObject(docBasket.productTotal.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                    docBasket.productSubTotal = eswCoreHelper.getMoneyObject(docBasket.productSubTotal.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                    docBasket.currency = shopperCurrency;
                    if (docBasket.shippingTotal) {
                        docBasket.shippingTotal = eswCoreHelper.getMoneyObject(docBasket.shippingTotal.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                    }
                    if (docBasket.orderPriceAdjustments.length > 0) {
                        collections.forEach(docBasket.orderPriceAdjustments, function (orderPriceAdjustment) {
                            orderPriceAdjustment.price = eswCoreHelper.getMoneyObject(orderPriceAdjustment.price.toString(), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj, true).value;
                        });
                    }
                }
                let modifiedLi = eswPwaHelper.modifyLineItems(basketLineItems, selectedCountryLocalizeObj);
                docBasket.productItems = modifiedLi.docModifiedLineItems;
                docBasket.c_isOrderAbleBasket = modifiedLi.isOrderableBasket;
                docBasket.orderTotal = eswPwaHelper.getGrandTotal(currentBasket, selectedCountryDetail, docBasket);
            }
        }
    },
    basketModifyGETResponse_v2: function (customer, doc) {
        this.basketItemsModifyResponse(customer, doc, 'modifyGETResponse_v2');
    },
    basketModifyPUTResponse: function (customer, doc) {
        this.basketItemsModifyResponse(customer, doc);
    },
    deleteBasketItem: function (basket, doc) {
        this.basketItemsModifyResponse(basket, doc, 'modifyDELETEResponse');
    },
    /**
     * Handles eShopWorld order history page request
     * @param {Object} orderResponse - Order object from OCAPI Response
     */
    handleEswOrdersHistoryCall: function (orderResponse) {
        try {
            let eswShopperCurrencyCode = null;
            if (orderResponse.count > 0) {
                let orders = orderResponse.data;
                for (let i = 0; i < orders.length; i++) {
                    let order = orders[i];
                    eswShopperCurrencyCode = 'c_eswShopperCurrencyCode' in order && order.c_eswShopperCurrencyCode ? order.c_eswShopperCurrencyCode : null;
                    orders[i].orderTotal = (eswShopperCurrencyCode != null) ? order.c_eswShopperCurrencyPaymentAmount : order[i].orderTotal;
                    orders[i].currency = (eswShopperCurrencyCode != null) ? eswShopperCurrencyCode : order[i].currency;
                }
            }
        } catch (error) {
            Logger.error(error.message + error.stack);
        }
    },
    /**
     * get subtotal for calculated price model on order history.
     * @param {productItems} productItems - the current line item container
     * @returns {string} the formatted money value
     */
    getCalculatedSubTotal: function (productItems) {
        let subTotal = 0;
        collections.forEach(productItems, function (productLineItem) {
            subTotal += Number((productLineItem.c_eswShopperCurrencyItemPriceInfo * productLineItem.quantity));
        });
        return subTotal;
    },
    /**
     * update product prices for ESW orders.
     * @param {productItems} productItems - the current line item container
     */
    updateProductPrices: function (productItems) {
        collections.forEach(productItems, function (productLineItem) {
            let price = Number((productLineItem.c_eswShopperCurrencyItemPriceInfo * productLineItem.quantity));
            productLineItem.basePrice = price;
            productLineItem.price = price;
            productLineItem.priceAfterItemDiscount = price;
        });
    },
    /**
     * update product prices for ESW orders.
     * @param {shipments} shipments - shipments
     * @param {string} eswTrackingUrl - ESW tracking URL
     */
    updateTrackingNumber: function (shipments, eswTrackingUrl) {
        collections.forEach(shipments, function (shipment) {
            shipment.trackingNumber = !empty(eswTrackingUrl) ? eswTrackingUrl : '#';
        });
    },
    /**
     * Handles eShopWorld order detail page request
     * @param {Object} orderResponse - Order object from OCAPI Response
     */
    handleEswOrderDetailCall: function (orderResponse) {
        try {
            let eswShopperCurrencyCode = null,
                order = orderResponse;
            eswShopperCurrencyCode = 'c_eswShopperCurrencyCode' in order && order.c_eswShopperCurrencyCode ? order.c_eswShopperCurrencyCode : null;
            if (eswShopperCurrencyCode != null) {
                orderResponse.orderTotal = order.c_eswShopperCurrencyPaymentAmount;
                orderResponse.currency = eswShopperCurrencyCode;
                orderResponse.shippingTotal = order.c_eswShopperCurrencyDeliveryPriceInfo;
                orderResponse.productSubTotal = this.getCalculatedSubTotal(orderResponse.productItems);
                this.updateProductPrices(orderResponse.productItems);
                orderResponse.taxTotal = !eswCoreHelper.getEShopWorldTaxInformationEnabled() && 'c_eswShopperCurrencyTaxes' in orderResponse ? orderResponse.c_eswShopperCurrencyTaxes : 0;
                if ('c_eswReceivedASN' in orderResponse && orderResponse.c_eswReceivedASN && 'c_eswPackageReference' in orderResponse) {
                    if (!orderResponse.shipments.empty) {
                        this.updateTrackingNumber(orderResponse.shipments, orderResponse.c_eswTrackingURL);
                    }
                }
            }
        } catch (error) {
            Logger.error(error.message + error.stack);
        }
    },
    handleCustomerPostResponse: function (newCustomer, customerInfo) {
        let ordernumber = eswPwaHelper.getCustomerCustomObject(customerInfo.customer.email),
            order = OrderMgr.getOrder(ordernumber),
            Transaction = require('dw/system/Transaction');
        let emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers'),
            Site = require('dw/system/Site');
        let URLUtils = require('dw/web/URLUtils');
        if (order) {
            Transaction.wrap(function () {
                order.setCustomer(newCustomer);
            });
        }

        let userObject = {
            email: newCustomer.profile.email,
            firstName: newCustomer.profile.firstName,
            lastName: newCustomer.profile.lastName,
            url: URLUtils.https('Login-Show')
        };

        let emailObj = {
            to: newCustomer.profile.email,
            subject: Resource.msg('email.subject.new.registration', 'registration', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
            type: emailHelpers.emailTypes.registration
        };

        emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountRegisteredEmail', userObject);
    },
    /** Adjusts price of discounts based on threshold promotions
     * @param {Object} currentBasket - Basket
     * @param {number} cartTotalsPwa - cartTotalsPwa
     * @param {Object} localizeObj - localizeObj
     */
    adjustThresholdDiscounts: function (currentBasket, cartTotalsPwa, localizeObj) {
        if (empty(currentBasket.priceAdjustments) && empty(currentBasket.getAllShippingPriceAdjustments())) {
            return;
        }
        let allShippingPriceAdjustmentsIter = currentBasket.getAllShippingPriceAdjustments().iterator();
        let cartTotals = cartTotalsPwa;
        let shippingLineItem;
        let fxRate = (!empty(localizeObj.selectedFxRate) && !empty(localizeObj.selectedFxRate.rate)) ? localizeObj.selectedFxRate.rate : '1';
        if (allShippingPriceAdjustmentsIter.hasNext()) {
            let shippingLineItemIter;
            if (!empty(currentBasket.defaultShipment)) {
                shippingLineItemIter = currentBasket.defaultShipment.getShippingLineItems().iterator();
            } else {
                shippingLineItemIter = currentBasket.object.defaultShipment.getShippingLineItems().iterator();
            }
            shippingLineItem = !empty(shippingLineItemIter) ? shippingLineItemIter.next() : null;
            /* Check if threshold Promo Already exists */
            if (shippingLineItem) {
                collections.forEach(shippingLineItem.shippingPriceAdjustments, function (lineItemAdjustment) {
                    if (lineItemAdjustment.promotionID === 'thresholdPromo') {
                        shippingLineItem.removeShippingPriceAdjustment(lineItemAdjustment);
                    }
                });
            }
        }
        collections.forEach(currentBasket.priceAdjustments, function (eachPriceAdjustment) {
            if (eachPriceAdjustment.promotionID === 'orderthresholdPromo') {
                currentBasket.removePriceAdjustment(eachPriceAdjustment);
            }
        });
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
            if (priceAdjustment.promotion && priceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER && eswCoreHelper.isThresholdEnabled(priceAdjustment.promotion)) {
                discountType = eswCoreHelper.getDiscountType(priceAdjustment.promotion);
                Discount = eswCoreHelper.getPromoThresholdAmount(cartTotals, priceAdjustment.promotion);
                if (Discount === '0.1') {
                    /* eslint-disable no-continue */
                    continue;
                }
                /* eslint-disable eqeqeq */
                if (discountType == 'amount_off') {
                    orderPriceAdjustment = currentBasket.createPriceAdjustment('orderthresholdPromo', new dw.campaign.AmountDiscount(Discount / fxRate));
                    orderPriceAdjustment.custom.thresholdDiscountType = 'order';
                } else if (discountType == 'percentage_off') {
                    percentangeDiscountValue = (cartTotals / 100) * Discount;
                    orderPriceAdjustment = currentBasket.createPriceAdjustment('orderthresholdPromo', new dw.campaign.AmountDiscount(percentangeDiscountValue / fxRate));
                    orderPriceAdjustment.custom.thresholdDiscountType = 'order';
                }
            } else if (priceAdjustment.promotion && priceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_SHIPPING) {
                if (eswCoreHelper.isThresholdEnabled(priceAdjustment.promotion)) {
                    discountType = eswCoreHelper.getDiscountType(priceAdjustment.promotion);
                    Discount = eswCoreHelper.getPromoThresholdAmount(cartTotals, priceAdjustment.promotion);
                    if (Discount === '0.1') {
                        /* eslint-disable no-continue */
                        continue;
                    }
                    let shippingPrice = !empty(currentBasket.defaultShipment) ? currentBasket.defaultShipment.adjustedShippingTotalPrice : currentBasket.object.defaultShipment.adjustedShippingTotalPrice;
                    /* eslint-disable eqeqeq */
                    /* eslint-disable new-cap */
                    if (discountType == 'free' || Discount == '0') {
                        let newPriceAdjustment = shippingLineItem.createShippingPriceAdjustment('thresholdPromo', dw.campaign.AmountDiscount(shippingPrice.value));
                        newPriceAdjustment.custom.thresholdDiscountType = 'free';
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
            eswCoreHelper.removeThresholdPromo(currentBasket);
        }
    }
};

module.exports = OCAPIHelper;
