'use strict';

/**
 * @namespace Checkout
 */

const server = require('server');
server.extend(module.superModule);

/**
 * Handle Ajax guest customer form submit.
 */
server.append(
    'SubmitCustomer',
    function (req, res, next) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        let viewData = res.getViewData();
        if (!viewData.error && eswHelper.getEShopWorldModuleEnabled() && eswHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) {
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                session.privacy.guestCheckout = true;
                let preOrderrequestHelper = require('*/cartridge/scripts/helper/preOrderRequestHelper');
                let redirectURL = preOrderrequestHelper.preOrderRequest(req, res);
                viewData.redirectUrl = redirectURL;
                res.setViewData(viewData);
            });
        }
        return next();
    }
);

/**
 * Handle Ajax registered customer form submit.
 */
server.append(
    'LoginCustomer',
    function (req, res, next) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        let viewData = res.getViewData();
        if (!viewData.error && eswHelper.getEShopWorldModuleEnabled() && eswHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) {
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                let preOrderrequestHelper = require('*/cartridge/scripts/helper/preOrderRequestHelper');
                let redirectURL = preOrderrequestHelper.preOrderRequest(req, res);
                viewData.redirectUrl = redirectURL;
                res.setViewData(viewData);
            });
        }
        return next();
    }
);

module.exports = server.exports();
