/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
'use strict';

/**
 * Controller that renders the Header bar, footer bar and landing page of ESW as per site preference configurations
 * @module controllers/EshowWorld
 */

/* API includes */
const URLUtils = require('dw/web/URLUtils');
const ArrayList = require('dw/util/ArrayList');

/* Script Modules */
const Constants = require('*/cartridge/scripts/util/Constants');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const app = require('*/cartridge/scripts/app');
const guard = require('*/cartridge/scripts/guard');
const Response = require('*/cartridge/scripts/util/Response');

/**
 * Function used to set initial cookies for country, currency and local.
 * this function will set cookies only if there is no cookie set for any variable
 */
function setInitialCookies() {
    let country = eswHelper.getAvailableCountry();
    let currencyCode = eswHelper.getDefaultCurrencyForCountry(country);
    let locale = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllowedLanguages()[0].value;

    eswHelper.createInitialCookies(country, currencyCode, locale);
    eswHelper.setCustomerCookies();

    let selectedFxRate = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate) : '';
    if (!selectedFxRate && selectedFxRate !== null) {
        country = eswHelper.getAvailableCountry();
        if (eswHelper.checkIsEswAllowedCountry(country)) {
            if (!eswHelper.overridePrice(country)) {
                eswHelper.setBaseCurrencyPriceBook(eswHelper.getBaseCurrencyPreference());
            }
        }
        if (eswHelper.checkIsEswAllowedCountry(eswHelper.getAvailableCountry()) != null) {
            if (request.httpCookies['esw.currency'] == null) {
                eswHelper.selectCountry(eswHelper.getAvailableCountry(), currencyCode, locale);
            } else {
                eswHelper.selectCountry(eswHelper.getAvailableCountry(), request.httpCookies['esw.currency'].value, locale);
            }
        }
    }
}

/**
 * Get general ESW configs from custom site preference
 * @returns {Object} - General Config JSON object
 */
function getESWGeneralConfigs() {
    let Site = require('dw/system/Site').getCurrent();
    let language = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllowedLanguages()[0].value;
    let country = eswHelper.getAvailableCountry();
    let currency;
    let urlParameter = request.httpParameterMap.get(Site.getCustomPreferenceValue('eswCountryUrlParam'));

    if (urlParameter && urlParameter.value && eswHelper.checkIsEswAllowedCountry(urlParameter.value)) {
        currency = eswHelper.getDefaultCurrencyForCountry(urlParameter.value);
    } else {
        currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getDefaultCurrencyForCountry(eswHelper.getAvailableCountry());
    }
    eswHelper.setCustomSessionVariables(country, currency);
    let ESWGeneralConfigs = {
        selectedCountry: country,
        selectedCountryName: eswHelper.getCountryName(country),
        selectedLanguage: language,
        selectedCurrency: currency
    };
    if (!customer.authenticated) {
        eswHelper.createCookie('esw-shopper-access-token', '', '/', 'expired', eswHelper.getTopLevelDomain());
    }
    return ESWGeneralConfigs;
}

/**
 * Get header bar of ESW and render template for it in response
 */
function getESWHeaderBar() {
    let Site = require('dw/system/Site').getCurrent();
    let country = request.httpParameterMap.get(Site.getCustomPreferenceValue('eswCountryUrlParam'));
    eswHelper.setLocation(country);
    if (request.httpParameterMap.pageContextType !== 'checkout') {
        setInitialCookies();
        let ESWHeaderConfigs = getESWGeneralConfigs();

        app.getView({
            EswHeaderEnabled: eswHelper.getEnableHeaderBar(),
            EswHeaderObject: ESWHeaderConfigs
        }).render('EswComponents/eswHeaderBar');
    }
}

/**
 * Get footer bar of ESW and render template for it in response
 */
function getESWFooterBar() {
    if (request.httpParameterMap.pageContextType !== 'checkout') {
        setInitialCookies();
        let ESWFooterConfigs = getESWGeneralConfigs();

        app.getView({
            EswFooterEnabled: eswHelper.getEnableFooterBar(),
            EswFooterObject: ESWFooterConfigs
        }).render('EswComponents/eswFooterBar');
    }
}

/**
 * Get landing page of ESW and render template for it in response
 *
 * if cookies not found then return blank string
 * otherwise, renders the landing page.
 */
