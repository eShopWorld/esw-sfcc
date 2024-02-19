'use strict'

import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {app} from '../../../config/default'
/**
 * Get BM configs from SFCC
 * @param {string} locale - locale
 * @returns {Promise} - fetch promise
 */
export const getBmConfigs = (locale) => {
    let shopperLocale = typeof locale !== 'undefined' && locale.length > 0 ? locale : null
    return fetch(
        `${getAppOrigin()}${app.eswConfigs.ocapiProxyPath}${
            app.eswConfigs.siteUri
        }/EShopWorld-BmConfigs?locale=${shopperLocale}`
    )
}

/**
 * Call geo ip alert controller
 * @param {string} shopperCountry - shopper country
 * @returns {Promise} - fetch promise
 */
export const getGeoIpAlert = (shopperCountry) => {
    return fetch(
        `${getAppOrigin()}${app.eswConfigs.ocapiProxyPath}${
            app.eswConfigs.siteUri
        }/EShopWorld-GeoIpAlert?shopperCountry=${shopperCountry}`
    )
}

/**
 * Get Abandonment Cart
 * @param {string} eswClientLastOrderId - order id when user added to cart
 * @param {string} locale - shopper country
 * @returns {Promise} - fetch promise
 * @returns {Promise} - fetch promise
 */
export const getAbandonmentCart = (eswClientLastOrderId, locale) => {
    let shopperLocale = typeof locale !== 'undefined' && locale.length > 0 ? locale : null
    return fetch(
        `${getAppOrigin()}${app.eswConfigs.ocapiProxyPath}${
            app.eswConfigs.siteUri
        }/EShopWorld-AbandonmentCart?eswClientLastOrderId=${eswClientLastOrderId}&locale=${shopperLocale}`
    )
}

export const getSupportedCountries = () => {
    return fetch(
        `${getAppOrigin()}${app.eswConfigs.ocapiProxyPath}${
            app.eswConfigs.siteUri
        }/EShopWorld-SupportedCountries`
    )
}
