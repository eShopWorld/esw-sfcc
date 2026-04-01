'use strict';

const server = require('server');
server.extend(module.superModule);

const URLUtils = require('dw/web/URLUtils');
const Constants = require('*/cartridge/scripts/util/Constants');
const AutomationConstants = require('*/cartridge/scripts/util/E2EConstants');

const e2eHelpers = require('*/cartridge/scripts/helpers/e2eHelpers');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const eswCoreHelpers = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

let isPwa = false;
try {
    const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
    isPwa = !empty(eswPwaHelper.getPwaUrl());
} catch (e) {
    isPwa = false;
}


/**
 * POST /EShopWorld-E2eConfigurations
 * Example endpoint for E2E automation configuration
 */
server.post('E2eConfigurations', function (req, res, next) {
    let configs = e2eHelpers.getE2eConfigurations();
    res.json({ configs: configs });
    return next();
});

server.get('GetPromoDetail', function (req, res, next) {
    const collections = require('*/cartridge/scripts/util/collections');
    let BasketMgr = require('dw/order/BasketMgr');
    let currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            promotionResult: [],
            message: 'No basket found'
        });
        return next();
    }

    let orderPriceAdjustments = currentBasket.getPriceAdjustments();
    let promoDetails = [];

    collections.forEach(orderPriceAdjustments, function (pa) {
        let promo = pa.getPromotion();
        let detail;

        if (!promo) {
            detail = {
                promotionId: pa.promotionID,
                promotionName: pa.lineItemText,
                appliedDiscountValue: pa.price ? pa.price.value : 0,
                discountType: 'Order',
                discountValue: Math.abs(pa.price.value)
            };
        } else {
            detail = {
                promotionId: promo.getID(),
                promotionName: promo.getName(),
                appliedDiscountValue: pa.price ? pa.price.value : 0,
                discountType: 'Order',
                discountValue: Math.abs(pa.price.value)
            };
        }

        promoDetails.push(detail);
    });

    collections.forEach(currentBasket.getAllProductLineItems(), function (productLineItem) {
        collections.forEach(productLineItem.getPriceAdjustments(), function (pa) {
            let promo = pa.getPromotion();
            let detail;

            if (!promo) {
                detail = {
                    promotionId: pa.promotionID,
                    promotionName: pa.lineItemText,
                    appliedDiscountValue: pa.price ? pa.price.value : 0,
                    discountType: 'Product',
                    discountValue: Math.abs(pa.price.value)
                };
            } else {
                detail = {
                    promotionId: promo.getID(),
                    promotionName: promo.getName(),
                    appliedDiscountValue: pa.price ? pa.price.value : 0,
                    discountType: 'Product',
                    discountValue: Math.abs(pa.price.value)
                };
            }

            promoDetails.push(detail);
        });
    });

    collections.forEach(currentBasket.getAllShippingPriceAdjustments(), function (pa) {
        let promo = pa.getPromotion();
        let detail;

        if (!promo) {
            detail = {
                promotionId: pa.promotionID,
                promotionName: pa.lineItemText,
                appliedDiscountValue: pa.price ? pa.price.value : 0,
                discountType: 'Shipping',
                discountValue: Math.abs(pa.price.value)
            };
        } else {
            detail = {
                promotionId: promo.getID(),
                promotionName: promo.getName(),
                appliedDiscountValue: pa.price ? pa.price.value : 0,
                discountType: 'Shipping',
                discountValue: Math.abs(pa.price.value)
            };
        }

        promoDetails.push(detail);
    });


    res.json({
        promotionResult: promoDetails,
        basketTotal: currentBasket.getTotalGrossPrice().value,
        currency: currentBasket.currencyCode
    });

    return next();
});


/*
 * This is the preorder request which is generating at time of redirection from cart page to ESW checkout
 */
