/* eslint-disable no-useless-escape */

'use strict'

import {getCountry} from './esw-geo-location-helper'
import {getAbandonmentCart, getBmConfigs, getGeoIpAlert} from './esw-services'

const storeBmConfigs = (locale) => {
    getBmConfigs(locale)
        .then((response) => response.json())
        .then((data) => {
            data.eswBmConfigs.updatedAt = new Date()
            localStorage.setItem('esw.configs', JSON.stringify(data.eswBmConfigs))
            localStorage.setItem(
                'esw.shopperPricingConfigs',
                JSON.stringify(data.shopperPricingConfigs)
            )
            if (
                data.eswBmConfigs &&
                Object.prototype.hasOwnProperty.call(data.eswBmConfigs, 'eswNativeShippingEnabled')
            ) {
                localStorage.setItem(
                    'esw.eswNativeShippingEnabled',
                    JSON.stringify(data.eswBmConfigs.eswNativeShippingEnabled)
                )
            }
        })
        .catch((error) => error)
}
/**
 * Get configuration value from esw.config localStorage
 * @param {string} configKey - Configuration json key in esw.configs
 * @returns {string} - Correspondent key from esw.configs localStorage
 */
export const getEswConfigByKey = (configKey) =>
    JSON.parse(localStorage.getItem('esw.configs'))[configKey]

/**
 * Get configuration value from access_token localStorage
 * @param {string} configKey - Configuration json key in esw.configs
 * @returns {string} - Correspondent key from access_token localStorage
 */
export const getEswSiteAccessTokenByKey = (configKey) =>
    localStorage.getItem('access_token_' + configKey)
/**
 * Get shopper currency config from local storage
 * @param {string} configKey - bm config key
 * @returns {Object} - currency config from local storage
 */
export const getEswShopperCurrencyConfigByKey = (configKey) =>
    JSON.parse(localStorage.getItem('esw.shopperPricingConfigs'))[configKey]
/**
 * All ESW functions call on App init
 * @param {string} locale - site locale en-IE etc
 */
export const eswAppInit = (locale) => {
    storeBmConfigs(locale)
}

/**
 * Call geo ip alert controller
 * @param {string} shopperCountry - shopper country
 * @returns {Promise} - fetch promise
 */
export const getGeoIpAlertInfo = (shopperCountry) => {
    return getGeoIpAlert(shopperCountry)
}

/**
 * Call abandonment cart controller
 * @param {string} eswClientLastOrderId - last order id
 * @param {string} locale - shopper country
 * @returns {Promise} - fetch promise
 * @returns {Promise} - fetch promise
 */
export const getAbandonmentCartHelper = (eswClientLastOrderId, locale) => {
    return getAbandonmentCart(eswClientLastOrderId, locale)
}

/**
 * Gett cookie by name after react loaded
 * @param {string} name - cookie name
 * @returns {string} - cookie value
 */
export const getCookie = (name) => {
    const escape = (s) => {
        return s.replace(/([.*+?\^$(){}|\[\]\/\\])/g, '\\$1')
    }
    let match = document.cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'))
    return match ? match[1] : null
}

/**
 * Return country code from locale
 * @param {string} locale - for example en-IE, en-US format
 * @returns {string} - country code
 */
export const getLocaleCountry = (locale) => {
    let localeArr = locale.split('-')
    if (localeArr.length > 1) {
        return localeArr[1]
    }
    return locale
}

export const getShopperCountry = () => {
    return getCountry()
}

/**
 * Check if first visit to the site
 * @returns {boolean} - true if first visit
 */
export const isFirstVisit = () => {
    if (localStorage.getItem('esw.Visited')) {
        return false
    }
    localStorage.setItem('esw.Visited', 1)
    return true
}

/**
 * Get locale by country code
 * @param {string} countryCode - country code
 * @param {Object} siteConfig - site config
 * @returns {string} - locale
 */
export const getLocaleByCountry = (countryCode, siteConfig) => {
    let countryLocale = null
    if (countryCode && countryCode.length > 0) {
        let countrySiteObj = siteConfig.l10n.supportedLocales.filter((locale) => {
            return locale.countryCode === countryCode
        })
        if (countrySiteObj && countrySiteObj.length > 0) {
            countryLocale = countrySiteObj[0].supportedLocales[0]
        }
    }
    return countryLocale
}

/**
 * Get country code by locale
 * @param {string} locale - locale
 * @param {Object} siteConfig - site config
 * @returns {string} - country code
 */
export const getCountryCodeByLocale = (locale, siteConfig) => {
    let countryCode = null
    if (locale && locale.length > 0) {
        let countrySiteObj = siteConfig.l10n.supportedLocales.filter((siteConfigLocale) => {
            return siteConfigLocale.supportedLocales[0] === locale
        })
        if (countrySiteObj && countrySiteObj.length > 0) {
            countryCode = countrySiteObj[0]
        }
    }
    return countryCode
}

/**
 * Add spinner to the HTML
 * @param {string} loadingMsg - Loading message
 * @returns {Object} - spinner dom element
 */
export const generateDomLoader = (loadingMsg) => {
    let spinnerMsg = loadingMsg || getEswConfigByKey('defaultLoaderText')
    if (
        typeof spinnerMsg === 'undefined' ||
        !spinnerMsg ||
        (spinnerMsg && spinnerMsg.length === 0)
    ) {
        spinnerMsg = 'Loading...'
    }
    // Create a new div element for the backdrop
    const backdrop = document.createElement('div')
    backdrop.style.position = 'fixed'
    backdrop.style.top = '0'
    backdrop.style.right = '0'
    backdrop.style.bottom = '0'
    backdrop.style.left = '0'
    backdrop.style.background = 'rgba(0, 0, 0, 1)'
    backdrop.style.display = 'flex'
    backdrop.style.justifyContent = 'center'
    backdrop.style.alignItems = 'center'
    backdrop.style.flexDirection = 'column'
    backdrop.style.zIndex = '9999'

    // Create a new div element for the spinner
    const spinner = document.createElement('div')
    spinner.style.display = 'inline-block'
    spinner.style.width = '80px'
    spinner.style.height = '80px'
    spinner.style.border = '8px solid rgba(0, 0, 0, 0.1)'
    spinner.style.borderRadius = '50%'
    spinner.style.borderTop = '8px solid #3498db'
    spinner.style.animation = 'spin 2s linear infinite'

    // Create a new div element for the message
    const message = document.createElement('div')
    message.style.color = '#fff'
    message.style.marginTop = '20px'
    message.textContent = spinnerMsg

    // Add the spin animation
    const style = document.createElement('style')
    style.innerHTML = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `
    document.head.appendChild(style)

    // Append the spinner and message to the backdrop
    backdrop.appendChild(spinner)
    backdrop.appendChild(message)

    // Append the backdrop to the body
    document.body.appendChild(backdrop)

    // Return the backdrop so it can be removed later
    return backdrop
}

export const removeDomLoader = (spinner) => {
    spinner.parentNode.removeChild(spinner)
}
