/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
'use strict';

// API Includes
const Logger = require('dw/system/Logger');
const eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
const pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;

// Private Methods
const CheckoutRequestBuilder = {
    /**
     * Composes the request body for PreOrder/ Checkout API call
     * @param {Object} order - Order API object
     * @param {string} shopperCountry - countryCode of the shopper
     * @param {string} shopperCurrency - currencyCode of the shopper
     * @param {string} shopperLocale - LanguageISOCode of the shopper (current locale)
     * @returns {Object} - request body JSON
     */
    composeRequestBody: function (order, shopperCountry, shopperCurrency, shopperLocale) {
        let bodyJSON = eswServiceHelper.preparePreOrder(order, shopperCountry, shopperCurrency, shopperLocale);
        if (eswHelper.isEswEnabledEmbeddedCheckout()) {
            let eswRetailerCartId = order.UUID + '__' + Date.now();
            bodyJSON.retailerCartId = eswRetailerCartId.substring(0, 99);
            if (!('metadataItems' in bodyJSON.shopperCheckoutExperience) || empty(bodyJSON.shopperCheckoutExperience.metadataItems)) {
                bodyJSON.shopperCheckoutExperience.metadataItems = [];
            }
            bodyJSON.shopperCheckoutExperience.metadataItems.push({ name: 'authorization', value: request.httpHeaders.authorization });
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
            param = request.httpParameters,
            shopperCountry = param['country-code'][0];
        let preorderServicev2 = dw.svc.LocalServiceRegistry.createService(preorderCheckoutServiceName, {
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
    let result = null;
    try {
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
            eswHelper.eswInfoLogger('callEswCheckoutAPI auth issue Error', '401', oAuthResult.errorMessage, 'N/A');
            return null;
        }

        let requestBody = CheckoutRequestBuilder.composeRequestBody(order, shopperCountry, shopperCurrency, shopperLocale);
        if (eswHelper.isEswSelfHostedOcEnabled()) {
            const selfHostedOcHelper = require('*/cartridge/scripts/helper/eswSelfHostedOcHelper');
            let selfHostedOcMetadata = selfHostedOcHelper.getEswSelfhostedPreOrderMetadata(requestBody.retailerCartId);
            if (!empty(selfHostedOcMetadata)) {
                requestBody.retailerCheckoutExperience.metadataItems.push({
                    Name: selfHostedOcMetadata.metadataName,
                    Value: selfHostedOcMetadata.metadataValue
                });
            }
        }
        eswHelper.validatePreOrder(requestBody);

        result = preorderServiceObj.call({
            eswOAuthToken: JSON.parse(oAuthResult.object).access_token,
            requestBody: JSON.stringify(requestBody)
        });
    } catch (error) {
        eswHelper.eswInfoLogger('callEswCheckoutAPI Error', error, error.message, error.stack);
    }
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
    let PaymentMgr = require('dw/order/PaymentMgr');
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
    let orderDiscount = eswHelper.getOrderDiscountHL(order, localizeObj, conversionPrefs);
    if (!empty(orderDiscount) && typeof orderDiscount === 'object') {
        order.custom.eswShopperCurrencyTotalOrderDiscount = orderDiscount.value;
    }
}

/**
 * Handles to set override shipping methods and rates for ESW Checkout (PreOrder) V2 Prerequisites.
 * @param {Object} order - Order API object
 * @param {Object} localizeObj - Localize Object
 * @param {Object} conversionPrefs - Fx rates and country adjustments
 */
function setOverrideShippingMethods(order, localizeObj, conversionPrefs) {
    let currencyExponent = 2;
    if (!empty(order) && !empty(conversionPrefs) && 'selectedRoundingRule' in conversionPrefs) {
        currencyExponent = conversionPrefs.selectedRoundingRule[0].currencyExponent;
    }
    try {
        let cart = order,
            eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL'),
            eswServiceHelperV3 = require('*/cartridge/scripts/helper/serviceHelperV3'),
            shopperCountry = localizeObj.localizeCountryObj.countryCode,
            currencyIso = localizeObj.localizeCountryObj.currencyCode,
            shippingOverrides = eswHelper.getOverrideShipping(),
            shippingRates = [],
            shippingRate = {},
            discountObj = {},
            shippingMethod = null,
            isOverrideCountry;
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
                for (let rate in isOverrideCountry[0].shippingMethod.ID) {
                    shippingMethod = eswHelperHL.applyShippingMethod(cart, isOverrideCountry[0].shippingMethod.ID[rate], shopperCountry, false);
                    if (shippingMethod != null && cart.adjustedShippingTotalPrice.valueOrNull != null) {
                        discountObj = eswServiceHelperV3.getDeliveryDiscounts(cart, isConversionDisabled, localizeObj, conversionPrefs);
                        let adjustedShippingCost = (isConversionDisabled || cart.adjustedShippingTotalPrice.value === 0) ? cart.adjustedShippingTotalPrice.value : pricingHelper.getConvertedPrice(Number(cart.adjustedShippingTotalPrice), localizeObj, conversionPrefs);
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
                                    Price: currencyIso + adjustedShippingCost
                                },
                                MetadataItems: null
                            };
                        }
                        shippingRates.push(shippingRate);
                    }
                    shippingMethod = !empty(shippingRates) ? eswHelperHL.applyShippingMethod(cart, shippingRates[0].deliveryOption, shopperCountry, true) : null;
                    cart.custom.eswDeliveryOptions = JSON.stringify(shippingRates);
                    localizeObj.applyCountryAdjustments = 'true';
                }
            } else if (!empty(cart.defaultShipment) && !empty(cart.defaultShipment.shippingPriceAdjustments)) {
                for (let i in cart.defaultShipment.shippingPriceAdjustments) {
                    let adjustment = cart.defaultShipment.shippingPriceAdjustments[i];
                    if (adjustment.appliedDiscount.type === dw.campaign.Discount.TYPE_FREE) {
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
                        shippingRates.push(shippingRate);
                    }
                }
                cart.custom.eswDeliveryOptions = JSON.stringify(shippingRates);
            }
        }
    } catch (error) {
        eswHelper.eswInfoLogger('sendOverrideShippingMethods Error', error, error.message, error.stack);
    }
}

module.exports = {
    callEswCheckoutAPI: callEswCheckoutAPI,
    setEswBasketAttributes: setEswBasketAttributes,
    setEswOrderAttributes: setEswOrderAttributes,
    setOverrideShippingMethods: setOverrideShippingMethods
};
