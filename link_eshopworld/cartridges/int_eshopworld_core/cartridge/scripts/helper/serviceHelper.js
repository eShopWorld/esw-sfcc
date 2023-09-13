/* eslint-disable eqeqeq */
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable quote-props */
/**
 * Helper script to get all ESW site preferences
 **/
const Site = require('dw/system/Site').getCurrent();

const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const collections = require('*/cartridge/scripts/util/collections');
const BasketMgr = require('dw/order/BasketMgr');
const eswServiceHelperV3 = require('*/cartridge/scripts/helper/serviceHelperV3');
const StringUtils = require('dw/util/StringUtils');

/**
 * function to prepare pre order request object for API Version 2
 * @returns {Object} - request object
 */
function preparePreOrder() {
    let preorderCheckoutServiceName = eswHelper.getCheckoutServiceName();
    let currentBasket = BasketMgr.getCurrentBasket();
    let requestObj = {};
    if (currentBasket != null) {
        if (preorderCheckoutServiceName.indexOf('EswCheckoutV3Service') !== -1) {
            let lineItemsV3 = eswServiceHelperV3.getLineItemsV3();
            let cartDiscounts = eswServiceHelperV3.getCartDiscountPriceInfo(currentBasket, lineItemsV3.finalCartSubtotal);
            if (!empty(cartDiscounts.discounts)) {
                requestObj = {
                    'contactDetails': getContactDetails(currentBasket.getCustomerEmail()),
                    'retailerPromoCodes': getRetailerPromoCodes(),
                    'lineItems': lineItemsV3.lineItems,
                    'cartDiscountPriceInfo': cartDiscounts,
                    'shopperCurrencyIso': !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
                    'pricingSynchronizationId': eswHelper.getPricingSynchronizationId(),
                    'deliveryCountryIso': request.getHttpCookies()['esw.location'].value,
                    'retailerCheckoutExperience': this.getExpansionPairs(),
                    'shopperCheckoutExperience': eswServiceHelperV3.getShopperCheckoutExperience(),
                    'deliveryOptions': getShippingRates(false)
                };
            } else {
                requestObj = {
                    'contactDetails': getContactDetails(currentBasket.getCustomerEmail()),
                    'retailerPromoCodes': getRetailerPromoCodes(),
                    'lineItems': lineItemsV3.lineItems,
                    'shopperCurrencyIso': !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
                    'pricingSynchronizationId': eswHelper.getPricingSynchronizationId(),
                    'deliveryCountryIso': request.getHttpCookies()['esw.location'].value,
                    'retailerCheckoutExperience': this.getExpansionPairs(),
                    'shopperCheckoutExperience': eswServiceHelperV3.getShopperCheckoutExperience(),
                    'deliveryOptions': getShippingRates(false)
                };
            }
        } else {
            let cartItemsV2 = getCartItemsV2();
            let cartDiscounts = getCartDiscounts(currentBasket, cartItemsV2.finalCartSubtotal);
            if (!empty(cartDiscounts) && cartDiscounts.length > 0) {
                requestObj = {
                    'contactDetails': getContactDetails(currentBasket.getCustomerEmail()),
                    'retailerPromoCodes': getRetailerPromoCodes(),
                    'cartItems': cartItemsV2.cartItems,
                    'cartDiscounts': cartDiscounts,
                    'shopperCurrencyIso': !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
                    'deliveryCountryIso': request.getHttpCookies()['esw.location'].value,
                    'retailerCheckoutExperience': this.getExpansionPairs(),
                    'shopperCheckoutExperience': getShopperCheckoutExperience(),
                    'DeliveryOptions': getShippingRates(true)
                };
            } else {
                requestObj = {
                    'contactDetails': getContactDetails(currentBasket.getCustomerEmail()),
                    'retailerPromoCodes': getRetailerPromoCodes(),
                    'cartItems': cartItemsV2.cartItems,
                    'shopperCurrencyIso': !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
                    'deliveryCountryIso': request.getHttpCookies()['esw.location'].value,
                    'retailerCheckoutExperience': this.getExpansionPairs(),
                    'shopperCheckoutExperience': getShopperCheckoutExperience(),
                    'DeliveryOptions': getShippingRates(true)
                };
            }
        }
    }
    return requestObj;
}

/**
 * function to get promo or voucher codes entered on the cart by the shopper
 * @returns {Object} - Coupons
 */
