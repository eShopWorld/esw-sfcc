'use strict';

/**
 * @namespace Checkout
 */

const server = require('server');
server.extend(module.superModule);

const URLUtils = require('dw/web/URLUtils');

/**
 * Main entry point for Checkout
 */

/**
 * Checkout-Begin : The Checkout-Begin endpoint will render the checkout shipping page for both guest shopper and returning shopper
 * @name ESW/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {querystringparameter} - stage - a flag indicates the checkout stage
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend(
    'Begin',
    function (req, res, next) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        let session = req.session.raw;
        if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) {
            let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
            if (session.privacy.orderNo && !empty(session.privacy.orderNo)) {
                eswServiceHelper.failOrder();
            }
            let BasketMgr = require('dw/order/BasketMgr'),
                currentBasket = BasketMgr.getCurrentBasket();

            if (currentBasket) {
                let viewData = res.getViewData(),
                    Transaction = require('dw/system/Transaction'),
                    basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
                // Set override shipping methods if configured
                Transaction.wrap(function () {
                    if (eswHelper.getShippingServiceType(currentBasket) === 'POST') {
                        eswServiceHelper.applyShippingMethod(currentBasket, 'POST', eswHelper.getAvailableCountry(), true);
                    } else {
                        eswServiceHelper.applyShippingMethod(currentBasket, 'EXP2', eswHelper.getAvailableCountry(), true);
                    }
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });
                res.setViewData(viewData);
            }
        }
        return next();
    }
);

server.append(
    'Begin',
    function (req, res, next) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) {
            let BasketMgr = require('dw/order/BasketMgr'),
                currentBasket = BasketMgr.getCurrentBasket();

            if (currentBasket) {
                let viewData = res.getViewData();
                viewData.currentStage = 'customer';
                res.setViewData(viewData);
            }
        }
        return next();
    }
);

/**
 * Checkout-GetAllowedCountry : The Checkout-GetAllowedCountry endpoint will provides allowed country json
 * @name esw/Checkout-GetAllowedCountry
 * @function
 * @memberof Checkout
 * @param {middleware} - server.middleware.https
 * @param {renders} - json
 * @param {serverfunction} - get
 */
server.get(
    'GetAllowedCountry',
    server.middleware.https,
    function (req, res, next) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        let Resource = require('dw/web/Resource');
        let language = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllowedLanguages()[0].value;
        let currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getDefaultCurrencyForCountry(eswHelper.getAvailableCountry());
        let selectedCountry = req.querystring.country;
        let flag = false;

        if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.checkIsEswAllowedCountry(selectedCountry)) {
            flag = true;
        }
        res.json({
            success: flag,
            country: selectedCountry,
            language: language,
            currency: currency,
            redirect: URLUtils.https('Cart-Show').toString(),
            url: URLUtils.https('Page-SetLocale').toString(),
            successMsg: Resource.msg('shipping.esw.country.change.msg', 'esw', null)
        });
        next();
    }
);

module.exports = server.exports();
