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
const Constants = require('*/cartridge/scripts/util/Constants');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

// Private Methods
const CheckoutRequestBuilder = {
    /**
     * function to get customer/ shopper details
     * @param {string} shopperCountry - countryCode of the shopper
     * @returns {Object} - the customer address array object
     */
    getContactDetails: function (shopperCountry) {
        let contactDetailsType = 'IsDelivery';
        if (customer.profile == null) {
            return [];
        }
        let addresses = (customer.profile != null) ? customer.profile.addressBook.addresses : null,
            address = {
                contactDetailsType: contactDetailsType,
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
                        contactDetailsType: contactDetailsType,
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
            selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters),
            selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);
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
        let metadataItems = eswHelper.getMetadataItems(),
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
                if (!eswHelper.getEnableInventoryCheck() && (metadataItem.indexOf('InventoryCheckUri') !== -1 || metadataItem.indexOf('InventoryCheckBase64EncodedAuth') !== -1)) {
                    // eslint-disable-next-line no-continue
                    continue;
                }
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
     * function to get the additional PWA expansion pairs
     * @param {string} shopperLocale - LanguageISOCode of the shopper (current locale)
     * @param {string} shopperCountry - Shopper selected localize country
     * @returns {Object} - expansion pairs in JSON format
     */
    getPWAExpansionPairs: function (shopperLocale, shopperCountry) {
        let urlExpansionPairs = eswHelper.getPwaUrlExpansionPairs(),
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
        let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
        let bodyJSON = eswServiceHelper.preparePreOrder(order, shopperCountry, shopperCurrency, shopperLocale);
        bodyJSON.retailerCheckoutExperience = this.getPWAExpansionPairs(shopperLocale, shopperCountry);
        if ('custom' in order && 'eswPreOrderRequest' in order.custom && !empty(order.custom.eswPreOrderRequest)) {
            let eswRetailerCartId = order.UUID + '__' + Date.now();
            bodyJSON.retailerCartId = eswRetailerCartId.substring(0, 99);
            let accessToken = order.custom.eswPreOrderRequest;
            let partLength = Math.ceil(accessToken.length / 2);

            // Split the string into two parts
            let accessTokenPart1 = accessToken.slice(0, partLength);
            let accessTokenPart2 = accessToken.slice(partLength);

            if (!('metadataItems' in bodyJSON.shopperCheckoutExperience) || empty(bodyJSON.shopperCheckoutExperience.metadataItems)) {
                bodyJSON.shopperCheckoutExperience.metadataItems = [];
            }
            ['cartItems', 'lineItems'].forEach(function (key) {
                if (key in bodyJSON) {
                    bodyJSON[key][0].metadataItems = bodyJSON[key][0].metadataItems || [];
                }
            });

            (bodyJSON.cartItems || bodyJSON.lineItems)[0].metadataItems.push({ name: 'accessTokenPart2', value: accessTokenPart2 });
            bodyJSON.shopperCheckoutExperience.metadataItems.push({ name: 'accessTokenPart1', value: accessTokenPart1 });
        } else {
            bodyJSON.retailerCartId = order.orderNo;
        }

        return bodyJSON;
    },
    /**
     * Service Checkout (Pre-order) version 2 request definition
     * @returns {Object} - Service Object
     */
    getPreorderServiceV2: function () {
        let preorderCheckoutServiceName = eswHelper.getCheckoutServiceName(),
            selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters),
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
    let oAuthObj = eswCoreService.getOAuthService(),
        preorderServiceObj = CheckoutRequestBuilder.getPreorderServiceV2();

    let formData = {
        grant_type: 'client_credentials',
        scope: 'checkout.preorder.api.all'
    };
    formData.client_id = eswHelper.getClientID();
    formData.client_secret = eswHelper.getClientSecret();
    try {
        let oAuthResult = oAuthObj.call(formData);
        if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
            Logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
            return null;
        }

        let requestBody = CheckoutRequestBuilder.composeRequestBody(order, shopperCountry, shopperCurrency, shopperLocale);
        if (eswHelper.isEswSelfHostedOcEnabled()) {
            let selfHostedOcHelper = require('*/cartridge/scripts/helper/eswSelfHostedOcHelper');
            let selfHostedOcMetadata = selfHostedOcHelper.getEswSelfhostedPreOrderMetadata(requestBody.retailerCartId, shopperCountry);
            let metadataObj = selfHostedOcHelper.getSelfHostedOcMetadataObject(selfHostedOcMetadata);
            if (metadataObj) {
                requestBody.retailerCheckoutExperience.metadataItems.push(metadataObj);
            }
        }
        eswHelper.validatePreOrder(requestBody);
        let eswCheckoutRegisterationEnabled = eswHelper.isCheckoutRegisterationEnabled();
        if (empty(requestBody.shopperCheckoutExperience.registration)) {
            requestBody.shopperCheckoutExperience.registration = {};
        }
        // eslint-disable-next-line no-lonely-if
        if (eswCheckoutRegisterationEnabled && !customer.authenticated) {
            requestBody.shopperCheckoutExperience.registration.showRegistration = true;
        } else {
            requestBody.shopperCheckoutExperience.registration.showRegistration = false;
        }
        requestBody.shopperCheckoutExperience.registration[Constants.REGISTERATION_URL_NAME] = URLUtils.https(Constants.REGISTERATION_PWA_URL_VALUE).toString();
        if (eswCheckoutRegisterationEnabled && !customer.authenticated && !empty(requestBody.shopperCheckoutExperience.registration) && requestBody.shopperCheckoutExperience.registration.showRegistration) {
            requestBody.shopperCheckoutExperience.registration.registrationUrl += '?retailerCartId=' + requestBody.retailerCartId;
        }

        let result = preorderServiceObj.call({
            eswOAuthToken: JSON.parse(oAuthResult.object).access_token,
            requestBody: JSON.stringify(requestBody)
        });
        return result;
    } catch (e) {
        eswHelper.eswInfoLogger('Error in PWA: callEswCheckoutAPI', e, e.message, e.stack);
        return null;
    }
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
        eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');

    order.paymentInstruments[0].paymentTransaction.paymentProcessor = PaymentMgr.getPaymentMethod(order.paymentInstruments[0].getPaymentMethod()).getPaymentProcessor();
    if (!empty(conversionPrefs.selectedFxRate)) {
        let isFixedPriceCountry = eswHelper.getFixedPriceModelCountries().filter(function (country) {
            return country.value === localizeObj.localizeCountryObj.countryCode;
        });
        if (!('eswPreOrderRequest' in order.custom)) {
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
    }
    if (!('eswPreOrderRequest' in order.custom)) {
        order.custom.eswShopperCurrencyTotalOrderDiscount = eswHelperHL.getOrderDiscount(order, localizeObj, conversionPrefs).value;
    }
}