if (!isPwa) {
    server.replace('PreOrderRequest', function (req, res, next) {
        let BasketMgr = require('dw/order/BasketMgr');
        let Transaction = require('dw/system/Transaction');
        let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        let currentBasket = null;

        eswCoreHelpers.setEnableMultipleFxRatesCurrency(req);

        let isAjax = Object.hasOwnProperty.call(request.httpHeaders, 'x-requested-with');
        let result;
        let preorderRes;

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
                if (eswCoreHelpers.isProductRestricted(cartProduct.custom)) {
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

        let preOrderrequestHelper = require('*/cartridge/scripts/helper/preOrderRequestHelper');
        if (eswCoreHelpers.isEswEnabledEmbeddedCheckout()) {
            preorderRes = eswCoreHelpers.generatePreOrderUsingBasket(null);
        } else {
            preorderRes = preOrderrequestHelper.handlePreOrderRequestV2(null);
        }
        result = preorderRes.result;
        let eswShopperAccessToken = '';
        if (result.status === 'REDIRECT') {
            if ('shopperAccessToken' in JSON.parse(result.object)) {
                eswShopperAccessToken = JSON.parse(result.object).shopperAccessToken;
            }
            res.json({
                redirectURL: URLUtils.https('Checkout-Begin').toString(),
                eswAuthToken: eswShopperAccessToken

            });
            return next();
        }
        if (result.status === 'ERROR' || empty(result.object)) {
            session.privacy.eswfail = true;
            if (eswCoreHelpers.isEswEnabledEmbeddedCheckout()) {
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
                eswShopperAccessToken = JSON.parse(result.object).shopperAccessToken;
            }
            delete session.privacy.guestCheckout;
            if (isAjax) {
                res.json({
                    redirectURL: eswCoreHelpers.isEswEnabledEmbeddedCheckout() ?
                     URLUtils.https('EShopWorld-EswEmbeddedCheckout', Constants.EMBEDDED_CHECKOUT_QUERY_PARAM, redirectURL).toString() :
                     redirectURL,
                    eswAuthToken: eswShopperAccessToken,
                    preorderReqPayload: preorderRes.preorderReqPayload
                });
            } else {
                res.redirect(redirectURL);
            }
        }
        next();
    });
}

/**
 * POST /EShopWorld-GetOrderDetail
 * Receives { orderNumber } in the POST body and returns the order object as JSON
 */
server.post('GetOrderDetail', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var orderNumber = JSON.parse(req.body).orderNumber;
    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        res.setStatusCode(404);
        res.json({ error: true, message: 'Order not found' });
        return next();
    }
    // Serialize only safe fields (do not expose sensitive data)
    let orderProductLineIItems = order.productLineItems.toArray().map(function (lineItem) {
        return {
            productID: lineItem.productID,
            eswShopperCurrencyItemPriceInfo: lineItem.custom.eswShopperCurrencyItemPriceInfo
        };
    });
    res.json({
        orderNo: order.orderNo,
        eswOrderAttributes: {
            eswShopperCurrencyTotal: order.custom.eswShopperCurrencyTotal,
            eswShopperCurrencyPaymentAmount: String(order.custom.eswShopperCurrencyPaymentAmount)
        },
        eswProductLineItemAttribute: orderProductLineIItems
    });
    return next();
});

/**
 * POST /EShopWorld-DeleteCustomerAddresses
 * E2E helper endpoint to delete all customer addresses.
 * Receives { customerEmail } in POST body.
 */
