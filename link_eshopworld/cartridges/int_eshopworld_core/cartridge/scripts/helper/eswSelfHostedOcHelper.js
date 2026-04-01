'use strict';

const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');

const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Constants = require('~/cartridge/scripts/util/Constants');

/**
 * Checks if a given string is a valid URL.
 *
 * @param {string} url - The URL string to validate.
 * @returns {boolean} True if the string is a valid URL, false otherwise.
 */
function isValidUrl(url) {
    return !empty(url) && (url.indexOf('http://') !== -1 || url.indexOf('https://') !== -1);
}

/**
 * Generates the URL for the ESW Self-Hosted Order Confirmation page.
 * @param {string} retailerCartIdFromPreOrder - The retailer cart ID from the pre-order.
 * @param {string} country - (Optional) The shopper country, used in PWA architecture.
 * @returns {string|null} The URL for the ESW Self-Hosted Order Confirmation page or null if not enabled.
 */
function getEswSelfHostedOcUrl(retailerCartIdFromPreOrder, country) {
    if (!eswCoreHelper.isEswSelfHostedOcEnabled()) {
        return null;
    }
    let Site = require('dw/system/Site').getCurrent();
    let siteId = Site.getID();
    let eswSelfHostedOcPageUrl = eswCoreHelper.getEswSelfhostedOcPageUrlPref();
    // PWA only
    if (!empty(country)) {
        let eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
        let pwaSelfHostedCheckoutUrl = eswPwaHelper.getPwaShopperUrl(country) + Constants.SELF_HOSTED_OC_URL_PWA + retailerCartIdFromPreOrder;
        return pwaSelfHostedCheckoutUrl.replace(/([^:]\/)\/+/g, '$1');
    }
    // Fallback to controller-based URL
    let currentSiteArchitecture = Resource.msg('sfcc.cartridge', 'esw', null);
    if (!empty(currentSiteArchitecture) && currentSiteArchitecture === 'HL') {
        eswSelfHostedOcPageUrl = eswCoreHelper.getEswHeadlessSiteUrl();
        if (siteId === Constants.SITE_GENESIS_SITE_ID) {
            eswSelfHostedOcPageUrl += Constants.SELF_HOSTED_OC_URL_SG_HEADLESS;
        } else {
            eswSelfHostedOcPageUrl += Constants.SELF_HOSTED_OC_URL_SFRA_HEADLESS;
        }
    }
    if (eswSelfHostedOcPageUrl) {
        if (isValidUrl(eswSelfHostedOcPageUrl)) {
            // If the preference URL is valid, return it directly
            return eswSelfHostedOcPageUrl + '?orderId=' + encodeURIComponent(retailerCartIdFromPreOrder);
        } else {
            return URLUtils.https(eswSelfHostedOcPageUrl, 'orderId', retailerCartIdFromPreOrder).toString();
        }
    }

    if (currentSiteArchitecture === 'SG') {
        return URLUtils.https(Constants.SELF_HOSTED_OC_URL_SG, 'orderId', retailerCartIdFromPreOrder).toString();
    }
    return URLUtils.https(Constants.SELF_HOSTED_OC_URL_SFRA, 'orderId', retailerCartIdFromPreOrder).toString();
}

/**
 * Constructs the metadata for the ESW Self-Hosted Pre-Order confirmation page.
 * @param {string} retailerCartdFromPreOrder - The retailer cart ID from the pre-order.
 * @param {string} country - (Optional) The shopper country, used in PWA architecture.
 * @returns {Object|null} An object containing metadata name and value, or null if not enabled.
 */
function getEswSelfhostedPreOrderMetadata(retailerCartdFromPreOrder, country) {
    let eswSelfhostedPageUrl = getEswSelfHostedOcUrl(retailerCartdFromPreOrder, country);
    if (!eswCoreHelper.isEswSelfHostedOcEnabled()) {
        return null;
    }
    return {
        metadataName: 'ConfirmationPageUrl',
        metadataValue: eswSelfhostedPageUrl
    };
}

/**
 * Get ESW Order Detail by OrderID
 * @param {string} orderID - Order ID
 * @returns {dw.order.Order|null} - The order object or null if not found
 */
function getEswOrderDetail(orderID) {
    const OrderMgr = require('dw/order/OrderMgr');

    if (!orderID) {
        return null;
    }
    try {
        let embCheckoutHelper;
        let order = OrderMgr.getOrder(orderID);
        if (!order) {
            order = OrderMgr.searchOrder('custom.eswBasketUuid = {0}', orderID);
        }
        if (!order) {
            eswCoreHelper.eswInfoLogger('getEswOrderDetail: No order found for ID: ', orderID);
            try {
                embCheckoutHelper = require('*/cartridge/scripts/helper/eckoutHelper').eswEmbCheckoutHelper;
                let response = embCheckoutHelper.getCustomerOrderCustomObject(orderID);
                order = OrderMgr.getOrder(response.orderNumber, response.orderToken);
                if (order) {
                    return order;
                }
            } catch (error) {
                eswCoreHelper.eswInfoLogger('getEswOrderDetail: Error while retrieving order for ID: ', error);
            }
            return null;
        }
        return order;
    } catch (e) {
        eswCoreHelper.eswInfoLogger('getEswOrderDetail: Error while retrieving order for ID: ', e);
        return null;
    }
}

/**
 * Returns ESW self-hosted OC metadata as an object with Name and Value.
 * @param {Object} selfHostedOcMetadata - The metadata object from eswSelfHostedOcHelper
 * @returns {Object|null} - Object with Name and Value or null if input is empty
 */
function getSelfHostedOcMetadataObject(selfHostedOcMetadata) {
    if (!empty(selfHostedOcMetadata)) {
        return {
            Name: selfHostedOcMetadata.metadataName,
            Value: selfHostedOcMetadata.metadataValue
        };
    }
    return null;
}


module.exports = {
    getEswSelfhostedPreOrderMetadata: getEswSelfhostedPreOrderMetadata,
    getEswOrderDetail: getEswOrderDetail,
    getSelfHostedOcMetadataObject: getSelfHostedOcMetadataObject
};
