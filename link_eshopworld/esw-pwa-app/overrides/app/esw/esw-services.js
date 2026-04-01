'use strict'

import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {app} from '../../../config/default'
import {getCookie} from './esw-helpers'

// Token manager to handle PWA Kit auth token lifecycle
let tokenManager = {
    token: null,
    ready: false,
    callbacks: []
}

/**
 * Initialize token manager with PWA Kit's getTokenWhenReady function
 * This should be called from the App component after PWA Kit initializes
 * @param {Function} getTokenWhenReady - PWA Kit's token retrieval function
 */
export const initializeTokenManager = (getTokenWhenReady) => {
    if (typeof window === 'undefined' || !getTokenWhenReady) return
    
    getTokenWhenReady()
        .then(token => {
            tokenManager.token = token
            tokenManager.ready = true
            // Execute any pending callbacks
            tokenManager.callbacks.forEach(callback => callback(token))
            tokenManager.callbacks = []
        })
        .catch(error => {
            console.error('Error initializing token manager:', error)
            tokenManager.ready = true // Mark as ready even on error to prevent indefinite waiting
        })
}

/**
 * Helper to get bearer token from PWA Kit's auth storage
 * Retrieves the guest or registered user token from commerce-sdk-isomorphic storage
 * @param {string} siteId - site identifier
 * @returns {Promise<string>} - bearer token or empty string
 */
const getTokenFromStorage = async (siteId) => {
    if (typeof window === 'undefined') {
        return ''
    }
    
    // If token manager is initialized and ready, use it
    if (tokenManager.ready && tokenManager.token) {
        return tokenManager.token
    }
    
    // If token manager is initializing, wait for it
    if (!tokenManager.ready) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                // Fallback to localStorage after 2 seconds
                resolve(getTokenFromLocalStorage(siteId))
            }, 2000)
            
            tokenManager.callbacks.push((token) => {
                clearTimeout(timeout)
                resolve(token || '')
            })
        })
    }
    
    // Fallback to localStorage
    return getTokenFromLocalStorage(siteId)
}

/**
 * Fallback method to get token directly from localStorage
 * @param {string} siteId - site identifier
 * @returns {string} - bearer token or empty string
 */
const getTokenFromLocalStorage = (siteId) => {
    try {
        // Priority 1: Check for access_token_{siteId} format (PWA Kit standard)
        const directTokenKey = `access_token_${siteId}`
        const directToken = window.localStorage.getItem(directTokenKey)
        if (directToken) {
            return directToken
        }

        // Priority 2: PWA Kit stores auth in localStorage with key format: `cc-nx-g_{siteId}` (guest)
        const storageKey = `cc-nx-g_${siteId}`
        const authData = window.localStorage.getItem(storageKey)
        
        if (authData) {
            const parsed = JSON.parse(authData)
            // Token structure from commerce-sdk-isomorphic: {access_token, refresh_token, ...}
            return parsed.access_token || parsed.token || ''
        }
        
        // Priority 3: Try registered user token location
        const registeredKey = `cc-nx_${siteId}`
        const registeredData = window.localStorage.getItem(registeredKey)
        if (registeredData) {
            const parsed = JSON.parse(registeredData)
            return parsed.access_token || parsed.token || ''
        }
        
        return ''
    } catch (error) {
        console.error('Error retrieving token from storage:', error)
        return ''
    }
}

const getScapiBaseUrl = (locale) => {
    const proxyBase = '/mobify/proxy/api'
    const organizationId = app?.commerceAPI?.parameters?.organizationId || ''
    const siteId = app?.commerceAPI?.parameters?.siteId || ''
    const shopperLocale = typeof locale === 'string' && locale.length > 0 ? locale : ''
    if (!organizationId || !siteId) {
        console.error('Missing required SCAPI parameters:', {organizationId, siteId})
        throw new Error('Missing required SCAPI parameters')
    }
    // Create absolute URL for fetch to work in both client and server contexts
    const origin = getAppOrigin()
    return {
        scapiBaseUrl: `${origin}${proxyBase}/custom/product/v1/organizations/${organizationId}`,
        siteId: siteId,
        shopperLocale: shopperLocale
    }
}

/**
 * Get BM configs from SCAPI custom endpoint
 * @param {string} locale - shopper country code (e.g., 'IE')
 * @param {string} bearerToken - optional authentication token from PWA Kit auth helper
 * @returns {Promise} - fetch promise
 */
