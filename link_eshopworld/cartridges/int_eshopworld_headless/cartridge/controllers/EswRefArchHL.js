/* eslint-disable no-param-reassign */
'use strict';
const server = require('server');

/* API includes */
const logger = require('dw/system/Logger');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
* Returns the converted price
*/
server.get('PriceConversion', function (req, res, next) {
    let responseJSON;
    try {
        let eswCoreApiHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
        responseJSON = {
            price: eswCoreApiHelper.getHeadlessPriceConversion(),
            ResponseCode: '200',
            ResponseText: 'Price converted successfully'
        };
    } catch (e) {
        logger.error('ESW Plugin Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error'
        };
    }
    res.json(responseJSON);
    next();
});

/*
 * Function to handle register customer request coming from ESW order confirmation
 */
server.get('RegisterCustomer', function (req, res, next) {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let CustomerMgr = require('dw/customer/CustomerMgr');
    let Transaction = require('dw/system/Transaction');
    let OrderMgr = require('dw/order/OrderMgr');
    let orderNumber,
        existerCustomer;
    let responseJSON = {};
    try {
        orderNumber = request.httpParameters.get('retailerCartId')[0];
        let registrationObj = {},
            password;
        let order = OrderMgr.getOrder(orderNumber);
        if (order) {
            existerCustomer = CustomerMgr.getCustomerByLogin(order.getCustomerEmail());
            if (existerCustomer && existerCustomer.registered) {
                responseJSON.ResponseCode = '200';
                responseJSON.ResponseText = 'Customer already registered with Email';
                res.json(responseJSON);
                return next();
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

                            // update marketing optin values on customer profile
                            eswHelper.setPostRegistrationOptins(newCustomerProfile, order);

                            // save all used shipping addresses to address book of the logged in customer
                            let allAddresses = addressHelpers.gatherShippingAddresses(order);
                            allAddresses.forEach(function (address) {
                                addressHelpers.saveAddress(address, { raw: newCustomer }, addressHelpers.generateAddressName(address));
                            });
                            res.setViewData({ newCustomer: newCustomer });
                            res.setViewData({ order: order });
                        }
                    });

                    eswHelper.sendRegisterCustomerEmail(authenticatedCustomer, password);

                    responseJSON.ResponseCode = '200';
                    responseJSON.ResponseText = 'Account created Successfully';
                    responseJSON.customerNo = authenticatedCustomer.profile.customerNo;
                    res.json(responseJSON);
                });
            }
        } else {
            responseJSON.ResponseCode = '400';
            responseJSON.ResponseText = 'Something went wrong please try later.';
            res.json(responseJSON);
            return next();
        }
    } catch (error) {
        responseJSON.ResponseCode = '400';
        responseJSON.ResponseText = 'Something went wrong please try later.';
        res.json(responseJSON);
        eswHelper.eswInfoLogger('Error While Creating customers account', error);
        return next();
    }
});

/**
 * Rebuilds the basket from the last ESW client order ID
 */
server.post('RebuildBasketFromOrder', function (req, res, next) {
    let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
    let eswClientLastOrderId = req.querystring.eswClientLastOrderId;
    let response = eswHelperHL.generateBasketFromOrder(eswClientLastOrderId);
    res.json(response);
    return next();
});

/**
 * @endpoint EswRefArchHL-OrderConfirm
 * @description Displays Sefl Hosted ESW order confirmation page based on orderId
 */
server.get('OrderConfirm', csrfProtection.generateToken, function (req, res, next) {
    const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let selfHostedOcHelper = require('*/cartridge/scripts/helper/eswSelfHostedOcHelper');
    let orderId = req.querystring.orderId;
    let Resource = require('dw/web/Resource');

    if (!eswHelper.isCheckoutRegisterationEnabled() && !empty(session.privacy.confirmedOrderID)) {
        delete session.privacy.confirmedOrderID;
    } else {
        session.privacy.keepOrderIDForRegistration = true;
    }

    if (!orderId) {
        res.setStatusCode(400);
        let responseJSON = {
            ResponseCode: '400',
            ResponseText: Resource.msg('error.confirmation.error', 'confirmation', null)
        };
        res.json(responseJSON);
        return next();
    }

    let order = selfHostedOcHelper.getEswOrderDetail(orderId);

    if (!order) {
        res.setStatusCode(404);
        let responseJSON = {
            ResponseCode: '400',
            ResponseText: Resource.msg('error.confirmation.error', 'confirmation', null)
        };
        res.json(responseJSON);
        return next();
    }
    session.privacy.confirmedOrderID = order.currentOrderNo;
    let eswSelfHostedOcPageUrl = eswHelper.getEswHeadlessSiteUrl() + eswHelper.getEswSelfhostedOcPageUrlPref() + '?orderId=' + order.currentOrderNo;
    res.redirect(eswSelfHostedOcPageUrl);

    return next();
});

module.exports = server.exports();