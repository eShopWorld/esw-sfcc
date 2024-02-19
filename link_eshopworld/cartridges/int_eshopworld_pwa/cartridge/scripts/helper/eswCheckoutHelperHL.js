/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
'use strict';

// API Includes
const Logger = require('dw/system/Logger');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Site = require('dw/system/Site').getCurrent();
const URLUtils = require('dw/web/URLUtils');
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');

// Private Methods
const CheckoutRequestBuilder = {
    /**
     * function to get customer/ shopper details
     * @param {string} shopperCountry - countryCode of the shopper
     * @returns {Object} - the customer address array object
     */
    getContactDetails: function (shopperCountry) {
        if (customer.profile == null) {
            return [];
        }
        let addresses = (customer.profile != null) ? customer.profile.addressBook.addresses : null,
            address = {
                contactDetailsType: 'isDelivery',
                email: customer.profile.email,
                country: shopperCountry
            },
            addressObj = [],
            metaDataArr = [],
            collections = require('*/cartridge/scripts/util/collections');
        metaDataArr.push({
            name: 'customerNumber',
            value: customer.profile ? customer.profile.customerNo : null
        });

        if (addresses != null && !empty(addresses)) {
            collections.forEach(addresses, function (addr) {
                if (shopperCountry === addr.countryCode.value) {
                    address = {
                        contactDetailsType: 'isDelivery',
                        email: customer.profile.email,
                        contactDetailsNickName: addr.ID,
                        addressId: addr.ID,
                        address1: addr.address1,
                        address2: addr.address2,
                        address3: null,
                        city: addr.city,
                        region: addr.stateCode,
                        country: addr.countryCode.value,
                        postalCode: addr.postalCode,
                        telephone: addr.phone,
                        poBox: addr.postBox,
                        firstName: addr.firstName,
                        lastName: addr.lastName,
                        metadataItems: metaDataArr
                    };
                    addressObj.push(address);
                }
            });
        }

        if (addressObj === null || empty(addressObj)) {
            addressObj.push(address);
        }

        return addressObj;
    },
    /**
     * function to get promo(s) or voucher code(s) entered on the cart by the shopper
     * @param {Object} order - Order API object
     * @returns {Object} - the coupons Array
     */
    getRetailerPromoCodes: function (order) {
        let coupons = [],
            collections = require('*/cartridge/scripts/util/collections'),
            eswServiceHelperV3 = require('*/cartridge/scripts/helper/serviceHelperV3'),
            selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters),
            selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
        // eslint-disable-next-line no-prototype-builtins
        if ((order.hasOwnProperty('couponLineItems') || order.couponLineItems) && !empty(order.couponLineItems)) {
            collections.forEach(order.couponLineItems, function (couponLineItem) {
                let couponObject = {};
                couponObject.promoCode = couponLineItem.couponCode;
                couponObject.title = !empty(couponLineItem.getPriceAdjustments()) ? eswServiceHelperV3.convertPromotionMessage(couponLineItem.getPriceAdjustments()[0].promotion.name, selectedCountryDetail, selectedCountryLocalizeObj) : '';
                // eslint-disable-next-line no-prototype-builtins
                couponObject.description = !empty(couponLineItem.getPriceAdjustments()) ? couponLineItem.getPriceAdjustments()[0].promotion.hasOwnProperty('description') ? eswPwaHelper.convertPromotionMessage(couponLineItem.getPriceAdjustments()[0].promotion.description.toString(), selectedCountryDetail, selectedCountryLocalizeObj) : '' : ''; // eslint-disable-line no-nested-ternary
                coupons.push(couponObject);
            });
        }
        return coupons;
    },
    /**
     * function to get the Checkout metadata Items
     * @param {string} shopperLocale - LanguageISOCode of the shopper (current locale)
     * @returns {Object} - the metadataItems Array
     */
    getRetailerCheckoutMetadataItems: function (shopperLocale) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            metadataItems = eswHelper.getMetadataItems(),
            currentInstance = eswHelper.getSelectedInstance(),
            obj = {},
            arr = [],
            i = 0;
        for (let item in metadataItems) {
            let metadataItem = metadataItems[item];
            i = metadataItem.indexOf('|');
            if (currentInstance === 'production' && (metadataItem.indexOf('OrderConfirmationBase64EncodedAuth') !== -1 || metadataItem.indexOf('OrderConfirmationUri') !== -1)) {
                continue; // eslint-disable-line no-continue
            } else {
                obj.Name = metadataItem.substring(0, i);
                if (metadataItem.indexOf('OrderConfirmationBase64EncodedAuth') !== -1 && eswHelper.getBasicAuthEnabled() && !empty(eswHelper.getBasicAuthPassword())) {
                    obj.Value = eswHelper.encodeBasicAuth();
                } else if (metadataItem.indexOf('OrderConfirmationUri') !== -1) {
                    obj.Value = URLUtils.https(new dw.web.URLAction(metadataItem.substring(i + 1), Site.ID, shopperLocale)).toString();
                } else if (metadataItem.indexOf('InventoryCheckUri') !== -1) {
                    obj.Value = URLUtils.https(new dw.web.URLAction(metadataItem.substring(i + 1), Site.ID, shopperLocale)).toString();
                } else {
                    obj.Value = metadataItem.substring(i + 1);
                }
            }
            arr.push(obj);
            obj = {};
        }
        return arr;
    },
    /**
     * function to get the additional expansion pairs
     * @param {string} shopperLocale - LanguageISOCode of the shopper (current locale)
     * @param {string} shopperCountry - Shopper selected localize country
     * @returns {Object} - expansion pairs in JSON format
     */
    getExpansionPairs: function (shopperLocale, shopperCountry) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            urlExpansionPairs = eswHelper.getPwaUrlExpansionPairs(),
            pwaSiteMainUrl = eswPwaHelper.getPwaShopperUrl(shopperCountry),
            i = 0,
            obj = {};
        for (let index in urlExpansionPairs) {
            i = urlExpansionPairs[index].indexOf('|');
            let actionURL = urlExpansionPairs[index].split('|')[1];
            if (actionURL.substring(0, 4).toLowerCase() === 'http') {
                obj[urlExpansionPairs[index].substring(0, i)] = actionURL.replace(/{countryCode}+/g, shopperCountry.toLowerCase());
            } else {
                obj[urlExpansionPairs[index].substring(0, i)] = pwaSiteMainUrl + '/' + urlExpansionPairs[index].substring(i + 1);
            }
        }
        obj.metadataItems = this.getRetailerCheckoutMetadataItems(shopperLocale);
        return obj;
    },
    /**
     * Composes the request body for PreOrder/ Checkout API call
     * @param {Object} order - Order API object
     * @param {string} shopperCountry - countryCode of the shopper
     * @param {string} shopperCurrency - currencyCode of the shopper
     * @param {string} shopperLocale - LanguageISOCode of the shopper (current locale)
     * @returns {Object} - request body JSON
     */
    composeRequestBody: function (order, shopperCountry, shopperCurrency, shopperLocale) {
        let serviceHelperV3HL = require('*/cartridge/scripts/helper/eswServiceHelperHL'),
            eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            preorderCheckoutServiceName = eswHelper.getCheckoutServiceName();
        let bodyJSON = {};
        if (preorderCheckoutServiceName.indexOf('EswCheckoutV3Service') !== -1) {
            bodyJSON = {
                contactDetails: this.getContactDetails(shopperCountry),
                retailerPromoCodes: this.getRetailerPromoCodes(order),
                lineItems: serviceHelperV3HL.getLineItemsV3(order, shopperCountry, shopperCurrency),
                shopperCurrencyIso: shopperCurrency,
                pricingSynchronizationId: eswHelper.getPricingSynchronizationId(),
                deliveryCountryIso: shopperCountry,
                retailerCheckoutExperience: this.getExpansionPairs(shopperLocale, shopperCountry),
                shopperCheckoutExperience: serviceHelperV3HL.getShopperCheckoutExperience(shopperLocale),
                retailerCartId: order.orderNo,
                deliveryOptions: ('eswDeliveryOptions' in order.custom && !empty(order.custom.eswDeliveryOptions)) ? JSON.parse(order.custom.eswDeliveryOptions) : null
            };
        } else {
            bodyJSON = {
                contactDetails: this.getContactDetails(shopperCountry),
                retailerPromoCodes: this.getRetailerPromoCodes(order),
                cartItems: serviceHelperV3HL.getLineItemsV2(order, shopperCountry, shopperCurrency),
                shopperCurrencyIso: shopperCurrency,
                deliveryCountryIso: shopperCountry,
                retailerCheckoutExperience: this.getExpansionPairs(shopperLocale, shopperCountry),
                shopperCheckoutExperience: serviceHelperV3HL.getShopperCheckoutExperience(shopperLocale),
                retailerCartId: order.orderNo,
                deliveryOptions: ('eswDeliveryOptions' in order.custom && !empty(order.custom.eswDeliveryOptions)) ? JSON.parse(order.custom.eswDeliveryOptions) : null
            };
        }

        return bodyJSON;
    },
    /**
     * Service Checkout (Pre-order) version 2 request definition
     * @returns {Object} - Service Object
     */
    getPreorderServiceV2: function () {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
            preorderCheckoutServiceName = eswHelper.getCheckoutServiceName(),
            selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters),
            shopperCountry = selectedCountryDetail.countryCode;
        let preorderServicev2 = LocalServiceRegistry.createService(preorderCheckoutServiceName, {
            createRequest: function (service, params) {
                let bearerToken = 'Bearer ' + params.eswOAuthToken;
                service.addHeader('Content-Type', 'application/json');
                service.addHeader('Authorization', bearerToken);
                // eslint-disable-next-line no-param-reassign
                service.URL = (!empty(eswHelper.getRussianStorageDataUrl()) && shopperCountry === 'RU') ? eswHelper.getRussianStorageDataUrl() : service.URL;
                service.setRequestMethod('post');
                eswHelper.eswInfoLogger('Esw Checkout/ Pre Order Request : ', params.requestBody);
                return params.requestBody;
            },
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Checkout/ Pre Order Response', listOutput.text);
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return preorderServicev2;
    }
};