function getESWLandingPage() {
    if (request.httpCookies['esw.Landing.Played'] == null || request.httpCookies['esw.Landing.Played'] === false || request.httpParameterMap.dropDownSelection.value === 'true') {
        let Cookie = require('dw/web/Cookie');
        let eswLandingCookie = new Cookie('esw.Landing.Played', true);
        eswLandingCookie.setPath('/');
        response.addHttpCookie(eswLandingCookie);
        setInitialCookies();

        let ESWLandingConfigs = {
            allCountries: eswHelper.getAllCountries(),
            languages: eswHelper.getAllowedLanguages(),
            currencies: eswHelper.getAllowedCurrencies(),
            enabledLandingPageBar: eswHelper.getEnableLandingPageBar(),
            enabledCountriesInLandingPage: eswHelper.getEnableCountryLandingBar(),
            enabledLanguagesInLandingPage: eswHelper.getEnableLanguageLandingBar(),
            enabledCurrencyInLandingPage: eswHelper.getEnableCurrencyLandingBar()
        };

        ESWLandingConfigs = eswHelper.extendObject(ESWLandingConfigs, getESWGeneralConfigs());

        app.getView({
            EswLandingObject: ESWLandingConfigs
        }).render('EswComponents/eswLandingPage');
    }
    return;
}

/**
 * Gets Default currency with given country on Ajax call.
 */
function getDefaultCurrency() {
    let selectedCountry = request.httpParameterMap.country.value,
        selectedCountryDetail = eswHelper.getSelectedCountryDetail(selectedCountry);

    Response.renderJSON({
        success: !empty(selectedCountryDetail.defaultCurrencyCode),
        isAllowed: selectedCountryDetail.isSupportedByESW,
        currency: selectedCountryDetail.defaultCurrencyCode,
        isFixedPriceCountry: selectedCountryDetail.isFixedPriceModel
    });
}

/**
 * Get ESW App Resources for frontend prices conversion (content assets & callout messages)
 */
function getEswAppResources() {
    let Currency = require('dw/util/Currency'),
        selectedCurrency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getDefaultCurrencyForCountry(eswHelper.getAvailableCountry()),
        selectedCountry = eswHelper.getSelectedCountryDetail(eswHelper.getAvailableCountry());
    app.getView({
        isEswRoundingsEnabled: eswHelper.isEswRoundingsEnabled(),
        isFrontendConversionEnabled: eswHelper.isFrontendConversionEnabled(),
        selectedCurrencySymbol: Currency.getCurrency(selectedCurrency).symbol,
        isFixedPriceCountry: selectedCountry.isFixedPriceModel || !selectedCountry.isSupportedByESW
    }).render('EswComponents/eswAppResources');
}

/**
 * Returns the converted price
 */
function getConvertedPrice() {
    let noConversion = request.httpParameterMap.noConversion.booleanValue;
    let price = request.httpParameterMap.price.value;
    let noAdjustment = request.httpParameterMap.noAdjustment.booleanValue;
    let ranged = request.httpParameterMap.ranged.value || false;
    let lineItemId = request.httpParameterMap.lineItemID.value;
    let convertedPrice;
    if (noConversion) {
        let formatMoney = require('dw/util/StringUtils').formatMoney;
        convertedPrice = formatMoney(new dw.value.Money(price, request.httpCookies['esw.currency'].value));
    } else if (ranged) {
        convertedPrice = eswHelper.getMoneyObject(price.substring(0, price.indexOf(' - '))) + ' - ' + eswHelper.getMoneyObject(price.substring(price.indexOf(' - ') + 3));
    } else if (!empty(lineItemId)) {
        let currentBasket = dw.order.BasketMgr.getCurrentBasket();
        convertedPrice = -(eswHelper.getOrderDiscount(currentBasket));
    } else {
        convertedPrice = eswHelper.getMoneyObject(price, noAdjustment);
    }
    app.getView({
        price: convertedPrice
    }).render('eswPrice');
}

/**
 * Calls the appropriate version to handle the preorder request
 */
