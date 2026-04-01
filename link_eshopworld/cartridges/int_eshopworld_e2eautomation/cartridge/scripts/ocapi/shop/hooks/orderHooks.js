'use strict';

// API Includes
const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger');

// Script Includes
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.modifyPOSTResponse = function (order, orderResponse) {
    if (!eswHelper.isEswEnabledEmbeddedCheckout()) {
        let checkoutHelper = require('*/cartridge/scripts/helper/eswCheckoutHelperHL'),
            eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper'),
            Constants = require('*/cartridge/scripts/util/Constants'),
            param = request.httpParameters,
            selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters);

        if (!empty(selectedCountryDetail.countryCode) && eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
            let shopperCountry = selectedCountryDetail.countryCode;
            let shopperCurrency = selectedCountryDetail.defaultCurrencyCode;
            if (!empty(shopperCurrency)) {
                // API Includes
                let shopperLocale = !empty(param.locale) ? param.locale[0] : order.customerLocaleID;
                try {
                    let requestBody;
                    let result = checkoutHelper.callEswCheckoutAPI(order, shopperCountry, shopperCurrency, shopperLocale, true);
                    if (!empty(result)) {
                        if ('result' in result && 'reqBody' in result) {
                            requestBody = result.reqBody;
                            result = result.result;
                        }
                        orderResponse.c_eswPreOrderResponseStatus = result.status;
                        var resultObjectJson = !empty(result.object) ? JSON.parse(result.object) : JSON.parse(result.errorMessage);
                        if (resultObjectJson.redirectUrl && !empty(resultObjectJson.redirectUrl)) {
                            let eswEmbeddedCheckoutUrl = (eswPwaHelper.getPwaShopperUrl(shopperCountry) + '/esw-checkout');
                            // Replace double slashes with a single slash
                            eswEmbeddedCheckoutUrl = eswEmbeddedCheckoutUrl.replace(/\/\//g, '/');
                            // Ensure the protocol part is not affected
                            eswEmbeddedCheckoutUrl = eswEmbeddedCheckoutUrl.replace('https:/', 'https://').replace('http:/', 'http://');
                            resultObjectJson.redirectUrl = eswHelper.isEswEnabledEmbeddedCheckout() ?
                            eswEmbeddedCheckoutUrl + '?' + Constants.EMBEDDED_CHECKOUT_QUERY_PARAM + '=' + encodeURIComponent(resultObjectJson.redirectUrl) :
                                    resultObjectJson.redirectUrl;
                        }
                        if ('shopperAccessToken' in JSON.parse(result.object)) {
                            let eswShopperAccessToken = JSON.parse(result.object).shopperAccessToken;
                            orderResponse.c_eswShopperAccessToken = eswShopperAccessToken;
                        }
                        if (!empty(requestBody)) {
                            orderResponse.c_preorderReqPayload = requestBody;
                        }
                        orderResponse.c_eswPreOrderResponse = resultObjectJson;
                    } else {
                        Logger.error('ESW Service Error: No Response found from API.');
                    }
                } catch (e) {
                    Logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
                }
            }
        }
    }

    return new Status(Status.OK);
};