/**
 * Handles Checkout (PreOrder) V2 Prerequisites, prepares checkout service request and calls it.
 * @param {Object} order - Order API object
 * @param {string} shopperCountry - countryCode of the shopper
 * @param {string} shopperCurrency - currencyCode of the shopper
 * @param {string} shopperLocale - LanguageISOCode of the shopper (current locale)
 * @returns {Object} - result/ response
 */
function callEswCheckoutAPI(order, shopperCountry, shopperCurrency, shopperLocale) {
    // Script Include
    let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

    let oAuthObj = eswCoreService.getOAuthService(),
        preorderServiceObj = CheckoutRequestBuilder.getPreorderServiceV2();

    let formData = {
        grant_type: 'client_credentials',
        scope: 'checkout.preorder.api.all'
    };
    formData.client_id = eswHelper.getClientID();
    formData.client_secret = eswHelper.getClientSecret();

    let oAuthResult = oAuthObj.call(formData);
    if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
        Logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
        return null;
    }

    let requestBody = CheckoutRequestBuilder.composeRequestBody(order, shopperCountry, shopperCurrency, shopperLocale);
    eswHelper.validatePreOrder(requestBody);
    let eswCheckoutRegisterationEnabled = eswHelper.isCheckoutRegisterationEnabled();
    if (eswCheckoutRegisterationEnabled && !customer.authenticated && !empty(requestBody.shopperCheckoutExperience.registration) && requestBody.shopperCheckoutExperience.registration.showRegistration) {
        requestBody.shopperCheckoutExperience.registration.registrationUrl += '?retailerCartId=' + requestBody.retailerCartId;
    } else {
        requestBody.shopperCheckoutExperience.registration.showRegistration = false;
    }

    let result = preorderServiceObj.call({
        eswOAuthToken: JSON.parse(oAuthResult.object).access_token,
        requestBody: JSON.stringify(requestBody)
    });
    return result;
}