function getRetailerPromoCodes() {
    let currentBasket = BasketMgr.currentBasket;
    let coupons = [];
    // eslint-disable-next-line no-prototype-builtins
    if ((currentBasket.hasOwnProperty('couponLineItems') || currentBasket.couponLineItems) && !empty(currentBasket.couponLineItems)) {
        collections.forEach((currentBasket.couponLineItems), function (couponLineItem) {
            let couponObject = {};
            couponObject.promoCode = couponLineItem.couponCode;
            couponObject.title = !empty(couponLineItem.getPriceAdjustments()) ? eswServiceHelperV3.convertPromotionMessage(couponLineItem.getPriceAdjustments()[0].promotion.name) : '';
            // eslint-disable-next-line no-prototype-builtins
            couponObject.description = !empty(couponLineItem.getPriceAdjustments()) ? couponLineItem.getPriceAdjustments()[0].promotion.hasOwnProperty('description') ? couponLineItem.getPriceAdjustments()[0].promotion.description.toString() : '' : ''; // eslint-disable-line no-nested-ternary
            coupons.push(couponObject);
        });
    }
    return coupons;
}

/**
 * function to get cart items for version 2
 * @returns {Object} - cart items
 */
function getCartItemsV2() {
    let Transaction = require('dw/system/Transaction');
    let currentBasket = BasketMgr.currentBasket,
        cartItems = [],
        loopCtr = 1,
        currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
    let totalDiscount = eswHelper.getOrderDiscount(currentBasket).value,
        totalQuantity = 0,
        remainingDiscount = totalDiscount;

    collections.forEach(currentBasket.productLineItems, function (item) {
        if (!item.bonusProductLineItem) {
            totalQuantity += item.quantity.value;
        }
    });
    let finalCartSubtotal = 0;
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (let lineItemNumber in currentBasket.productLineItems) {
        let item = currentBasket.productLineItems[lineItemNumber],
            beforeDiscount = eswHelper.getMoneyObject(item.basePrice.value, false, false).value * item.quantity.value,
            price = beforeDiscount,
            discountAmount,
            liOrderDiscount,
            discountType;
        // Apply product level promotions
        // eslint-disable-next-line no-loop-func
        collections.forEach(item.priceAdjustments, function (priceAdjustment) {
            if (priceAdjustment.appliedDiscount.type === 'FIXED_PRICE') {
                price = eswHelper.getMoneyObject(priceAdjustment.appliedDiscount.fixedPrice, false, false).value * priceAdjustment.quantity;
                if (priceAdjustment.quantity < item.quantity.value) {
                    price += (item.quantity.value - priceAdjustment.quantity) * eswHelper.getMoneyObject(item.basePrice.value, false, false).value;
                }
            } else {
                let adjustedUnitPrice = eswHelper.getMoneyObject(priceAdjustment.price, false, false, false).value;
                price -= (adjustedUnitPrice) * -1;
            }
        });
        price = (price / item.quantity.value).toFixed(3);
        finalCartSubtotal += price * item.quantity.value;
        beforeDiscount = (beforeDiscount / item.quantity.value).toFixed(3);
        let priceAfterProductPromos = price;
        if (item.bonusProductLineItem) {
            price = 0;
        }
        discountAmount = (beforeDiscount - price).toFixed(3);
        remainingDiscount -= (priceAfterProductPromos - price) * item.quantity.value;
        // eslint-disable-next-line no-loop-func
        Transaction.wrap(function () {
            item.custom.eswLineItemId = loopCtr++;
        });
        let productVariationModel = item.product.variationModel;
        let color = productVariationModel.getProductVariationAttribute('color') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).displayValue : null;
        let size = productVariationModel.getProductVariationAttribute('size') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size')).displayValue : null;
        let eswImageType = eswHelper.geteswImageType();
        let productTitle = StringUtils.truncate(item.productName, 100, 'TRUNCATE_CHAR', '');
        let cartItem = {
            'quantity': item.quantity.value,
            'estimatedDeliveryDate': null,
            'lineItemId': item.custom.eswLineItemId,
            'product': {
                'productCode': item.productID,
                'upc': null,
                'title': productTitle,
                'description': item.productName, // we are using product name/title instead of description. ESW checkout page displays description as product title. same field is used for product title name in ESW OMS which is used for logistic flows.
                'shopperCurrencyProductPriceInfo': {
                    'price': currencyCode + price,
                    'discountAmount': currencyCode + discountAmount,
                    'beforeDiscount': currencyCode + beforeDiscount,
                    'discountPercentage': null
                },
                'imageUrl': item.product.getImage(eswImageType, 0).httpURL.toString(),
                'color': color,
                'size': size,
                'isNonStandardCatalogItem': false,
                'metadataItems': getProductLineMetadataItems(item),
                'isReturnProhibited': eswHelper.isReturnProhibited(item.product)
            },
            'cartGrouping': 'Group 1',
            'metadataItems': null
        };
        cartItems.push(cartItem);
    }
    return { cartItems: cartItems, finalCartSubtotal: finalCartSubtotal };
}