function preOrderRequest() {
    let result,
        isAjax = Object.hasOwnProperty.call(request.httpHeaders, 'x-requested-with'),
        logger = require('dw/system/Logger'),
        redirectURL;

    let BasketMgr = require('dw/order/BasketMgr');
    let currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket) {
        delete session.privacy.restrictedProductID;
        // eslint-disable-next-line no-restricted-syntax
        for (let lineItemNumber in currentBasket.productLineItems) {  // eslint-disable-line guard-for-in
            let cartProduct = currentBasket.productLineItems[lineItemNumber].product;
            if (eswHelper.isProductRestricted(cartProduct)) {
                session.privacy.eswProductRestricted = true;
                session.privacy.restrictedProductID = cartProduct.ID;
                if (isAjax) {
                    Response.renderJSON({
                        redirectURL: URLUtils.https('Cart-Show').toString()
                    });
                } else {
                    response.redirect(URLUtils.https('Cart-Show').toString());
                }
                return;
            }
        }
    }

    try {
        if (!eswHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) {
            redirectURL = URLUtils.https('COCustomer-Start').toString();
        } else {
            if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                let cart = dw.order.BasketMgr.getCurrentOrNewBasket(),
                    eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
                if (empty(cart.defaultShipment.shippingMethod)) {
                    eswServiceHelper.getApplicableDefaultShippingMethod(cart);
                }
                result = eswHelper.generatePreOrderUsingBasket();
            } else {
                // eslint-disable-next-line no-use-before-define
                result = handlePreOrderRequestV2();
            }
            if ((result.status === 'REDIRECT') && (!('guestCheckout' in session.privacy) || session.privacy.guestCheckout == null)) {
                Response.renderJSON({
                    redirectURL: URLUtils.https('COCustomer-Start').toString()
                });
                return;
            }
            if (result.status === 'ERROR' || empty(result.object)) {
                logger.error('ESW Service Error: {0}', result.errorMessage);
                if (isAjax) {
                    if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                        Response.renderJSON({
                            error: 'CHECKOUT_FAILED'
                        });
                    } else {
                        Response.renderJSON({
                            redirectURL: URLUtils.https('Cart-Show', 'eswfail', true).toString()
                        });
                    }
                } else {
                    response.redirect(URLUtils.https('Cart-Show', 'eswfail', true).toString());
                }
                return;
            }
            redirectURL = eswHelper.isEswEnabledEmbeddedCheckout() ?
             URLUtils.https('EShopWorldSG-EswEmbeddedCheckout', Constants.EMBEDDED_CHECKOUT_QUERY_PARAM, JSON.parse(result.object).redirectUrl).toString() :
             JSON.parse(result.object).redirectUrl;
            if ('shopperAccessToken' in JSON.parse(result.object)) {
                eswHelper.createCookie('esw-shopper-access-token', JSON.parse(result.object).shopperAccessToken, '/', 3600, eswHelper.getTopLevelDomain());
            } else {
                eswHelper.createCookie('esw-shopper-access-token', '', '/', 'expired', eswHelper.getTopLevelDomain());
            }
            delete session.privacy.guestCheckout;
        }
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
        if (e.message === 'SFCC_ORDER_CREATION_FAILED') {
            redirectURL = URLUtils.https('Cart-Show', 'eswRetailerCartIdNullException', true).toString();
        } else if (e.message === 'ATTRIBUTES_MISSING_IN_PRE_ORDER') {
            redirectURL = URLUtils.https('Cart-Show', 'eswPreOrderException', true).toString();
        } else {
            redirectURL = URLUtils.https('Cart-Show', 'eswfail', true).toString();
        }
    }
    if (isAjax) {
        Response.renderJSON({
            redirectURL: redirectURL
        });
    } else {
        response.redirect(redirectURL);
    }
}


/**
 * Handle Pre-Order V2. It prepares Pre-Order service request and calls it.
 * @returns {Object} - result
 */
function handlePreOrderRequestV2() {
    let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
        preorderServiceObj = eswCoreService.getPreorderServiceV2(),
        eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper'),
        redirectPreference = eswHelper.getRedirect();

    if (redirectPreference.value !== 'Cart' && session.privacy.guestCheckout == null) {
        if (!customer.authenticated) {
            session.privacy.TargetLocation = URLUtils.https('EShopWorldSG-PreOrderRequest').toString();
            return {
                status: 'REDIRECT'
            };
        }
    }
    eswHelper.setOAuthToken();

    let cart = dw.order.BasketMgr.getCurrentOrNewBasket();
    if (empty(cart.defaultShipment.shippingMethod)) {
        eswServiceHelper.getApplicableDefaultShippingMethod(cart);
    }

    let requestObj = eswServiceHelper.preparePreOrder();
    requestObj.retailerCartId = eswServiceHelper.createOrder();
    eswHelper.validatePreOrder(requestObj, true);
    session.privacy.confirmedOrderID = requestObj.retailerCartId;

    let result = preorderServiceObj.call(JSON.stringify(requestObj));
    return result;
}