/**
 * Handles ESW Faux Basket Attribute to Create Order in SFCC for ESW Checkout (PreOrder) V2 Prerequisites.
 * @param {Object} basket - Basket API object
 * @param {Object} localizeObj - Localize Object
 * @param {Object} conversionPrefs - Fx rates and country adjustments
 */
function setEswBasketAttributes(basket, localizeObj, conversionPrefs) {
    if (basket.productQuantityTotal <= 0) {
        return;
    }

    let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
    let lineItemItr = basket.allProductLineItems.iterator();
    let lineItemId = 1;
    while (lineItemItr.hasNext()) {
        let productItem = lineItemItr.next();
        localizeObj.applyRoundingModel = 'true';
        let eswUnitPriceWithRounding = pricingHelper.getConvertedPrice(Number(productItem.basePrice.value), localizeObj, conversionPrefs);
        localizeObj.applyRoundingModel = 'false';
        let eswUnitPriceWithoutRounding = pricingHelper.getConvertedPrice(Number(productItem.basePrice.value), localizeObj, conversionPrefs);

        productItem.custom.eswUnitPrice = eswUnitPriceWithRounding;
        productItem.custom.eswDeltaRoundingValue = eswUnitPriceWithRounding - eswUnitPriceWithoutRounding;
        productItem.custom.eswLineItemId = lineItemId++;
    }
    let shippingAddress = eswServiceHelper.getShipmentShippingAddress(basket.getDefaultShipment());
    shippingAddress.setFirstName('eswUser');
    shippingAddress.setLastName('eswUser');
    shippingAddress.setCountryCode(localizeObj.localizeCountryObj.countryCode);
    shippingAddress.setCity('eswCity');

    let billingAddress = basket.createBillingAddress();
    billingAddress.setFirstName('eswUser');
    billingAddress.setLastName('eswUser');
    billingAddress.setCountryCode(localizeObj.localizeCountryObj.countryCode);
    billingAddress.setCity('eswCity');
    dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', basket);

    basket.createPaymentInstrument('ESW_PAYMENT', eswServiceHelper.getNonGiftCertificateAmount(basket));
    let email = (!empty(basket.getCustomerEmail())) ? basket.getCustomerEmail() : 'eswUser_' + new Date().getTime() + '@gmail.com';
    basket.setCustomerEmail(email);
}