/**
 * function to get order level discount info
 * @param {Object} cart - cart
 * @param {number} beforeDiscountParam - amount before discount
 * @returns {Object} - cart discount price info
 */
function getCartDiscounts(cart, beforeDiscountParam) {
    let cartSubTotal = eswHelper.getSubtotalObject(cart, true),
        obj = {},
        cartDiscounts = [],
        currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
        allPriceAdjustmentIter = cart.priceAdjustments.iterator(),
        beforeDiscount = beforeDiscountParam,
        cartDiscountTotal = 0;
    while (allPriceAdjustmentIter.hasNext()) {
        let eachPriceAdjustment = allPriceAdjustmentIter.next();
        if (eachPriceAdjustment.promotion && eswHelper.isThresholdEnabled(eachPriceAdjustment.promotion)) {
            /* eslint-disable no-continue */
            continue;
        }
        let discountValue = eswHelper.getMoneyObject((eachPriceAdjustment.priceValue * -1), true, false, true).value;
        if ((eachPriceAdjustment.promotion && eachPriceAdjustment.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER) || eachPriceAdjustment.custom.thresholdDiscountType === 'order') {
            let cartDiscount = {
                'shopperCurrencyCartDiscountAmount': {
                    'title': eachPriceAdjustment.promotionID,
                    'description': eachPriceAdjustment.lineItemText,
                    'price': currencyCode + (beforeDiscount - discountValue).toFixed(3),
                    'discountAmount': currencyCode + discountValue.toFixed(3),
                    'beforeDiscount': currencyCode + beforeDiscount.toFixed(3)
                }
            };
            cartDiscountTotal += discountValue;
            cartDiscounts.push(cartDiscount);
            /* eslint-disable no-param-reassign */
            beforeDiscount -= eachPriceAdjustment.priceValue * -1;
        }
    }
    if (cartDiscounts.length > 0) {
        obj = {
            'price': {
                'currency': currencyCode,
                'amount': cartSubTotal.value - cartDiscountTotal
            },
            'discounts': cartDiscounts
        };
    }
    return cartDiscounts;
}

/**
 * function to get cart discounts for version 2
 * @returns {Object} - Cart discounts
 */
function getCartDiscountsV2() {
    let currentBasket = BasketMgr.currentBasket,
        cartDiscounts = [],
        currencyCode = currentBasket.currencyCode,
        beforeDiscount = 0,
        totalMerchandizePrice = 0,
        price = 0,
        discountPercentage = 0,
        discountAmount = 0;
    collections.forEach(currentBasket.productLineItems, function (item) {
        beforeDiscount += item.adjustedPrice.value;
    });
    totalMerchandizePrice = beforeDiscount;
    collections.forEach(currentBasket.priceAdjustments, function (discount) {
        discountAmount = Object.hasOwnProperty.call(discount.appliedDiscount, 'amount') ? discount.appliedDiscount.amount : Math.abs(discount.price.value);
        if (beforeDiscount != totalMerchandizePrice) {
            beforeDiscount = currentBasket.adjustedMerchandizeTotalPrice + discountAmount;
        }
        price = beforeDiscount - discountAmount;
        let cartDiscount = {
            'title': discount.promotionID,
            'description': discount.lineItemText,
            'shopperCurrencyCartDiscountAmount': {
                'title': 'Discount title',
                'description': 'Shopper discount title',
                'price': currencyCode + price.toFixed(3),
                'discountAmount': currencyCode + discountAmount.toFixed(3),
                'beforeDiscount': currencyCode + beforeDiscount.toFixed(3),
                'discountPercentage': null
            }
        };
        beforeDiscount -= discountAmount;
        cartDiscounts.push(cartDiscount);
    });
    return cartDiscounts;
}

/**
 * function to get the product line item metadata.
 * sends custom attributes in
 * @param {Object} pli - productLineItem
 * @return {Array} arr - metadata Array
 */