server.post('DeleteCustomerAddresses', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Logger = require('dw/system/Logger');

    try {
        var reqBody = JSON.parse(req.body);
        var customerEmail = reqBody.customerEmail;

        if (!customerEmail) {
            res.json({
                success: false,
                error: 'customerEmail is required'
            });
            return next();
        }

        // Get customer by email
        var customer = CustomerMgr.getCustomerByLogin(customerEmail);
        if (!customer) {
            res.json({
                success: false,
                error: 'Customer not found: ' + customerEmail
            });
            return next();
        }

        var profile = customer.getProfile();
        if (!profile) {
            res.json({
                success: false,
                error: 'Customer profile not found'
            });
            return next();
        }

        var deletedCount = 0;
        Transaction.wrap(function () {
            var addressBook = profile.getAddressBook();
            var existingAddresses = addressBook.getAddresses().toArray();
            for (var i = 0; i < existingAddresses.length; i++) {
                addressBook.removeAddress(existingAddresses[i]);
                deletedCount++;
            }
        });

        res.json({
            success: true,
            message: 'Customer addresses deleted successfully',
            deletedCount: deletedCount,
            customerEmail: customerEmail
        });
        return next();
    } catch (e) {
        Logger.error('Error in DeleteCustomerAddresses: ' + e.message);
        res.json({
            success: false,
            error: e.message,
            stack: e.stack
        });
        return next();
    }
});

/**
 * POST /EShopWorld-DeleteCustomer
 * E2E helper endpoint to delete a customer account from SFCC.
 * Used for test data cleanup during automation.
 * Receives { customerEmail } in POST body.
 */
/**
 * POST /EShopWorld-DeleteCustomer
 * E2E helper endpoint to delete a customer account from SFCC.
 * Used for test data cleanup during automation.
 * Receives { customerEmail } in POST body.
 */
server.post('DeleteCustomer', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    let error;

    try {
        var reqBody = JSON.parse(req.body);
        var customerEmail = reqBody.customerEmail;

        if (!customerEmail) {
            res.json({
                success: false,
                error: 'customerEmail is required'
            });
            return next();
        }

        var customer = CustomerMgr.getCustomerByLogin(customerEmail);

        if (!customer) {
            res.json({
                success: false,
                error: 'Customer not found: ' + customerEmail
            });
            return next();
        }
        let authenticateCustomerResult = CustomerMgr.authenticateCustomer(customerEmail, AutomationConstants.UAT_TEST_PASSWORD);
        if (authenticateCustomerResult.status !== 'AUTH_OK') {
            error = { authError: true, status: authenticateCustomerResult.status };
            throw error;
        }
        Transaction.wrap(function () {
            CustomerMgr.loginCustomer(authenticateCustomerResult, false);
        });

        if (!customer.registered) {
            res.json({
                success: false,
                error: 'Guest customers cannot be deleted'
            });
            return next();
        }

        Transaction.wrap(function () {
            CustomerMgr.removeCustomer(customer);
        });

        res.json({
            success: true,
            message: 'Customer deleted successfully',
            customerEmail: customerEmail
        });

        return next();

    } catch (e) {
        eswHelper.eswInfoLogger('Error in DeleteCustomer: ' + e.message);

        res.json({
            success: false,
            error: e.message
        });

        return next();
    }
});

/*
 * Function to handle register customer request coming from ESW order confirmation
 */