/**
 * Function to return to home page after rebuilding cart
 */
function eswBackToHome() {
    // Rebuild cart starts here
    eswHelper.rebuildCart();
    // Rebuild cart ends here
    response.redirect(URLUtils.httpHome());
}

/**
 * Function to return to cart page after rebuilding cart
 */
function eswBackToCart() {
    // Rebuild cart starts here
    eswHelper.rebuildCart();
    // Rebuild cart ends here
    response.redirect(URLUtils.https('Cart-Show').toString());
}

/**
 * Function to handle register customer request coming from ESW order confirmation
 */
function registerCustomer() {
    let CustomerMgr = require('dw/customer/CustomerMgr');
    let OrderMgr = require('dw/order/OrderMgr');
    let Transaction = require('dw/system/Transaction');
    let logger = require('dw/system/Logger');
    let orderNumber,
        existerCustomer;

    try {
        orderNumber = session.privacy.confirmedOrderID;
        let order = OrderMgr.getOrder(orderNumber);
        let loginForm;
        if (order) {
            existerCustomer = CustomerMgr.getCustomerByLogin(order.getCustomerEmail());
            if (existerCustomer && existerCustomer.registered) {
                loginForm = app.getForm('login');
                Transaction.wrap(function () { order.setCustomer(existerCustomer); });
                let oauthLoginForm = app.getForm('oauthlogin');
                let orderTrackForm = app.getForm('ordertrack');
                let loginView = app.getView('Login', {
                    RegistrationStatus: false,
                    CustomerEmail: order.getCustomerEmail()
                });

                loginForm.clear();
                oauthLoginForm.clear();
                orderTrackForm.clear();

                if (existerCustomer.registered) {
                    loginForm.setValue('username', order.getCustomerEmail());
                    loginForm.setValue('rememberme', true);
                }
                session.custom.TargetLocation = URLUtils.url('Account-Show').toString();
                loginView.render();
            } else {
                let profileValidation,
                    Customer = app.getModel('Customer'),
                    password = eswHelper.generateRandomPassword(),
                    target,
                    customerForm = app.getForm('profile.customer');
                loginForm = app.getForm('profile.login');
                customerForm.setValue('firstname', order.billingAddress.firstName);
                customerForm.setValue('lastname', order.billingAddress.lastName);
                customerForm.setValue('email', order.customerEmail);
                customerForm.setValue('emailconfirm', order.customerEmail);
                customerForm.setValue('orderNo', order.orderNo);
                loginForm.setValue('newpassword', password);
                loginForm.setValue('newpasswordconfirm', password);
                profileValidation = Customer.createAccount(order.customerEmail, password, app.getForm('profile'));
                if (profileValidation && profileValidation.authenticated) {
                    if (!empty(profileValidation)) {
                        let emailModel = app.getModel('Email');
                        eswHelper.sendRegisterCustomerEmail(profileValidation, password, true, emailModel);
                    }
                    Transaction.wrap(function () {
                        order.customer = profileValidation;
                        // update marketing optin values on customer profile
                        profileValidation.profile.custom.eswMarketingOptIn = order.custom.eswEmailMarketingOptIn;
                        profileValidation.profile.custom.eswSMSMarketingOptIn = order.custom.eswSMSMarketingOptIn;
                    });
                    session.custom.TargetLocation = URLUtils.https('Account-Show', 'Registration', 'true').toString();
                    target = session.custom.TargetLocation;
                }
                if (target) {
                    delete session.custom.TargetLocation;
                    dw.system.Logger.info('Redirecting to "{0}" after successful login', target);
                    response.redirect(target);
                } else {
                    response.redirect(URLUtils.https('Account-Show', 'registration', 'true'));
                }
            }
        } else {
            response.redirect(URLUtils.url('Account-StartRegister').toString());
        }
    } catch (error) {
        if ((!empty(session.privacy.confirmedOrderID) || !empty(orderNumber)) && !empty(existerCustomer) && existerCustomer.registered) {
            response.redirect(URLUtils.url('Login-Show').toString());
        } else {
            response.redirect(URLUtils.url('Account-StartRegister').toString());
        }
        logger.error('ESW Plugin Account Creation Error: {0}', error.message);
    }
}
/**
 * Function to be called from ESW to check Order items inventory in SFCC side.
 */
