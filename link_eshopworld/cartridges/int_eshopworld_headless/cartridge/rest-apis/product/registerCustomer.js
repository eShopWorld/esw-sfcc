
'use strict';


/* API includes */
const logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');

const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getRegisterCustomer = function () {
    let responseJSON,
        orderNumber,
        existerCustomer,
        pwaUrl;
    let redirect;
    try {
        let CustomerMgr = require('dw/customer/CustomerMgr');
        let retailerCartId = request.httpParameters.get('c_retailerCartId');
        orderNumber = retailerCartId && retailerCartId.length > 0 ? retailerCartId[0] : null
        let order = OrderMgr.getOrder(orderNumber);
        let countryCode = null;
        try {
            countryCode = order.getDefaultShipment().getShippingAddress().getCountryCode().getValue();
        } catch (e) {
            logger.error('ESW Checkout Registration error: {0}', e.message);
        }
        pwaUrl = eswPwaHelper.getPwaShopperUrl(countryCode);
        existerCustomer = CustomerMgr.getCustomerByLogin(order.getCustomerEmail());
        if (existerCustomer && existerCustomer.registered) {
            Transaction.wrap(function () { order.setCustomer(existerCustomer); });
            redirect = pwaUrl + '/login?email=' + order.getCustomerEmail();
            responseJSON = {
                redirectUrl: redirect
            };
        } else {
            eswPwaHelper.setCustomerCustomObject(order.getCustomerEmail(), orderNumber);
            let registrationObj = {
                firstName: order.billingAddress.firstName,
                lastName: order.billingAddress.lastName,
                email: order.customerEmail
            };
            redirect = pwaUrl + '/registration?email=' + order.getCustomerEmail() + '&firstName=' + registrationObj.firstName + '&lastName=' + registrationObj.lastName;
            responseJSON = {
                redirectUrl: redirect
            };
        }
    } catch (e) {
        if (!empty(orderNumber) && !empty(existerCustomer) && existerCustomer.registered) {
            redirect = pwaUrl + '/login';
        } else {
            redirect = pwaUrl + '/registration';
        }
        logger.error('ESW RegisterCustomer Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error',
            errorMessage: e.message,
            redirectUrl: redirect
        };
    }
    RESTResponseMgr
        .createSuccess(responseJSON)
        .render();
};

exports.getRegisterCustomer.public = true;