function getProductLineMetadataItems(pli) {
    try {
        let metadataItems = eswHelper.getProductLineMetadataItemsPreference(),
            obj,
            arr = [],
            i = 0;
        if (!empty(metadataItems)) {
            // eslint-disable-next-line guard-for-in, no-restricted-syntax
            for (let item in metadataItems) {
                let metadataItem = metadataItems[item];
                i = metadataItem.indexOf('|');

                // Product line custom attribute ID
                let pliCustomAttrID = metadataItem.substring(i + 1);
                let pliCustomAttrValue = (pliCustomAttrID in pli.custom && !!pli.custom[pliCustomAttrID]) ? pli.custom[pliCustomAttrID] : null;

                if (!empty(pliCustomAttrValue)) {
                    obj = {
                        name: metadataItem.substring(0, i),
                        value: pliCustomAttrValue
                    };
                    arr.push(obj);
                }
            }
        }
        return arr.length > 0 ? arr : null;
    } catch (e) {
        let logger = require('dw/system/Logger');
        logger.error('ESW metaData Items Error: {0} {1}', e.message, e.stack);
    }
    return null;
}

/**
     * function to get shopper checkout experience for version 2
     * @returns {Object} target object
     */
function getShopperCheckoutExperience() {
    let currentBasket = BasketMgr.getCurrentBasket();
    let metaDataObj = eswHelper.getMappedBasketMetadata(currentBasket);

    let checkoutExp = {
        'useDeliveryContactDetailsForPaymentContactDetails': !!eswHelper.isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled(),
        'emailMarketingOptIn': customer.profile && customer.profile.custom.eswMarketingOptIn ? customer.profile.custom.eswMarketingOptIn : false,
        'registeredProfileId': customer.profile ? customer.profile.customerNo : null,
        'shopperCultureLanguageIso': request.getHttpCookies()['esw.LanguageIsoCode'].value.replace(/[_]+/g, '-'),
        'expressPaymentMethod': null,
        'metadataItems': metaDataObj.metaDataArray,
        'registration': metaDataObj.registration
    };
    return checkoutExp;
}

/**
     * function to get the additional expansion pairs
     * @returns {Object} target object
     */
function getExpansionPairs() {
    let URLUtils = require('dw/web/URLUtils'),
        URLAction = require('dw/web/URLAction'),
        urlExpansionPairs = eswHelper.getUrlExpansionPairs(),
        obj = {},
        i = 0;
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (let index in urlExpansionPairs) {
        i = urlExpansionPairs[index].indexOf('|');
        obj[urlExpansionPairs[index].substring(0, i)] = URLUtils.https(new URLAction(urlExpansionPairs[index].substring(i + 1), Site.ID, request.httpCookies['esw.LanguageIsoCode'].value)).toString();
    }
    obj.metadataItems = getRetailerCheckoutMetadataItems();
    return obj;
}

/**
     * function to get the additional expansion pairs
     * @returns {Object} target object
     */
function getRetailerCheckoutMetadataItems() {
    let URLUtils = require('dw/web/URLUtils'),
        metadataItems = eswHelper.getMetadataItems(),
        currentInstance = eswHelper.getSelectedInstance(),
        obj = {},
        arr = [],
        i = 0;
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (let item in metadataItems) {
        let metadataItem = metadataItems[item];
        i = metadataItem.indexOf('|');
        if (currentInstance === 'production' && (metadataItem.indexOf('OrderConfirmationBase64EncodedAuth') != -1 || metadataItem.indexOf('OrderConfirmationUri') != -1)) {
            // eslint-disable-next-line no-continue
            continue;
        } else {
            obj.Name = metadataItem.substring(0, i);
            if (metadataItem.indexOf('OrderConfirmationBase64EncodedAuth') != -1 && eswHelper.getBasicAuthEnabled() && !empty(eswHelper.getBasicAuthPassword())) {
                obj.Value = eswHelper.encodeBasicAuth();
            } else if (metadataItem.indexOf('OrderConfirmationUri') != -1) {
                obj.Value = URLUtils.https(new dw.web.URLAction(metadataItem.substring(i + 1), Site.ID, request.httpCookies['esw.LanguageIsoCode'].value)).toString();
            } else if (metadataItem.indexOf('InventoryCheckUri') != -1) {
                obj.Value = URLUtils.https(new dw.web.URLAction(metadataItem.substring(i + 1), Site.ID, request.httpCookies['esw.LanguageIsoCode'].value)).toString();
            } else if (metadataItem.indexOf('InventoryCheckBase64EncodedAuth') != -1 && eswHelper.getBasicAuthEnabled() && !empty(eswHelper.getBasicAuthPassword())) {
                obj.Value = eswHelper.encodeBasicAuth();
            } else {
                obj.Value = metadataItem.substring(i + 1);
            }
        }

        arr.push(obj);
        obj = {};
    }
    return arr;
}

/*
 * function to get customer address
 */