/**
 * Handles to set override shipping methods and rates for ESW Checkout (PreOrder) V2 Prerequisites.
 * @param {Object} order - Order API object
 * @param {Object} localizeObj - Localize Object
 * @param {Object} conversionPrefs - Fx rates and country adjustments
 */
function setOverrideShippingMethods(order, localizeObj, conversionPrefs) {
    let currencyExponent = 3;
    if (!empty(order) && !empty(conversionPrefs) && 'selectedRoundingRule' in conversionPrefs) {
        currencyExponent = conversionPrefs.selectedRoundingRule[0].currencyExponent;
    }
    let cart = order,
        eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL'),
        eswServiceHelperV3 = require('*/cartridge/scripts/helper/serviceHelperV3'),
        eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper'),
        shopperCountry = localizeObj.localizeCountryObj.countryCode,
        currencyIso = localizeObj.localizeCountryObj.currencyCode,
        shippingOverrides = eswHelper.getOverrideShipping(),
        shippingRates = [],
        shippingRate = {},
        discountObj = {},
        shippingMethod = null,
        isOverrideCountry;
    let selectedCountryDetail = eswHelper.getCountryDetailByParam(shopperCountry);
    let selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);
    let preorderCheckoutServiceName = eswHelper.getCheckoutServiceName();
    let v2Flag = true;
    if (preorderCheckoutServiceName.indexOf('EswCheckoutV3Service') !== -1) {
        v2Flag = false;
    }

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
            if (cart.shipments[0].shippingMethodID) {
                eswServiceHelper.reArrangeOverrideShippingBasedOnCustomerSelection(isOverrideCountry, cart.shipments[0].shippingMethodID);
            }
            for (let rate in isOverrideCountry[0].shippingMethod.ID) {
                shippingMethod = eswHelperHL.applyShippingMethod(cart, isOverrideCountry[0].shippingMethod.ID[rate], shopperCountry, false);
                if (shippingMethod != null && cart.adjustedShippingTotalPrice.valueOrNull != null) {
                    discountObj = eswServiceHelperV3.getDeliveryDiscounts(cart, isConversionDisabled, localizeObj, conversionPrefs);
                    let adjustedShippingCost = (isConversionDisabled || cart.adjustedShippingTotalPrice.value === 0) ? cart.adjustedShippingTotalPrice : eswHelper.getMoneyObject(Number(cart.defaultShipment.shippingTotalPrice), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj);
                    if (!v2Flag) {
                        shippingRate = {
                            deliveryOption: shippingMethod.displayName,
                            deliveryOptionOverridePriceInfo: {
                                price: {
                                    currency: currencyIso,
                                    amount: discountObj.finalPrice.toFixed(currencyExponent)
                                },
                                discounts: discountObj.ShippingDiscounts
                            },
                            metadataItems: null
                        };
                    } else {
                        shippingRate = {
                            deliveryOption: shippingMethod.displayName,
                            ShopperCurrencyOveridePriceInfo: {
                                Title: 'SCOPI_Title',
                                Description: 'SCOPI_Description',
                                Price: currencyIso + adjustedShippingCost.value
                            },
                            MetadataItems: null
                        };
                    }
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
                if (!v2Flag) {
                    discountObj = eswServiceHelperV3.getDeliveryDiscounts(cart, false, localizeObj, conversionPrefs);
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
                } else {
                    shippingRate = {
                        deliveryOption: 'POST',
                        ShopperCurrencyOveridePriceInfo: {
                            Title: 'SCOPI_Title',
                            Description: 'SCOPI_Description',
                            Price: currencyIso + 0
                        },
                        MetadataItems: null
                    };
                }
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