export const getBmConfigs = async (locale, bearerToken = null) => {
    let scapiUrlComponents = getScapiBaseUrl(locale)
    const token = bearerToken || await getTokenFromStorage(scapiUrlComponents.siteId)
    const url = `${scapiUrlComponents.scapiBaseUrl}/getBmConfigs?siteId=${scapiUrlComponents.siteId}&c_country=${scapiUrlComponents.shopperLocale}`
    const headers = {
        'Content-Type': 'application/json',
        ...(token && {'Authorization': `Bearer ${token}`})
    }
    return fetch(url, {method: 'GET', headers})
}

/**
 * Call geo ip alert controller
 * @param {string} locale - shopper country
 * @param {string} bearerToken - optional authentication token from PWA Kit auth helper
 * @returns {Promise} - fetch promise
 */
export const getGeoIpAlert = async (locale, bearerToken = null) => {
    let scapiUrlComponents = getScapiBaseUrl(locale)
    const token = bearerToken || await getTokenFromStorage(scapiUrlComponents.siteId)
    const url = `${scapiUrlComponents.scapiBaseUrl}/getGeoIpAlert?siteId=${scapiUrlComponents.siteId}&c_shopperCountry=${scapiUrlComponents.shopperLocale}`
    const headers = {
        'Content-Type': 'application/json',
        ...(token && {'Authorization': `Bearer ${token}`})
    }
    return fetch(url, {method: 'GET', headers})
}

/**
 * Get Abandonment Cart
 * @param {string} eswClientLastOrderId - order id when user added to cart
 * @param {string} locale - shopper country
 * @param {string} bearerToken - optional authentication token from PWA Kit auth helper
 * @returns {Promise} - fetch promise
 */
export const getAbandonmentCart = async (eswClientLastOrderId, locale, bearerToken = null) => {
    let scapiUrlComponents = getScapiBaseUrl(locale)
    const token = bearerToken || await getTokenFromStorage(scapiUrlComponents.siteId)
    const url = `${scapiUrlComponents.scapiBaseUrl}/getAbandonmentCart?siteId=${scapiUrlComponents.siteId}&c_eswClientLastOrderId=${eswClientLastOrderId}`
    const headers = {
        'Content-Type': 'application/json',
        ...(token && {'Authorization': `Bearer ${token}`})
    }
    return fetch(url, {method: 'GET', headers})
}

/**
 * Get supported countries
 * @param {string} bearerToken - optional authentication token from PWA Kit auth helper
 * @returns {Promise} - fetch promise
 */

export const getSupportedCountries = () => {
    return fetch(
        `${getAppOrigin()}${app.eswConfigs.ocapiProxyPath}${
            app.eswConfigs.siteUri
        }/EShopWorld-SupportedCountries`
    )
}
// export const getSupportedCountries = async (bearerToken = null) => {
//     let shopperTimezone = getCookie('esw.shopperTimezone')
//     let scapiUrlComponents = getScapiBaseUrl('')
//     const token = bearerToken || await getTokenFromStorage(scapiUrlComponents.siteId)
//     const url = `${scapiUrlComponents.scapiBaseUrl}/getSupportedCountries?siteId=${scapiUrlComponents.siteId}&c_eswShopperTimezone=${shopperTimezone}`
//     const headers = {
//         'Content-Type': 'application/json',
//         ...(token && {'Authorization': `Bearer ${token}`})
//     }
//     return fetch(url, {method: 'GET', headers})
// }

/**
 * Get order number from ESW
 * @param {string} orderNumber - orderNumber
 * @param {string} bearerToken - optional authentication token from PWA Kit auth helper
 * @returns {Promise} - fetch promise
 */
export const getOrderNumber = async (orderNumber, bearerToken = null) => {
    typeof orderNumber !== 'undefined' && orderNumber.length > 0 ? orderNumber : null
    let scapiUrlComponents = getScapiBaseUrl('')
    const token = bearerToken || await getTokenFromStorage(scapiUrlComponents.siteId)
    const url = `${scapiUrlComponents.scapiBaseUrl}/getOrderNumber?siteId=${scapiUrlComponents.siteId}&c_orderNumber=${orderNumber}`
    const headers = {
        'Content-Type': 'application/json',
        ...(token && {'Authorization': `Bearer ${token}`})
    }
    return fetch(url, {method: 'GET', headers})
}

export const getIsInventoryAvailable = async (productItems) => {
    const response = await fetch(
        `${getAppOrigin()}${app.eswConfigs.ocapiProxyPath}${
            app.eswConfigs.siteUri
        }/EShopWorld-IsInventoryAvailable`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productItems)
        }
    )

    if (!response.ok) {
        throw new Error(`Failed to fetch inventory availability: ${response.statusText}`)
    }
    const data = await response.json()
    return data // Return the parsed JSON response directly
}