function validateInventory() {
    let obj = JSON.parse(request.httpParameterMap.requestBodyAsString);
    let responseJSON = eswHelper.getValidateInventoryResponseJson(obj);
    Response.renderJSON(responseJSON);
}
/**
 * Function to handle order confirmation request in V2
 */
function notify() {
    /* eslint-disable no-new-wrappers */
    let Transaction = require('dw/system/Transaction'),
        OrderMgr = require('dw/order/OrderMgr'),
        logger = require('dw/system/Logger'),
        Order = require('dw/order/Order'),
        BasketMgr = require('dw/order/BasketMgr'),
        pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
        responseJSON = {};
    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        logger.error('ESW Order Confirmation Error: Basic Authentication Token did not match');
    } else {
        let obj = JSON.parse(request.httpParameterMap.requestBodyAsString);
        responseJSON = {
            OrderNumber: obj.retailerCartId.toString(),
            EShopWorldOrderNumber: obj.eShopWorldOrderNumber.toString(),
            ResponseCode: '200',
            ResponseText: 'Success'
        };

        try {
            eswHelper.eswInfoLogger('Esw Order Confirmation Request', JSON.stringify(obj));
            let ocHelper = require('*/cartridge/scripts/helper/orderConfirmationHelper').getEswOcHelper(),
                shopperCurrency = ('checkoutTotal' in obj) ? obj.checkoutTotal.shopper.currency : obj.shopperCurrencyPaymentAmount.substring(0, 3),
                totalCheckoutAmount = ('checkoutTotal' in obj) ? obj.checkoutTotal.shopper.amount : obj.shopperCurrencyPaymentAmount.substring(3),
                paymentCardBrand = ('paymentDetails' in obj) ? obj.paymentDetails.methodCardBrand : obj.paymentMethodCardBrand,
                basket = BasketMgr.getCurrentOrNewBasket();
            // Set Override Price Books
            try {
                pricingHelper.setOverridePriceBooks(obj.deliveryCountryIso, shopperCurrency, basket, true);
            } catch (e) {
                ocHelper.setOverridePriceBooks(obj.deliveryCountryIso, shopperCurrency);
            }
            Transaction.wrap(function () {
                let order = OrderMgr.getOrder(obj.retailerCartId);
                // If order not found in SFCC
                if (empty(order)) {
                    response.setStatus(400);
                    responseJSON.ResponseCode = '400';
                    responseJSON.ResponseText = (empty(order)) ? 'Order not found' : 'Order Failed';
                    Response.renderJSON(responseJSON);
                    return;
                } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
                    let result = OrderMgr.undoFailOrder(order);
                    if (result.error) {
                        response.setStatus(409);
                        responseJSON.ResponseCode = '409';
                        responseJSON.ResponseText = 'Error: Inventory Reservation Failed';
                        Response.renderJSON(responseJSON);
                        return;
                    }
                }
                // If order already confirmed & processed
                if (order.confirmationStatus.value === Order.CONFIRMATION_STATUS_CONFIRMED) {
                    responseJSON.ResponseText = 'Order already exists';
                    Response.renderJSON(responseJSON);
                    return;
                }
                // If order exist with created status in SFCC then perform order confirmation
                if (order.status.value === Order.ORDER_STATUS_CREATED) {
                    let currentMethodID = order.shipments[0].shippingMethodID;
                    ocHelper.setApplicableShippingMethods(order, obj.deliveryOption.deliveryOption, obj.deliveryCountryIso, null, currentMethodID);
                    // update ESW order custom attributes
                    if ('checkoutTotal' in obj) { // OC response v3.0
                        ocHelper.updateEswOrderAttributesV3(obj, order);
                    } else { // OC response v2.0
                        ocHelper.updateEswOrderAttributesV2(obj, order);
                    }
                    // update ESW order Item custom attributes
                    let ocLineItemObject = ('lineItems' in obj) ? obj.lineItems : obj.cartItems;
                    if (ocLineItemObject != null && ocLineItemObject[0].product.productCode) {
                        let cartItem;
                        for (let lineItem in order.productLineItems) {
                            cartItem = ocLineItemObject.filter(function (value) {
                                if (value.product.productCode === order.productLineItems[lineItem].productID && value.lineItemId === order.productLineItems[lineItem].custom.eswLineItemId) {
                                    return value;
                                }
                            });
                            if ('lineItems' in obj) { // OC response v3.0
                                ocHelper.updateEswOrderItemAttributesV3(obj, order.productLineItems[lineItem], cartItem);
                            } else { // OC response v2.0
                                ocHelper.updateEswOrderItemAttributesV2(obj, order.productLineItems[lineItem], cartItem);
                            }
                        }
                        if ('lineItems' in obj) { // OC response v3.0
                            ocHelper.updateOrderLevelAttrV3(obj, order);
                        }
                    }
                    // update ESW order Item custom attributes
                    ocHelper.updateShopperAddressDetails(obj.contactDetails, order);
                    // update ESW Payment instrument custom attributes
                    ocHelper.updateEswPaymentAttributes(order, totalCheckoutAmount, paymentCardBrand);

                    OrderMgr.placeOrder(order);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);

                    if (!empty(obj.shopperCheckoutExperience) && !empty(obj.shopperCheckoutExperience.registeredProfileId)) {
                        ocHelper.saveAddressinAddressBook(obj.contactDetails, obj.shopperCheckoutExperience.registeredProfileId, obj.shopperCheckoutExperience.saveAddressForNextPurchase);
                    }

                    if (eswHelper.isUpdateOrderPaymentStatusToPaidAllowed()) {
                        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    }
                }
            });
        } catch (e) {
            logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
            // In SFCC, SystemError suggest exceptions initiated by system like optimistic lock exception etc.
            if (e.name === 'SystemError') {
                response.setStatus(429);
                responseJSON.ResponseCode = '429';
                responseJSON.ResponseText = 'Transient Error: Too many requests';
            } else { // For other errors like ReferenceError etc.
                response.setStatus(400);
                responseJSON.ResponseCode = '400';
                responseJSON.ResponseText = 'Error: Internal error';
            }
        }
        eswHelper.eswInfoLogger('Esw Order Confirmation Response', JSON.stringify(responseJSON));
    }
    Response.renderJSON(responseJSON);
}