/**
 * function to get customer address
 * @param {string} shopperEmail - Shopper Email coming from Basket
 * @returns {Object} target object
*/
function getContactDetails(shopperEmail) {
    let metaDataArr = eswHelper.getMappedCustomerMetadata();
    if ((customer.profile == null) && (empty(shopperEmail) || shopperEmail.substring(0, 8) === 'eswUser_')) {
        return [];
    }
    let addresses = (customer.profile != null) ? customer.profile.addressBook.addresses : null,
        address = {
            'contactDetailsType': 'isDelivery',
            'email': (customer.profile != null) ? customer.profile.email : shopperEmail,
            'country': request.getHttpCookies()['esw.location'].value,
            'metadataItems': metaDataArr
        },
        addressObj = [];
    if (addresses != null && !empty(addresses)) {
        collections.forEach(addresses, function (addr) {
            if (eswHelper.getAvailableCountry() === addr.countryCode.value) {
                address = {
                    'contactDetailsType': 'isDelivery',
                    'email': customer.profile.email,
                    'contactDetailsNickName': addr.ID,
                    'addressId': addr.ID,
                    'address1': addr.address1,
                    'address2': addr.address2,
                    'address3': null,
                    'city': addr.city,
                    'region': addr.stateCode,
                    'country': addr.countryCode.value,
                    'postalCode': addr.postalCode,
                    'telephone': addr.phone,
                    'poBox': addr.postBox,
                    'firstName': addr.firstName,
                    'lastName': addr.lastName,
                    'metadataItems': metaDataArr
                };
                addressObj.push(address);
            }
        });
    }

    if (addressObj === null || empty(addressObj)) {
        addressObj.push(address);
    }
    return addressObj;
}

/**
 * Function to get shipping rates
 * @param {boolean} v2Flag for service version
 * @returns {Object} target object
 */
function getShippingRates(v2Flag) {
    let cart = BasketMgr.getCurrentOrNewBasket(),
        shippingOverrides = eswHelper.getOverrideShipping(),
        isOverrideCountry,
        ShippingMgr = require('dw/order/ShippingMgr'),
        shippingRate;

    if (shippingOverrides.length > 0) {
        isOverrideCountry = JSON.parse(shippingOverrides).filter(function (item) {
            return item.countryCode == eswHelper.getAvailableCountry();
        });
    }

    if (!empty(isOverrideCountry)) {
        if (!empty(isOverrideCountry[0].shippingMethod.ID)) {
            let shippingRates = [];
            let isConversionDisabled = 'disableConversion' in isOverrideCountry[0] && isOverrideCountry[0].disableConversion === 'true';
            // eslint-disable-next-line guard-for-in, no-restricted-syntax
            for (let rate in isOverrideCountry[0].shippingMethod.ID) {
                let shippingMethod = this.applyShippingMethod(null, isOverrideCountry[0].shippingMethod.ID[rate], eswHelper.getAvailableCountry(), false);
                if (shippingMethod != null && cart.adjustedShippingTotalPrice.valueOrNull != null) {
                    let currencyIso = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
                    let adjustedShippingCost = (isConversionDisabled || cart.adjustedShippingTotalPrice.value === 0) ? cart.adjustedShippingTotalPrice : eswHelper.getMoneyObject(cart.adjustedShippingTotalPrice, true, false, false);
                    if (!v2Flag) {
                        let discountObj = eswServiceHelperV3.getDeliveryDiscounts(cart, isConversionDisabled);
                        shippingRate = {
                            'deliveryOption': shippingMethod.displayName,
                            'deliveryOptionOverridePriceInfo': {
                                'price': {
                                    'currency': currencyIso,
                                    'amount': discountObj.finalPrice.toFixed(3)
                                },
                                'discounts': discountObj.ShippingDiscounts
                            },
                            'metadataItems': null
                        };
                    } else {
                        shippingRate = {
                            'DeliveryOption': shippingMethod.displayName,
                            'ShopperCurrencyOveridePriceInfo': {
                                'Title': 'SCOPI_Title',
                                'Description': 'SCOPI_Description',
                                'Price': currencyIso + adjustedShippingCost.value
                            },
                            'MetadataItems': null
                        };
                    }
                    shippingRates.push(shippingRate);
                }
            }
            if (!v2Flag) {
                let shippingMethod = !empty(shippingRates) ? this.applyShippingMethod(cart, shippingRates[0].deliveryOption, eswHelper.getAvailableCountry(), false) : null;
            } else {
                let shippingMethod = !empty(shippingRates) ? this.applyShippingMethod(cart, shippingRates[0].DeliveryOption, eswHelper.getAvailableCountry(), false) : null;
            }
            return shippingRates;
        }
    } else if (!empty(cart.defaultShipment) && !empty(cart.defaultShipment.shippingPriceAdjustments)) {
        let shippingRates = [];
        let discountObj = {};
        let currencyIso = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
        collections.forEach(cart.defaultShipment.shippingPriceAdjustments, function (adjustment) {
            if (adjustment.appliedDiscount.type == dw.campaign.Discount.TYPE_FREE || adjustment.custom.thresholdDiscountType === 'free') {
                if (!v2Flag) {
                    discountObj = eswServiceHelperV3.getDeliveryDiscounts(cart, false);
                    shippingRate = {
                        'deliveryOption': 'POST',
                        'deliveryOptionOverridePriceInfo': {
                            'price': {
                                'currency': currencyIso,
                                'amount': 0
                            },
                            'discounts': discountObj.ShippingDiscounts
                        },
                        'metadataItems': null
                    };
                } else {
                    shippingRate = {
                        'DeliveryOption': 'POST',
                        'ShopperCurrencyOveridePriceInfo': {
                            'Title': 'SCOPI_Title',
                            'Description': 'SCOPI_Description',
                            'Price': currencyIso + 0
                        },
                        'MetadataItems': null
                    };
                }
                shippingRates.push(shippingRate);
            }
        });
        return shippingRates;
    } else if (cart.adjustedShippingTotalPrice.value == 0) {
        let shippingRates = [];
        let currencyIso = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
        if (!v2Flag) {
            shippingRate = {
                'deliveryOption': 'POST',
                'deliveryOptionOverridePriceInfo': {
                    'price': {
                        'currency': currencyIso,
                        'amount': 0
                    },
                    'discounts': []
                },
                'metadataItems': null
            };
        } else {
            shippingRate = {
                'DeliveryOption': 'POST',
                'ShopperCurrencyOveridePriceInfo': {
                    'Title': 'SCOPI_Title',
                    'Description': 'SCOPI_Description',
                    'Price': currencyIso + 0
                },
                'MetadataItems': null
            };
        }
        shippingRates.push(shippingRate);
        return shippingRates;
    }
    return null;
}

