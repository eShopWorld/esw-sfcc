'use strict';

/**
 * @namespace Checkout
 */

const server = require('server');
server.extend(module.superModule);

/* API includes */
const URLUtils = require('dw/web/URLUtils');
const logger = require('dw/system/Logger');

/* Script Modules */
const Constants = require('*/cartridge/scripts/util/Constants');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();


/**
 * function used to set initial cookies for country, currency and local.
 * this function will set cookies only if there is no cookie set for any variable
 * @param {Object} req - productLineItem
 */
function setInitialCookies(req) {
    let country = eswHelper.getAvailableCountry();
    let currencyCode = eswHelper.getDefaultCurrencyForCountry(country);
    let locale = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllowedLanguages()[0].value;

    let Site = require('dw/system/Site').getCurrent();
    let locationParameter = !empty(req.httpParameterMap) ? req.httpParameterMap.get(Site.getCustomPreferenceValue('eswCountryUrlParam')) : null;
    eswHelper.setCustomSessionVariables(country, currencyCode);
    eswHelper.createInitialCookies(country, currencyCode, locale);
    eswHelper.setCustomerCookies();

    if (!empty(locationParameter) && !empty(locationParameter.value)) {
        eswHelper.setLocation(locationParameter.value);
        if (request.httpCookies['esw.Landing.Played'] == null) {
            eswHelper.createCookie('esw.Landing.Played', true, '/');
        }
    }
    if (eswHelper.checkIsEswAllowedCountry(country)) {
        if (!eswHelper.overridePrice(req, country)) {
            eswHelper.setBaseCurrencyPriceBook(req, eswHelper.getBaseCurrencyPreference());
        }
    }
    if (eswHelper.checkIsEswAllowedCountry(country) != null && empty(locationParameter.value)) {
        if (request.httpCookies['esw.currency'] == null) {
            eswHelper.selectCountry(eswHelper.getAvailableCountry(), currencyCode, locale);
        } else {
            eswHelper.selectCountry(eswHelper.getAvailableCountry(), request.httpCookies['esw.currency'].value, locale);
        }
    }
}


/**
 * Get general ESW configs from custom site preference
 * @returns {Object} - General Config JSON object
 */
function getESWGeneralConfigs() {
    let Site = require('dw/system/Site').getCurrent();
    let country = eswHelper.getAvailableCountry();
    let currency;
    let urlParameter = request.httpParameterMap.get(Site.getCustomPreferenceValue('eswCountryUrlParam'));

    if (urlParameter && urlParameter.value && eswHelper.checkIsEswAllowedCountry(urlParameter.value)) {
        currency = eswHelper.getDefaultCurrencyForCountry(urlParameter.value);
    } else {
        currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getDefaultCurrencyForCountry(eswHelper.getAvailableCountry());
    }
    let language = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllowedLanguages()[0].value;
    let ESWGeneralConfigs = {
        selectedCountry: country,
        selectedCountryName: eswHelper.getCountryName(country),
        selectedLanguage: language,
        selectedCurrency: currency
    };
    if (!customer.authenticated) {
        eswHelper.createCookie('esw-shopper-access-token', '', request.httpHost, 'expired', eswHelper.getTopLevelDomain());
    }
    return ESWGeneralConfigs;
}

/**
 * Get header bar of ESW and render template for it in response
 */
server.get('GetEswHeader', function (req, res, next) {
    setInitialCookies(req);
    let ESWHeaderConfigs = getESWGeneralConfigs();
    res.render('/EswMfComponents/eswHeaderBar', {
        EswHeaderEnabled: eswHelper.getEnableHeaderBar(),
        EswHeaderObject: ESWHeaderConfigs
    });
    next();
});

/**
 * Get footer bar of ESW and render template for it in response
 */
server.get('GetEswFooter', function (req, res, next) {
    setInitialCookies(req);
    let ESWFooterConfigs = getESWGeneralConfigs();
    res.render('/EswMfComponents/eswFooterBar', {
        EswFooterEnabled: eswHelper.getEnableFooterBar(),
        EswFooterObject: ESWFooterConfigs
    });
    next();
});

/**
 * Get landing page of ESW and render template for it in response
 */