/**
 * Function to handle Embeded Checkout order confirmation request in V2
 */
function eswEmbeddedCheckoutNotify() {
    let eswCoreApiHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper'),
        eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
        eswOcapiServiceHelper = require('*/cartridge/scripts/services/EswOcapiService').getEswOcapiServices,
        embCheckoutHelper = require('*/cartridge/scripts/helper/eckoutHelper').eswEmbCheckoutHelper;
    let Transaction = require('dw/system/Transaction'),
        logger = require('dw/system/Logger'),
        ProductMgr = require('dw/catalog/ProductMgr'),
        responseJSON = {};
    let preorderServiceObj = eswCoreService.getSFCCOcapi();
    let currentBasketData = null;

    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        logger.error('ESW Order Confirmation Error: Basic Authentication Token did not match');
    } else {
        try {
            let obj = JSON.parse(request.httpParameterMap.requestBodyAsString);

            eswHelper.eswInfoLogger('Esw Order Confirmation Request', JSON.stringify(obj));

            let ocHelper = require('*/cartridge/scripts/helper/orderConfirmationHelper').getEswOcHelper();

            let inventoryValidationPlis = { productLineItems: new ArrayList([]) };
            let authKey,
                accessToken;
            let basketID = eswHelper.getRetailerCartId(obj.retailerCartId);
            accessToken = eswHelper.getPWAHeadlessAccessToken(obj);
            if (!empty(accessToken)) {
                if (typeof accessToken === 'string') {
                    authKey = 'Bearer ' + accessToken;
                } else {
                    authKey = accessToken.authorization;
                }
            } else {
                let dwSid = eswHelper.getDwsid(obj);
                let customerEndpoint = Constants.CUSTOMER_AUTH + eswHelper.getOcapiClientID();
                let customerAuth = preorderServiceObj.call({ requestBody: { type: 'session' }, endpoint: customerEndpoint, dwsid: dwSid });
                authKey = customerAuth.ok && !empty(customerAuth.object) ? customerAuth.object.getResponseHeader('authorization') : null;
            }
            let shopperCurrency = ('checkoutTotal' in obj) ? obj.checkoutTotal.shopper.currency : obj.shopperCurrencyPaymentAmount.substring(0, 3);
            ocHelper.setOverridePriceBooks(obj.deliveryCountryIso, shopperCurrency);

            let ocapiBasketResponse = eswOcapiServiceHelper.ocapiBasketService().call({
                basketId: basketID,
                httpMethod: 'GET',
                authToken: authKey
            });

            if (ocapiBasketResponse.isOk() && !empty(ocapiBasketResponse.getObject())) {
                currentBasketData = JSON.parse(ocapiBasketResponse.object.text);

                if (eswHelper.getEnableInventoryCheck()) {
                    for (let i = 0; i < currentBasketData.product_items.length; i++) {
                        inventoryValidationPlis.productLineItems.add({
                            product: ProductMgr.getProduct(currentBasketData.product_items[i].product_id),
                            quantityValue: currentBasketData.product_items[i].quantity
                        });
                    }
                    if (!ocHelper.validateEswOrderInventory(inventoryValidationPlis)) {
                        throw new Error('Inventory validation failed');
                    }
                }
            }

            let isValidBasket = eswCoreApiHelper.compareBasketAndOcProducts(currentBasketData, obj);
            if (!isValidBasket) {
                throw new Error('Basket data from OCAPI and ESW Checkout are not equal');
            }

            let ocapiOrderResponse = eswOcapiServiceHelper.ocapiOrderService().call({
                httpMethod: 'POST',
                authToken: authKey,
                basketId: basketID,
                countryCode: obj.deliveryCountryIso
            });

            if (ocapiOrderResponse.isOk() && !empty(ocapiOrderResponse.getObject())) {
                let orderData = JSON.parse(ocapiOrderResponse.object.text);
                Transaction.wrap(function () {
                    embCheckoutHelper.processUpdateOrderAttributes(orderData.order_no, obj, null);
                });

                responseJSON = {
                    OrderNumber: orderData.order_no,
                    EShopWorldOrderNumber: obj.eShopWorldOrderNumber,
                    ResponseCode: '200',
                    ResponseText: 'Success'
                };
            } else {
                throw new Error('Error while generating order from the basket');
            }
        } catch (e) {
            logger.error('ESW Service Error: {0}', e.message);
            if (e.name === 'SystemError') {
                response.setStatus(429);
                responseJSON.ResponseCode = '429';
                responseJSON.ResponseText = 'Transient Error: Too many requests';
            } else {
                response.setStatus(400);
                responseJSON.ResponseCode = '400';
                responseJSON.ResponseText = 'Error: Internal error';
            }
        }

        eswHelper.eswInfoLogger('Esw Order Confirmation Response', JSON.stringify(responseJSON));
    }

    Response.renderJSON(responseJSON);
}