server.replace('RegisterCustomer', function (req, res, next) {
    let CustomerMgr = require('dw/customer/CustomerMgr');
    let Transaction = require('dw/system/Transaction');
    let OrderMgr = require('dw/order/OrderMgr');
    let orderNumber,
        existerCustomer,
        pwaUrl,
        eswPwaHelper,
        countryCode;
    try {
        orderNumber = session.privacy.confirmedOrderID;
        if (isPwa) {
            eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
            let retailerCartId = request.httpParameters.get('retailerCartId');
            orderNumber = retailerCartId && retailerCartId.length > 0 ? retailerCartId[0] : null;
        }
        if (isPwa) {
            try {
                countryCode = order.getDefaultShipment().getShippingAddress().getCountryCode().getValue();
            } catch (e) {
                eswHelper.eswInfoLogger('ESW Checkout Registration error: {0}', e.message);
            }
            pwaUrl = eswPwaHelper.getPwaShopperUrl(countryCode);
        }
        let params = {},
            registrationObj = {},
            password;
        let order = OrderMgr.getOrder(orderNumber);
        delete session.privacy.keepOrderIDForRegistration;
        if (order && (isPwa || order.customer.ID === req.currentCustomer.raw.ID)) {
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
                if (isPwa) {
                    res.redirect(pwaUrl + '/login?email=' + order.getCustomerEmail());
                    return next();
                }
                res.render('account/eswLoginForm', params);
            } else {
                if (isPwa) {
                    eswPwaHelper.setCustomerCustomObject(order.getCustomerEmail(), orderNumber);
                    let registrationObj = {
                        firstName: order.billingAddress.firstName,
                        lastName: order.billingAddress.lastName,
                        email: order.customerEmail
                    };
                    res.redirect(pwaUrl + '/registration?email=' + order.getCustomerEmail() + '&firstName=' + registrationObj.firstName + '&lastName=' + registrationObj.lastName);
                    return next();
                }
                password = AutomationConstants.UAT_TEST_PASSWORD;
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
                            eswHelper.setPostRegistrationOptins(newCustomerProfile, order);

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
        eswHelper.eswInfoLogger('Error While Creating customers account', error, error.message, error.stack);
    }
    next();
});

/**
 * POST /EShopWorld-SetupCustomerAddresses
 * E2E helper endpoint to setup customer addresses. Removes all existing addresses and creates new ones.
 * Supports multi-country (GB, IE, etc.). Receives { customerEmail, defaultStreetAddress, addresses[] } in POST body.
 */
server.post('SetupCustomerAddresses', function (req, res, next) {
    let Transaction = require('dw/system/Transaction');
    let CustomerMgr = require('dw/customer/CustomerMgr');
    let Logger = require('dw/system/Logger');

    try {
        let reqBody = JSON.parse(req.body);
        let customerEmail = reqBody.customerEmail;
        let defaultStreetAddress = reqBody.defaultStreetAddress || 'Home Street';
        let addresses = reqBody.addresses || [];

        if (!customerEmail) {
            res.json({
                success: false,
                error: 'customerEmail is required'
            });
            return next();
        }

        // Get customer by email
        let customer = CustomerMgr.getCustomerByLogin(customerEmail);
        if (!customer) {
            res.json({
                success: false,
                error: 'Customer not found: ' + customerEmail
            });
            return next();
        }

        let profile = customer.getProfile();
        if (!profile) {
            res.json({
                success: false,
                error: 'Customer profile not found'
            });
            return next();
        }

        Transaction.wrap(function () {
            let addressBook = profile.getAddressBook();

            // Remove all existing addresses
            let existingAddresses = addressBook.getAddresses().toArray();
            for (let i = 0; i < existingAddresses.length; i++) {
                addressBook.removeAddress(existingAddresses[i]);
            }

            // Add new addresses
            for (let j = 0; j < addresses.length; j++) {
                let addrData = addresses[j];
                let newAddress = addressBook.createAddress(addrData.addressId);

                newAddress.setFirstName(addrData.firstName);
                newAddress.setLastName(addrData.lastName);
                newAddress.setAddress1(addrData.address1);
                newAddress.setAddress2(addrData.address2 || '');
                newAddress.setCity(addrData.city);
                newAddress.setStateCode(addrData.stateCode || '');
                newAddress.setPostalCode(addrData.postalCode);
                newAddress.setCountryCode(addrData.countryCode);
                newAddress.setPhone(addrData.phone);

                // Set preferred/default address
                if (addrData.preferred === true || addrData.address1 === defaultStreetAddress) {
                    addressBook.setPreferredAddress(newAddress);
                }
            }
        });

        res.json({
            success: true,
            message: 'Customer addresses setup successfully',
            addressCount: addresses.length,
            customerEmail: customerEmail
        });
        return next();
    } catch (e) {
        Logger.error('Error in SetupCustomerAddresses: ' + e.message);
        res.json({
            success: false,
            error: e.message,
            stack: e.stack
        });
        return next();
    }
});

module.exports = server.exports();