/*
 * Function applies derived shipping method for Fixed rate country
 */
/**
     * Function applies derived shipping method for Fixed rate country
     * @param {obj} obj object
     * @param {string} shippingMethodID string
     * @param {string} country string
     * @param {boolean} ignoreCurrency string
     * @returns {Object} target object
     */
function applyShippingMethod(obj, shippingMethodID, country, ignoreCurrency) {
    let Transaction = require('dw/system/Transaction'),
        ShippingMgr = require('dw/order/ShippingMgr'),
        isOverrideShippingCountry;

    let shippingOverrides = eswHelper.getOverrideShipping();
    if (shippingOverrides.length > 0) {
        isOverrideShippingCountry = JSON.parse(shippingOverrides).filter(function (item) {
            return item.countryCode == country;
        });
    }

    let cart = (obj != null) ? obj : BasketMgr.getCurrentOrNewBasket();
    if (cart.productQuantityTotal <= 0) {
        return {};
    }

    let shipment = cart.getShipment(cart.getDefaultShipment().getID());
    let shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();

    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (let shippingMethod in shippingMethods) {
        let method = shippingMethods[shippingMethod];
        if (obj == null && cart.productQuantityTotal > 0) {
            if (ignoreCurrency) {
                if (method.ID.equals(shippingMethodID)) {
                    // eslint-disable-next-line no-loop-func
                    Transaction.wrap(function () {
                        shipment.setShippingMethod(method);
                        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
                    });
                    return method;
                }
            } else if (method.ID.equals(shippingMethodID) && method.currencyCode == session.getCurrency()) {
                // eslint-disable-next-line no-loop-func
                Transaction.wrap(function () {
                    shipment.setShippingMethod(method);
                    dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
                });
                return method;
            }
        } else if (method.displayName.equals(shippingMethodID) && method.currencyCode == cart.getCurrencyCode()) {
            if (!empty(isOverrideShippingCountry)) {
                if (isOverrideShippingCountry[0].shippingMethod.ID.indexOf(method.ID) != -1) {
                    // eslint-disable-next-line no-loop-func
                    Transaction.wrap(function () {
                        shipment.setShippingMethod(method);
                        ShippingMgr.applyShippingCost(cart);
                        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart, true);
                        updatePaymentInstrument(cart);
                    });
                    return method;
                }
            }
        }
    }
    return null;
}
/**
 * This function is used to fetch default applicable shipping method
 * @param {Object} cart object
 */