/**
 * Store webhook response
 * @returns {void} - Void
 */
function processWebHooks() {
    let responseJSON = {};
    responseJSON = eswHelper.handleWebHooks(JSON.parse(request.httpParameterMap.requestBodyAsString), request.httpHeaders.get('esw-event-type'));
    Response.renderJSON(responseJSON);
}

/**
 * Function to be called to render ESW Embeded Checkout page
 */
function eswEmbeddedCheckout() {
    // This controller will be in use only if int_eshopworld_eckout cartridge is in the path
    const embCheckoutHelper = require('*/cartridge/scripts/helper/eckoutHelper').eswEmbCheckoutHelper;
    var iframeUrlQueryParam = request.httpParameterMap.get(Constants.EMBEDDED_CHECKOUT_QUERY_PARAM).stringValue;
    var eswIframeCheckoutUrl = empty(iframeUrlQueryParam) ? request.httpCookies[embCheckoutHelper.getEswIframeCookieName()].value : iframeUrlQueryParam;
    app.getView({
        eswCheckoutUrl: eswIframeCheckoutUrl,
        eswIframeErrorLogUrl: URLUtils.https('EShopWorldSG-EswIframeFailed').toString(),
        eswIframeFallbackUrl: embCheckoutHelper.getEswIframeFallbackUrl()
    }).render('checkout/eswEmbeddedCheckoutSG');
}

/**
 * Function to be called to render ESW Embeded Checkout page Headless Checkout
 */
