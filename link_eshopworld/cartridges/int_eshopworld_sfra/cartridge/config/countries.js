'use strict';
/**
 * The countries.js module is called to override countries.json under config folder to add alternativeCurrencyCodes dynamically.
 * For performance reasons the hook function should be kept short.
 *
 * @module  config/countries
 */

const baseCountries = require('*/cartridge/config/countries.json');
const Site = require('dw/system/Site');

/**
 * get ESW alternate currency code for selected country
 * @param {string} selectedCountry - The ESW selected country
 * @returns {string} alternate currency code
 */
function getAlternateCurrency(selectedCountry) {
    const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    // eslint-disable-next-line no-nested-ternary
    return !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value :
        !empty(request.httpCookies['esw.location']) ? eswHelper.applyDefaultCurrencyForCountry() : eswHelper.getDefaultCurrencyForCountry(selectedCountry);
}

/**
 * get updated countries defined in countries.json with alternate currencies
 * @returns {Object} countries - updated countries
 */
function getUpdatedCountries() {
    if (!Site.current.preferences.custom.eswEshopworldModuleEnabled || empty(baseCountries)) return baseCountries;

    let Locale = require('dw/util/Locale');
    let currentLocale = Locale.getLocale(request.locale);
    let countries = baseCountries;
    let country = countries[0];
    let index = 0;
    for (let i = 0; i < countries.length; i++) {
        if (countries[i].id === currentLocale.ID) {
            country = countries[i];
            index = i;
            break;
        }
    }

    let selectedCountry = request.httpParameterMap.get(Site.current.getCustomPreferenceValue('eswCountryUrlParam'));
    let alternateCurrency = getAlternateCurrency(selectedCountry);
    if (alternateCurrency !== country.currencyCode && (!country.alternativeCurrencyCodes
            || country.alternativeCurrencyCodes.indexOf(alternateCurrency) < 0)) {
        country.alternativeCurrencyCodes = country.alternativeCurrencyCodes || [];
        country.alternativeCurrencyCodes.push(alternateCurrency);
        countries[index] = country;
    }

    return countries;
}

module.exports = getUpdatedCountries();