/**
 * Handles ESW Faux Basket Attribute to Create Order in SFCC for ESW Checkout (PreOrder) V2 Prerequisites.
 * @param {Object} order - Order API object
 * @param {Object} localizeObj - Localize Object
 * @param {Object} conversionPrefs - Fx rates and country adjustments
 */
function setEswOrderAttributes(order, localizeObj, conversionPrefs) {
    let PaymentMgr = require('dw/order/PaymentMgr'),
        eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
        eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');

    order.paymentInstruments[0].paymentTransaction.paymentProcessor = PaymentMgr.getPaymentMethod(order.paymentInstruments[0].getPaymentMethod()).getPaymentProcessor();
    if (!empty(conversionPrefs.selectedFxRate)) {
        let isFixedPriceCountry = eswHelper.getFixedPriceModelCountries().filter(function (country) {
            return country.value === localizeObj.localizeCountryObj.countryCode;
        });
        if (empty(isFixedPriceCountry)) {
            order.custom.eswFxrate = Number(conversionPrefs.selectedFxRate[0].rate).toFixed(4);
        } else {
            let defaultCurrencyCode = localizeObj.localizeCountryObj.currencyCode,
                overridePricebooks = eswHelper.getOverridePriceBooks(localizeObj.localizeCountryObj.countryCode);
            if (overridePricebooks.length > 0 && defaultCurrencyCode !== eswHelper.getPriceBookCurrency(overridePricebooks[0])) {
                order.custom.eswFxrate = Number(conversionPrefs.selectedFxRate[0].rate).toFixed(4);
            }
        }
    }
    order.custom.eswShopperCurrencyTotalOrderDiscount = eswHelperHL.getOrderDiscount(order, localizeObj, conversionPrefs).value;
}

