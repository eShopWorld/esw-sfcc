'use strict';

/**
 * @namespace Page
 */

const server = require('server');
server.extend(module.superModule);

/**
 * Page-SetLocale : This end point is used to change the locale, language and currency of the site
 * @name esw/Page-SetLocale
 * @function
 * @memberof Page
 * @param {querystringparameter} - action - the end point that it should load after changing the locale
 * @param {querystringparameter} - code - the locale code to switch to
 * @param {querystringparameter} - currencyCode - the currency code to be assigned to the site
 * @param {querystringparameter} - queryString - the query string of the current request so that it be reloaded in the new locale (eg pdp)
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.append(
    'SetLocale',
    function (req, res, next) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        let URLUtils = require('dw/web/URLUtils');
        let session = req.session.raw;
        let QueryString = server.querystring;
        let queryStringObj = new QueryString(req.querystring.queryString || '');
        let currentLocale = request.getLocale();

        if (eswHelper.getEShopWorldModuleEnabled()) {
            let currencyCode = req.querystring.currency || null;
            let selectedCountry = req.querystring.country || null;
            let language = req.querystring.language || null;

            if (eswHelper.checkIsEswAllowedCountry(selectedCountry)) {
                if (req.setLocale(language)) {
                    if (!eswHelper.overridePrice(req, selectedCountry, currencyCode)) {
                        eswHelper.setAllAvailablePriceBooks();
                        eswHelper.setBaseCurrencyPriceBook(req, eswHelper.getBaseCurrencyPreference());
                    }
                }
                eswHelper.selectCountry(selectedCountry, currencyCode, language);
            } else {
                delete session.privacy.fxRate;
                let selectedCountryDetail = eswHelper.getSelectedCountryDetail(selectedCountry);
                let foundCountry;
                if (!empty(selectedCountryDetail.name)) {
                    eswHelper.createCookie('esw.location', selectedCountry, '/');
                    // Set cookies
                    eswHelper.createCookie('esw.currency', selectedCountryDetail.defaultCurrencyCode, '/');
                    eswHelper.createCookie('esw.LanguageIsoCode', language, '/');

                    // Set Base currency Pricebook
                    eswHelper.setAllAvailablePriceBooks();
                    eswHelper.setBaseCurrencyPriceBook(req, selectedCountryDetail.defaultCurrencyCode);

                    // Set locale
                    req.setLocale(language);
                    foundCountry = true;
                }
                // Set Default Currency and Locale if esw not allowed country not found
                eswHelper.setDefaultCurrencyLocal(req, foundCountry);
            }

            if (Object.hasOwnProperty.call(queryStringObj, 'lang')) {
                delete queryStringObj.lang;
            }

            let redirectUrl = URLUtils.url(req.querystring.action).toString();

            if (Object.hasOwnProperty.call(request, 'httpReferer') && !empty(request.httpReferer) &&
                !eswHelper.isEnableLandingPageRedirect()) {
                let newLocale = request.httpLocale;
                let httpReferer = request.getHttpReferer();
                let qsConnectStr = httpReferer.indexOf('?') >= 0 ? '&' : '?';
                if (httpReferer.indexOf('lang') === -1) {
                    httpReferer += qsConnectStr + 'lang=' + currentLocale || language || newLocale;
                }
                redirectUrl = httpReferer;
                if (!empty(currentLocale) && (!empty(newLocale) || !empty(language))) {
                    redirectUrl = httpReferer.replace(currentLocale, language || newLocale);
                }
            } else {
                let qsConnector = redirectUrl.indexOf('?') >= 0 ? '&' : '?';
                redirectUrl = Object.keys(queryStringObj).length === 0
                    ? redirectUrl += queryStringObj.toString()
                    : redirectUrl += qsConnector + queryStringObj.toString();
            }
            res.json({
                success: true,
                redirectUrl: redirectUrl
            });
        }
        next();
    }
);

module.exports = server.exports();