function eswEmbeddedCheckoutPreOrderRequest() {
    let logger = require('dw/system/Logger');
    let eswOcapiServiceHelper = require('*/cartridge/scripts/services/EswOcapiService').getEswOcapiServices;
    let response = {};
    let param = request.httpParameterMap;
    let postedData = null;
    let ocapiBasketResponse = null;

    try {
        // Validate country code
        if (!param.get('country-code') || !eswHelper.checkIsEswAllowedCountry(param.get('country-code').stringValue)) {
            response.error = 'CHECKOUT_FAILED';
            Response.renderJSON(response);
            return;
        }

        postedData = JSON.parse(request.httpParameterMap.requestBodyAsString);
        ocapiBasketResponse = eswOcapiServiceHelper.ocapiBasketService().call({
            basketId: postedData.basket_id,
            httpMethod: 'PATCH',
            countryCode: param.get('country-code').stringValue
        });

        if (ocapiBasketResponse.ok && ocapiBasketResponse.object) {
            response = JSON.parse(ocapiBasketResponse.object.text);
            if (response.c_eswPreOrderResponse && response.c_eswPreOrderResponse.redirectUrl) {
                response.c_eswPreOrderResponse.redirectUrl = eswHelper.getEswHeadlessSiteUrl() + Constants.EMBEDDED_CHECKOUT_ENDPOINT_HEADLESS_SITE_GENESIS + Constants.EMBEDDED_CHECKOUT_QUERY_PARAM + Constants.EQUALS_OPERATOR + response.c_eswPreOrderResponse.redirectUrl;
            }
        } else {
            response.error = 'CHECKOUT_FAILED';
        }
    } catch (e) {
        logger.error('EShopWorld-EswEmbeddedCheckoutPreOrderRequest Error: {0}', e.message);
        response.error = 'CHECKOUT_FAILED';
    }
    Response.renderJSON(response);
}

/* Web exposed methods */

/** Gets ESW header bar.
 * @see {@link module:controllers/EShopWorld~GetEswHeader} */
exports.GetEswHeader = guard.ensure(['get'], getESWHeaderBar);

/** Gets ESW footer bar.
 * @see {@link module:controllers/EShopWorld~GetEswFooter} */
exports.GetEswFooter = guard.ensure(['get'], getESWFooterBar);

/** Gets ESW landing page bar with countries, locales and currency dropdowns.
 * @see {@link module:controllers/EShopWorld~GetEswLandingPage} */
exports.GetEswLandingPage = guard.ensure(['get'], getESWLandingPage);

/** Gets Default currency with given country.
 * @see {@link module:controllers/EShopWorld~GetEswLandingPage} */
exports.GetDefaultCurrency = guard.ensure(['get'], getDefaultCurrency);

/** Gets ESW app resources.
 * @see {@link module:controllers/EShopWorld~GetEswAppResources} */
exports.GetEswAppResources = guard.ensure(['get'], getEswAppResources);

/** Converts the given price
 * @see {@link module:controllers/EShopWorld~GetConvertedPrice} */
exports.GetConvertedPrice = guard.ensure(['get'], getConvertedPrice);

/** Handles the preorder request
 * @see {@link module:controllers/EShopWorld~PreOrder} */
exports.PreOrderRequest = guard.ensure(['get', 'https'], preOrderRequest);

/** Renders the home page redirected from ESW Checkout.
 * @see module:controllers/EShopWorld~home */
exports.Home = guard.ensure(['get'], eswBackToHome);

/** Renders the cart page redirected from ESW Checkout.
 * @see module:controllers/EShopWorld~getCart */
exports.GetCart = guard.ensure(['get'], eswBackToCart);

/** Renders the account login/create page redirected from ESW Confirmation.
 * @see module:controllers/EShopWorld~registerCustomer */
exports.RegisterCustomer = guard.ensure(['get'], registerCustomer);

/** Handles the order inventory check before order confirmation.
 * @see {@link module:controllers/EShopWorld~ValidateInventory} */
exports.ValidateInventory = guard.ensure(['post', 'https'], validateInventory);

/** Handles the order confirmation request
  * @see {@link module:controllers/EShopWorld~Notify} */
exports.Notify = guard.ensure(['post', 'https'], notify);

 /** Process the webhook for Logistic return portal.
  * @see module:controllers/EShopWorld~processWebHooks */
exports.ProcessWebHooks = guard.ensure(['post'], processWebHooks);

/** Renders the Embeded checkout
 * @see module:controllers/EShopWorldSG~eswEmbeddedCheckout */
exports.EswEmbeddedCheckout = guard.ensure(['get'], eswEmbeddedCheckout);

/** Handles the order confirmation request
 * @see module:controllers/EShopWorldSG~EsWEmbeddedCheckoutNotify */
exports.EsWEmbeddedCheckoutNotify = guard.ensure(['post'], eswEmbeddedCheckoutNotify);

/** Handles the pre order request
 * @see module:controllers/EShopWorldSG~EswEmbeddedCheckoutPreOrderRequest */
exports.EswEmbeddedCheckoutPreOrderRequest = guard.ensure(['post'], eswEmbeddedCheckoutPreOrderRequest);