server.get('GetEswLandingPage', function (req, res, next) {
    if (empty(request.httpCookies['esw.Landing.Played']) || request.httpCookies['esw.Landing.Played'] === false || req.querystring.dropDownSelection === 'true') {
        let Cookie = require('dw/web/Cookie');
        let eswLandingCookie = new Cookie('esw.Landing.Played', true);
        eswLandingCookie.setPath('/');
        response.addHttpCookie(eswLandingCookie);
        setInitialCookies(req);
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

        res.render('/EswMfComponents/eswLandingPage', {
            EswLandingObject: ESWLandingConfigs
        });
        next();
    }
    return;
});


/**
 * Get footer bar of ESW and render template for it in response
 */
server.get('GetDefaultCurrency', function (req, res, next) {
    let selectedCountry = req.querystring.country,
        selectedCountryDetail = eswHelper.getSelectedCountryDetail(selectedCountry);
    res.json({
        success: !empty(selectedCountryDetail.defaultCurrencyCode),
        isAllowed: selectedCountryDetail.isSupportedByESW,
        currency: selectedCountryDetail.defaultCurrencyCode,
        isFixedPriceCountry: selectedCountryDetail.isFixedPriceModel
    });
    next();
});

/**
 * Get ESW App Resources for frontend prices conversion (content assets & callout messages)
 */
server.get('GetEswAppResources', function (req, res, next) {
    let selectedCountryParam = null;
    let Site = require('dw/system/Site').getCurrent();
    let Currency = require('dw/util/Currency');
    let locationUrlParameter = !empty(req.httpParameterMap) ? req.httpParameterMap.get(Site.getCustomPreferenceValue('eswCountryUrlParam')) : null;
    if (empty(locationUrlParameter) || empty(locationUrlParameter.value)) {
        selectedCountryParam = !empty(request.httpCookies['esw.location']) && !empty(request.httpCookies['esw.location'].value) ? request.httpCookies['esw.location'].value : eswHelper.getAvailableCountry();
    } else {
        selectedCountryParam = locationUrlParameter.value;
    }
    let selectedCountry = eswHelper.getSelectedCountryDetail(selectedCountryParam);
    let selectedCurrency = eswHelper.getDefaultCurrencyForCountry(selectedCountry.countryCode);
    res.render('/EswMfComponents/eswAppResources', {
        isEswRoundingsEnabled: eswHelper.isEswRoundingsEnabled(),
        isFrontendConversionEnabled: eswHelper.isFrontendConversionEnabled(),
        selectedCurrencySymbol: Currency.getCurrency(selectedCurrency).symbol,
        isFixedPriceCountry: selectedCountry.isFixedPriceModel || !selectedCountry.isSupportedByESW
    });
    next();
});

/*
 * This is the preorder request which is generating at time of redirection from cart page to ESW checkout
 */
server.get('PreOrderRequest', function (req, res, next) {
    let BasketMgr = require('dw/order/BasketMgr');
    let Transaction = require('dw/system/Transaction');
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    let currentBasket = null;

    eswHelper.setEnableMultipleFxRatesCurrency(req);

    let isAjax = Object.hasOwnProperty.call(request.httpHeaders, 'x-requested-with');

    let shopperBasket = BasketMgr.getCurrentBasket();
    if (shopperBasket) {
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(shopperBasket);
        });
        // Get basket after update all totlas
        currentBasket = BasketMgr.getCurrentBasket();
    }

    if (currentBasket) {
        delete session.privacy.restrictedProductID;
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (let lineItemNumber in currentBasket.productLineItems) {
            let cartProduct = currentBasket.productLineItems[lineItemNumber].product;
            if (eswHelper.isProductRestricted(cartProduct.custom)) {
                session.privacy.eswProductRestricted = true;
                session.privacy.restrictedProductID = cartProduct.ID;
                if (isAjax) {
                    res.json({
                        redirectURL: URLUtils.https('Cart-Show').toString()
                    });
                } else {
                    res.redirect(URLUtils.https('Cart-Show').toString());
                }
                return next();
            }
        }
    }

    let result;
    try {
        let preOrderrequestHelper = require('*/cartridge/scripts/helper/preOrderRequestHelper');
        if (eswHelper.isEswEnabledEmbeddedCheckout()) {
            result = eswHelper.generatePreOrderUsingBasket();
        } else {
            result = preOrderrequestHelper.handlePreOrderRequestV2();
        }
        if (result.status === 'REDIRECT') {
            res.json({
                redirectURL: URLUtils.https('Checkout-Begin').toString()
            });
            return next();
        }
        if (result.status === 'ERROR' || empty(result.object)) {
            logger.error('ESW Service Error: {0}', result.errorMessage);
            session.privacy.eswfail = true;
            if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                res.json({
                    error: 'CHECKOUT_FAILED'
                });
            }
            if (isAjax) {
                res.json({
                    redirectURL: URLUtils.https('Cart-Show').toString()
                });
            } else {
                res.redirect(URLUtils.https('Cart-Show').toString());
            }
        } else {
            let redirectURL = JSON.parse(result.object).redirectUrl;
            if ('shopperAccessToken' in JSON.parse(result.object)) {
                eswHelper.createCookie('esw-shopper-access-token', JSON.parse(result.object).shopperAccessToken, '/', 3600, eswHelper.getTopLevelDomain());
            } else {
                eswHelper.createCookie('esw-shopper-access-token', '', '/', 'expired', eswHelper.getTopLevelDomain());
            }
            delete session.privacy.guestCheckout;
            if (isAjax) {
                res.json({
                    redirectURL: eswHelper.isEswEnabledEmbeddedCheckout() ?
                     URLUtils.https('EShopWorld-EswEmbeddedCheckout', Constants.EMBEDDED_CHECKOUT_QUERY_PARAM, redirectURL).toString() :
                     redirectURL
                });
            } else {
                res.redirect(redirectURL);
            }
        }
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
        session.privacy.eswfail = true;
        if (isAjax) {
            if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                res.json({
                    error: 'CHECKOUT_FAILED'
                });
            }
            res.json({
                redirectURL: URLUtils.https('Cart-Show').toString()
            });
        } else {
            res.redirect(URLUtils.https('Cart-Show').toString());
        }
    }
    next();
    return null;
});