/**
 * Handles to set override shipping methods and rates for ESW Checkout (PreOrder) V2 Prerequisites.
 * @param {Object} order - Order API object
 * @param {Object} localizeObj - Localize Object
 * @param {Object} conversionPrefs - Fx rates and country adjustments
 */
function setOverrideShippingMethods(order, localizeObj, conversionPrefs) {
    let cart = order,
        eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
        eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL'),
        serviceHelperV3HL = require('*/cartridge/scripts/helper/eswServiceHelperHL'),
        shopperCountry = localizeObj.localizeCountryObj.countryCode,
        currencyIso = localizeObj.localizeCountryObj.currencyCode,
        shippingOverrides = eswHelper.getOverrideShipping(),
        shippingRates = [],
        shippingRate = {},
        discountObj = {},
        shippingMethod = null,
        isOverrideCountry;

    if (shippingOverrides.length > 0) {
        isOverrideCountry = JSON.parse(shippingOverrides).filter(function (item) {
            return item.countryCode === shopperCountry;
        });
    }

    if (!empty(isOverrideCountry)) {
        if (!empty(isOverrideCountry[0].shippingMethod.ID)) {
            localizeObj.applyRoundingModel = 'true';
            localizeObj.applyCountryAdjustments = 'false';
            let isConversionDisabled = 'disableConversion' in isOverrideCountry[0] && isOverrideCountry[0].disableConversion === 'true';
            for (let rate in isOverrideCountry[0].shippingMethod.ID) {
                shippingMethod = eswHelperHL.applyShippingMethod(cart, isOverrideCountry[0].shippingMethod.ID[rate], shopperCountry, false);
                if (shippingMethod != null && cart.adjustedShippingTotalPrice.valueOrNull != null) {
                    discountObj = serviceHelperV3HL.getDeliveryDiscounts(cart, isConversionDisabled, localizeObj, conversionPrefs);
                    shippingRate = {
                        deliveryOption: shippingMethod.displayName,
                        deliveryOptionOverridePriceInfo: {
                            price: {
                                currency: currencyIso,
                                amount: discountObj.finalPrice.toFixed(2)
                            },
                            discounts: discountObj.ShippingDiscounts
                        },
                        metadataItems: null
                    };
                    shippingRates.push(shippingRate);
                }
            }
            shippingMethod = !empty(shippingRates) ? eswHelperHL.applyShippingMethod(cart, shippingRates[0].deliveryOption, shopperCountry, false) : null;
            cart.custom.eswDeliveryOptions = JSON.stringify(shippingRates);
            localizeObj.applyCountryAdjustments = 'true';
        }
    } else if (!empty(cart.defaultShipment) && !empty(cart.defaultShipment.shippingPriceAdjustments)) {
        for (let i in cart.defaultShipment.shippingPriceAdjustments) {
            let adjustment = cart.defaultShipment.shippingPriceAdjustments[i];
            if (adjustment.appliedDiscount.type === dw.campaign.Discount.TYPE_FREE) {
                discountObj = serviceHelperV3HL.getDeliveryDiscounts(cart, false, localizeObj, conversionPrefs);
                shippingRate = {
                    deliveryOption: 'POST',
                    deliveryOptionOverridePriceInfo: {
                        price: {
                            currency: currencyIso,
                            amount: 0
                        },
                        discounts: discountObj.ShippingDiscounts
                    },
                    metadataItems: null
                };
                shippingRates.push(shippingRate);
            }
        }
        cart.custom.eswDeliveryOptions = JSON.stringify(shippingRates);
    }
}

module.exports = {
    callEswCheckoutAPI: callEswCheckoutAPI,
    setEswBasketAttributes: setEswBasketAttributes,
    setEswOrderAttributes: setEswOrderAttributes,
    setOverrideShippingMethods: setOverrideShippingMethods
};