function getApplicableDefaultShippingMethod(cart) {
    let ShippingMgr = require('dw/order/ShippingMgr'),
        shipment = cart.getShipment(cart.getDefaultShipment().getID()),
        shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods(),
        defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
    let shippingOverrides = eswHelper.getOverrideShipping(),
        isOverrideCountry;
    if (shippingOverrides.length > 0) {
        isOverrideCountry = JSON.parse(shippingOverrides).filter(function (item) {
            return item.countryCode == eswHelper.getAvailableCountry();
        });
    }
    let selectedShippingMethod = !empty(isOverrideCountry) ? this.applyShippingMethod(null, isOverrideCountry[0].shippingMethod.ID, eswHelper.getAvailableCountry(), true) : null;
    if (empty(selectedShippingMethod) && !!defaultShippingMethod) {
        applyDefaultShippingMethod(shippingMethods, defaultShippingMethod);
    } else {
        this.applyShippingMethod(null, shippingMethods[0].ID, eswHelper.getAvailableCountry(), true);
    }
}

/**
 * This function is used to apply default shipping method
 * @param {Object} shippingMethods object
 * @param {Object} defaultShippingMethod object
 */
function applyDefaultShippingMethod(shippingMethods, defaultShippingMethod) {
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (let shippingMethod in shippingMethods) {
        let method = shippingMethods[shippingMethod];
        if (method.ID.equals(defaultShippingMethod.ID) && method.currencyCode == session.getCurrency()) {
            this.applyShippingMethod(null, method.ID, eswHelper.getAvailableCountry(), true);
            break;
        }
    }
}
/**
 * This function is updating payment instrument in current basket
 * @param {Object} cart object
 */
function updatePaymentInstrument(cart) {
    let PaymentMgr = require('dw/order/PaymentMgr');
    let paymentInstruments = cart.getPaymentInstruments('ESW_PAYMENT');
    let oldInstrument = null;
    if (paymentInstruments.length > 0) {
        for (let i = 0; i < paymentInstruments.length; i++) {
            let pi = paymentInstruments[i];
            oldInstrument = pi;
            cart.removePaymentInstrument(pi);
        }
        let paymentInstrument = cart.createPaymentInstrument('ESW_PAYMENT', cart.totalGrossPrice);
        // eslint-disable-next-line no-param-reassign
        cart.paymentInstruments[0].paymentTransaction.paymentProcessor = PaymentMgr.getPaymentMethod(oldInstrument.getPaymentMethod()).getPaymentProcessor();
    }
}
/**
 * Merges properties from source object to target object
 * @param {Object} shipment object
 * @returns {Object} target object
 */
function getShipmentShippingAddress(shipment) {
    try {
        let shippingAddress = shipment.getShippingAddress();
        // If the shipment has no shipping address yet, create one.
        if (shippingAddress == null) {
            shippingAddress = shipment.createShippingAddress();
        }
        return shippingAddress;
    } catch (e) {
        let logger = require('dw/system/Logger');
        logger.error('ESW shipment shipping address Error: {0} {1}', e.message, e.stack);
    }
    return null;
}
/**
 * This function is used to get non gift certificate amount from Basket
 * @param {Object} cart object
 * @returns {Object} target object
 */
function getNonGiftCertificateAmount(cart) {
    let Money = require('dw/value/Money');

    // The total redemption amount of all gift certificate payment instruments in the basket.
    let giftCertTotal = new Money(0.0, cart.getCurrencyCode());

    // Gets the list of all gift certificate payment instruments
    let gcPaymentInstrs = cart.getGiftCertificatePaymentInstruments();
    let iter = gcPaymentInstrs.iterator();
    let orderPI = null;

    // Sums the total redemption amount.
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    // Gets the order total.
    let orderTotal = cart.getTotalGrossPrice();

    // Calculates the amount to charge for the payment instrument.
    // This is the remaining open order total that must be paid.
    let amountOpen = orderTotal.subtract(giftCertTotal);

    // Returns the open amount to be paid.
    return amountOpen;
}

/**
 * This function is used to get non gift certificate amount from Basket
 * @returns {Object} target object
 */