/*
 * Render Product Tiles with Dynamic Prices and to avoid cache issue.
 */
server.get('Cache', function (req, res, next) {
    let params = { remoteIncludeUrl: null };
    let requestParams = req.querystring.toString();
    if (('remoteIncludeUrl' in req.querystring) && req.querystring.remoteIncludeUrl) {
        params.remoteIncludeUrl = URLUtils.url(req.querystring.remoteIncludeUrl);
        requestParams = requestParams.replace(/&remoteIncludeUrl=+/g + req.querystring.remoteIncludeUrl, '');
    }
    if (req.querystring.ajax) {
        requestParams = requestParams.replace(/&ajax=+/g + req.querystring.ajax, '');
        params.ajax = 'true';
    }
    let currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getDefaultCurrencyForCountry(eswHelper.getAvailableCountry());
    let country = eswHelper.getAvailableCountry();
    params.remoteIncludeUrl.append('eswCountry', country);
    params.remoteIncludeUrl.append('eswCurrency', currency);
    params.remoteIncludeUrl = (params.remoteIncludeUrl.toString() + '&' + requestParams);
    res.render('/EswMfComponents/remoteinclude', params);
    return next();
});

/**
 * Function to return to home page after rebuilding cart
 */
server.get('Home', function (req, res, next) {
    res.cachePeriod = 0;
    res.cachePeriodUnit = 'minutes';
    // Rebuild cart starts here
    eswHelper.rebuildCart();
    // Rebuild cart ends here
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

/**
 * Function to return to cart page after rebuilding cart
 */
server.get('GetCart', function (req, res, next) {
    res.cachePeriod = 0;
    res.cachePeriodUnit = 'minutes';
    // Rebuild cart starts here
    eswHelper.rebuildCart();
    // Rebuild cart ends here
    res.redirect(URLUtils.https('Cart-Show'));
    next();
});

/**
 * Function to return to updated PDP product price
 */
server.get('GetSelectedCountryProductPrice', function (req, res, next) {
    let params = { productStrikePrice: null, EShopWorldModuleEnabled: false, isAjaxCall: false };
    let requestParams = req.querystring;
    params.isLowPrice = requestParams.isLowPrice;
    let priceObject = 'priceObject' in requestParams && !empty(requestParams.priceObject) ? JSON.parse(requestParams.priceObject) : null;
    if (!eswHelper.isAjaxCall() && !empty(priceObject)) {
        params.price = priceObject;
        if (!eswHelper.isAjaxCall()) {
            params.EShopWorldModuleEnabled = true;
            let eswSFRAHelper = require('*/cartridge/scripts/helper/eswSFRAHelper');
            let listPrice,
                salesprice;
            if (priceObject.list !== null && typeof priceObject.list === 'object') {
                listPrice = priceObject.list;
                params.productStrikePrice = eswSFRAHelper.getEShopWorldModuleEnabled() ? eswSFRAHelper.getSelectedCountryProductPrice(listPrice.value, listPrice.currency) : listPrice;
            }
            salesprice = priceObject.sales;
            params.productPrice = eswSFRAHelper.getEShopWorldModuleEnabled() ? eswSFRAHelper.getSelectedCountryProductPrice(salesprice.value, salesprice.currency) : salesprice;
        }
        res.render('product/components/pricing/defaultESWSalesPrice', params);
    }
    return next();
});

/*
 * Function to handle register customer request coming from ESW order confirmation
 */
server.get('RegisterCustomer', function (req, res, next) {
    let CustomerMgr = require('dw/customer/CustomerMgr');
    let Transaction = require('dw/system/Transaction');
    let OrderMgr = require('dw/order/OrderMgr');
    let orderNumber,
        existerCustomer;
    try {
        orderNumber = session.privacy.confirmedOrderID;
        let params = {},
            registrationObj = {},
            password;
        let order = OrderMgr.getOrder(orderNumber);
        if (order && order.customer.ID === req.currentCustomer.raw.ID) {
            existerCustomer = CustomerMgr.getCustomerByLogin(order.getCustomerEmail());
            if (existerCustomer && existerCustomer.registered) {
                let profileForm = server.forms.getForm('profile');
                Transaction.wrap(function () { order.setCustomer(existerCustomer); });
                params = { rememberMe: null, userName: '', actionUrl: null, profileForm: null };
                params.rememberMe = false;
                params.actionUrl = URLUtils.url('Account-Login');
                params.userName = existerCustomer.profile.email;
                profileForm.clear();
                params.profileForm = profileForm;
                res.render('account/eswLoginForm', params);
            } else {
                password = eswHelper.generateRandomPassword();
                registrationObj = {
                    firstName: order.billingAddress.firstName,
                    lastName: order.billingAddress.lastName,
                    phone: order.billingAddress.phone,
                    email: order.customerEmail,
                    password: password
                };
                this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                    let addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

                    let login = registrationObj.email;
                    let newCustomer;
                    let authenticatedCustomer;
                    let newCustomerProfile;

                    // attempt to create a new user and log that user in.
                    Transaction.wrap(function () {
                        let error = {};
                        newCustomer = CustomerMgr.createCustomer(order.customerEmail, password);

                        let authenticateCustomerResult = CustomerMgr.authenticateCustomer(order.customerEmail, password);
                        if (authenticateCustomerResult.status !== 'AUTH_OK') {
                            error = { authError: true, status: authenticateCustomerResult.status };
                            throw error;
                        }

                        authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

                        if (!authenticatedCustomer) {
                            error = { authError: true, status: authenticateCustomerResult.status };
                            throw error;
                        } else {
                            // assign values to the profile
                            newCustomerProfile = newCustomer.getProfile();

                            newCustomerProfile.firstName = registrationObj.firstName;
                            newCustomerProfile.lastName = registrationObj.lastName;
                            newCustomerProfile.phoneHome = registrationObj.phone;
                            newCustomerProfile.email = login;

                            order.setCustomer(newCustomer);

                            // save all used shipping addresses to address book of the logged in customer
                            let allAddresses = addressHelpers.gatherShippingAddresses(order);
                            allAddresses.forEach(function (address) {
                                addressHelpers.saveAddress(address, { raw: newCustomer }, addressHelpers.generateAddressName(address));
                            });
                            // update marketing optin values on customer profile
                            newCustomerProfile.custom.eswMarketingOptIn = order.custom.eswEmailMarketingOptIn;
                            newCustomerProfile.custom.eswSMSMarketingOptIn = order.custom.eswSMSMarketingOptIn;

                            res.setViewData({ newCustomer: newCustomer });
                            res.setViewData({ order: order });
                        }
                    });

                    eswHelper.sendRegisterCustomerEmail(authenticatedCustomer, password);

                    res.redirect(URLUtils.url('Account-Show', 'registration', 'submitted').toString());
                    next();
                });
            }
        } else {
            res.redirect(URLUtils.url('Login-Show', 'showRegistration', 'true').toString());
        }
    } catch (error) {
        if ((!empty(session.privacy.confirmedOrderID) || !empty(orderNumber)) && !empty(existerCustomer) && existerCustomer.registered) {
            res.redirect(URLUtils.url('Login-Show').toString());
        } else {
            res.redirect(URLUtils.url('Login-Show', 'showRegistration', 'true').toString());
        }
        eswHelper.eswInfoLogger('Error While Creating customers account', error);
    }
    next();
});


module.exports = server.exports();
