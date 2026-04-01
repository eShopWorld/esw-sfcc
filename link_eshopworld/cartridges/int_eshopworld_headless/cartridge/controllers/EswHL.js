/* eslint-disable no-loop-func */
/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/**
* EShopWorld Controller for Headless Architecture (OCAPI)
*
* @module  controllers/EswHL
*/

'use strict';
const app = require('*/cartridge/scripts/app');
const guard = require('*/cartridge/scripts/guard');

/**
* Returns the converted price
*/
function PriceConversion() {
    const logger = require('dw/system/Logger');
    const Response = require('*/cartridge/scripts/util/Response');
    let responseJSON;
    try {
        let eswCoreApiHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
        app.getView({
            price: eswCoreApiHelper.getHeadlessPriceConversion()
        }).render('eswPrice');
        return;
    } catch (e) {
        logger.error('ESW Plugin Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error'
        };
    }
    Response.renderJSON(responseJSON);
    return;
}

/**
* register Customer
*/
function registerCustomer() {
    const Response = require('*/cartridge/scripts/util/Response');
    let OrderMgr = require('dw/order/OrderMgr'),
        CustomerMgr = require('dw/customer/CustomerMgr'),
        Transaction = require('dw/system/Transaction'),
        eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
        orderNumber = request.httpParameterMap.retailerCartId.stringValue,
        responseJSON = {};

    try {
        let order = OrderMgr.getOrder(orderNumber);
        if (order) {
            let existingCustomer = CustomerMgr.getCustomerByLogin(order.getCustomerEmail());
            if (existingCustomer && existingCustomer.registered) {
                responseJSON.ResponseCode = '200';
                responseJSON.ResponseText = 'Customer already registered with Email';
                response.setContentType('application/json');
                Response.renderJSON(responseJSON);
                return;
            }

            let password = eswHelper.generateRandomPassword();
            let registrationObj = {
                firstName: order.billingAddress.firstName,
                lastName: order.billingAddress.lastName,
                phone: order.billingAddress.phone,
                email: order.customerEmail,
                password: password
            };

            let newCustomer,
                authenticatedCustomer;

            Transaction.wrap(function () {
                newCustomer = CustomerMgr.createCustomer(registrationObj.email, registrationObj.password);

                let authResult = CustomerMgr.authenticateCustomer(registrationObj.email, registrationObj.password);
                if (authResult && !authResult.authenticated) {
                    throw new Error('Authentication failed with status: ' + authResult.status);
                }

                authenticatedCustomer = CustomerMgr.loginCustomer(authResult, false);
                if (!authenticatedCustomer) {
                    throw new Error('Login failed for customer');
                }

                let profile = newCustomer.getProfile();
                profile.firstName = registrationObj.firstName;
                profile.lastName = registrationObj.lastName;
                profile.phoneHome = registrationObj.phone;
                profile.email = registrationObj.email;

                order.setCustomer(newCustomer);
                // update marketing optin values on customer profile
                eswHelper.setPostRegistrationOptins(profile, order);
            });

            eswHelper.sendRegisterCustomerEmail(authenticatedCustomer, password);

            responseJSON.ResponseCode = '200';
            responseJSON.ResponseText = 'Account created Successfully';
            responseJSON.customerNo = authenticatedCustomer.profile.customerNo;
        } else {
            responseJSON.ResponseCode = '400';
            responseJSON.ResponseText = 'Order not found';
        }
    } catch (e) {
        responseJSON.ResponseCode = '400';
        responseJSON.ResponseText = 'Something went wrong, please try later.';
        eswHelper.eswInfoLogger('Error While Creating customers account', e);
    }

    Response.renderJSON(responseJSON);
}

exports.RegisterCustomer = guard.ensure(['get'], registerCustomer);

 /** Function to be called to render Self Hosted Order Confirmation page
 */
function showConfirmation() {
    const Response = require('*/cartridge/scripts/util/Response');
    const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    const selfHostedOcHelper = require('*/cartridge/scripts/helper/eswSelfHostedOcHelper');
    let orderId = request.httpParameterMap.orderId.stringValue;
    let Resource = require('dw/web/Resource');
    let order = orderId ? selfHostedOcHelper.getEswOrderDetail(orderId) : null;

    if (!order) {
        Response.renderJSON({
            ResponseCode: '400',
            ResponseText: Resource.msg('error.confirmation.error', 'esw', null)
        });
        response.setStatus(404);
        return;
    }
    let eswSelfHostedOcPageUrl = eswHelper.getEswHeadlessSiteUrl() + eswHelper.getEswSelfhostedOcPageUrlPref() + '?orderId=' + order.currentOrderNo;
    response.redirect(eswSelfHostedOcPageUrl);
    return;
}

/** Exports of the controller
 * @see {@link module:controllers/EswHL~PriceConversion} */
exports.PriceConversion = guard.ensure(['get'], PriceConversion);

/** Handles Self Hosted Order Confirmation request
 * @see module:controllers/EShopWorldSG~OrderConfirm */
exports.OrderConfirm = guard.ensure(['get'], showConfirmation);