// eslint-disable-next-line consistent-return, require-jsdoc
function createOrder() {
    let cart = BasketMgr.getCurrentOrNewBasket(),
        Transaction = require('dw/system/Transaction'),
        logger = require('dw/system/Logger'),
        PaymentInstrument = require('dw/order/PaymentInstrument'),
        PaymentMgr = require('dw/order/PaymentMgr'),
        OrderMgr = require('dw/order/OrderMgr'),
        availableCountry = eswHelper.getAvailableCountry(),
        order;

    if (cart.productQuantityTotal <= 0) {
        return {};
    }
    delete session.privacy.orderNo;
    Transaction.wrap(function () {
        let lineItemItr = cart.allProductLineItems.iterator();
        while (lineItemItr.hasNext()) {
            let productItem = lineItemItr.next();

            let eswUnitPriceWithRounding = eswHelper.getMoneyObject(productItem.basePrice.value, false, false, false).value;
            let eswUnitPriceWithoutRounding = eswHelper.getMoneyObject(productItem.basePrice.value, false, false, true).value;

            productItem.custom.eswUnitPrice = eswUnitPriceWithRounding;
            productItem.custom.eswDeltaRoundingValue = eswUnitPriceWithRounding - eswUnitPriceWithoutRounding;
        }
        let shippingAddress = getShipmentShippingAddress(cart.getDefaultShipment());
        shippingAddress.setCountryCode(availableCountry);

        let billingAddress = cart.createBillingAddress();
        billingAddress.firstName = 'eswUser';
        billingAddress.lastName = 'eswUser';
        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);

        let paymentInstrument = cart.createPaymentInstrument('ESW_PAYMENT', getNonGiftCertificateAmount(cart));

        let email = (cart.getCustomerEmail()) ? cart.getCustomerEmail() : 'eswUser_' + new Date().getTime() + '@gmail.com';
        if (customer.profile !== null) {
            email = customer.profile.email;
        }
        cart.setCustomerEmail(email);
        eswHelper.removeThresholdPromo(cart);
    });
    try {
        order = Transaction.wrap(function () {
            return OrderMgr.createOrder(cart);
        });
        session.privacy.orderNo = order.orderNo;
        Transaction.wrap(function () {
            order.paymentInstruments[0].paymentTransaction.paymentProcessor = PaymentMgr.getPaymentMethod(order.paymentInstruments[0].getPaymentMethod()).getPaymentProcessor();
        });


        let selectedFxRate = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate) : '';
        Transaction.wrap(function () {
            if (!empty(selectedFxRate)) {
                let selectedCountryDetail = eswHelper.getSelectedCountryDetail(availableCountry),
                    isFixedPriceCountry = selectedCountryDetail.isFixedPriceModel;
                if (!isFixedPriceCountry) {
                    order.custom.eswFxrate = Number(selectedFxRate.rate).toFixed(4);
                } else {
                    let defaultCurrencyCode = selectedCountryDetail.defaultCurrencyCode;
                    let fixedCountryWithDefaultCurrencyPriceBook,
                        overridePricebooks = eswHelper.getOverridePriceBooks(availableCountry);
                    if (overridePricebooks.length > 0 && defaultCurrencyCode !== eswHelper.getPriceBookCurrency(overridePricebooks[0])) {
                        order.custom.eswFxrate = Number(selectedFxRate.rate).toFixed(4);
                    }
                }
            }
            order.custom.eswShopperCurrencyTotalOrderDiscount = eswHelper.getOrderDiscount(order).value;
        });

        return order.orderNo;
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
    }
}

/**
 * Function to change order state to Failed
 * @returns {boolean} - order failed or not.
 */
function failOrder() {
    let Transaction = require('dw/system/Transaction');
    let OrderMgr = require('dw/order/OrderMgr');
    let order = OrderMgr.getOrder(session.privacy.orderNo);

    if (empty(order)) return true;

    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
        delete session.privacy.orderNo;
        let cart = BasketMgr.getCurrentOrNewBasket();
        if (cart.productQuantityTotal > 0) {
            let shipment = cart.getShipment(cart.getDefaultShipment().getID());
            shipment.setShippingMethod(null);
            let paymentInstruments = cart.getPaymentInstruments('ESW_PAYMENT');
            for (let i = 0; i < paymentInstruments.length; i++) {
                let pi = paymentInstruments[i];
                cart.removePaymentInstrument(pi);
            }
            dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
        }
    });
    return true;
}

module.exports = {
    createOrder: createOrder,
    failOrder: failOrder,
    applyShippingMethod: applyShippingMethod,
    getExpansionPairs: getExpansionPairs,
    preparePreOrder: preparePreOrder,
    getShipmentShippingAddress: getShipmentShippingAddress,
    getNonGiftCertificateAmount: getNonGiftCertificateAmount,
    getApplicableDefaultShippingMethod: getApplicableDefaultShippingMethod,
    updatePaymentInstrument: updatePaymentInstrument,
    getProductLineMetadataItems: getProductLineMetadataItems
};
