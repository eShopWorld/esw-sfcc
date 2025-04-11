'use strict';

const Site = require('dw/system/Site').getCurrent();
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');

const ocHelper = require('*/cartridge/scripts/helper/orderConfirmationHelper').getEswOcHelper();
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

const eswEmbCheckoutHelper = {
    getEswEmbCheckoutScriptPath: function () {
        return Site.getCustomPreferenceValue('eswCheckoutIframeScriptPath');
    },
    getEswIframeFallbackUrl: function () {
        return null;
    },
    getEswIframeCookieName: function () {
        return Site.getCustomPreferenceValue('eswCheckoutIframeCookieName');
    },
    /**
     * function to get cart item
     * @param {Object} obj - object containing cartItems
     * @param {Object} order - order object
     * @param {Object} lineItem - Product lineitem object
     * @return {Object} - cart item
     */
    getCartItem: function (obj, order, lineItem) {
        let item;
        let cartItem = obj.filter(function (value) {
            if (value.product.productCode === order.productLineItems[lineItem].productID && value.lineItemId === order.productLineItems[lineItem].custom.eswLineItemId) {
                item = value;
            }
            return item;
        });
        return cartItem;
    },
    /**
     * Retrieves the value of the 'eswShopperIpAddress' from the metadataItems array within shopperCheckoutExperience.
     *
     * @param {Object} ocPayloadJson - The JSON object containing shopperCheckoutExperience metadata.
     * @returns {string|null} The value of the 'eswShopperIpAddress' metadata item, or null if not found.
     */
    getShopperIpAddressValue: function (ocPayloadJson) {
        let metadataItems = ocPayloadJson.shopperCheckoutExperience.metadataItems;
        for (let item of metadataItems) {
            if (item.name === 'eswShopperIpAddress' || item.Name === 'eswShopperIpAddress') {
                return item.value;
            }
        }
        return null; // Return null if 'eswShopperIpAddress' is not found
    },
    /**
     * Update order attributes related to embedded checkout order flow only, must be wrapped in a Transaction.
     * @param {dw.order.Order} order - DW order object
     * @param {Object} obj - object containing cartItems
     * @return {void}
     */
    updateEmbeddedCheckoutOrderAttributes: function (order, obj) {
        let logger = require('dw/system/Logger');
        try {
            let fxRate = eswHelper.getESWCurrencyFXRate(obj.checkoutTotal.shopper.currency, obj.deliveryCountryIso);
            if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                order.custom.eswBasketUuid = obj.retailerCartId;
                order.custom.eswShopperIpAddress = this.getShopperIpAddressValue(obj);
                order.custom.eswShopperCurrencyTotalOrderDiscount = eswHelper.getOrderDiscount(order, { currencyCode: obj.checkoutTotal.shopper.currency }).value;
                order.custom.eswFxrate = !empty(fxRate) && fxRate.length > 0 ? fxRate[0].rate : '';
                order.removeRemoteHost();
            }
        } catch (error) {
            logger.error('Error while updating Enhanced Order Attributes: {0}', error.message);
        }
    },
    /**
     * Processes the update of order attributes. Must be wrapped in a Transaction.
     * @param {string} orderId - The ID of the order.
     * @param {Object} obj - The object containing the order attributes.
     * @param {Object} req - The request object.
     * @returns {Object} - The response JSON.
     */
    processUpdateOrderAttributes: function (orderId, obj, req) {
        let order = OrderMgr.getOrder(orderId);
        let responseJSON = {};
        let totalCheckoutAmount = ('checkoutTotal' in obj) ? obj.checkoutTotal.shopper.amount : obj.shopperCurrencyPaymentAmount.substring(3);
        let paymentCardBrand = ('paymentDetails' in obj) ? obj.paymentDetails.methodCardBrand : obj.paymentMethodCardBrand;
        // If order already confirmed & processed
        if (order.confirmationStatus.value === Order.CONFIRMATION_STATUS_CONFIRMED) {
            responseJSON.ResponseText = 'Order already exists';
        }
        // If order not found or Failed in SFCC
        if (empty(order) || order.status.value === Order.ORDER_STATUS_FAILED) {
            response.setStatus(400);
            responseJSON.ResponseCode = '400';
            responseJSON.ResponseText = (empty(order)) ? 'Order not found' : 'Order Failed';
        } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
            OrderMgr.undoFailOrder(order);
        }
        // If order exist with created status in SFCC then perform order confirmation
        if (order.status.value === Order.ORDER_STATUS_CREATED) {
            let currentMethodID = order.shipments[0].shippingMethodID;
            ocHelper.setApplicableShippingMethods(order, obj.deliveryOption.deliveryOption, obj.deliveryCountryIso, req, currentMethodID);
            // update ESW order custom attributes
            if ('checkoutTotal' in obj) { // OC response v3.0
                ocHelper.updateEswOrderAttributesV3(obj, order);
            } else { // OC response v2.0
                ocHelper.updateEswOrderAttributesV2(obj, order);
            }
            // update ESW order Item custom attributes
            let ocLineItemObject = ('lineItems' in obj) ? obj.lineItems : obj.cartItems;
            if (ocLineItemObject != null && ocLineItemObject[0].product.productCode) {
                let cartItem;
                // eslint-disable-next-line no-restricted-syntax, guard-for-in
                for (let lineItem in order.productLineItems) {
                    cartItem = this.getCartItem(ocLineItemObject, order, lineItem);
                    if ('lineItems' in obj) { // OC response v3.0
                        ocHelper.updateEswOrderItemAttributesV3(obj, order.productLineItems[lineItem], cartItem);
                    } else { // OC response v2.0
                        ocHelper.updateEswOrderItemAttributesV2(obj, order.productLineItems[lineItem], cartItem);
                    }
                }
                if ('lineItems' in obj) { // OC response v3.0
                    ocHelper.updateOrderLevelAttrV3(obj, order);
                }
                this.updateEmbeddedCheckoutOrderAttributes(order, obj);
            }
        // update ESW order Item custom attributes
            ocHelper.updateShopperAddressDetails(obj.contactDetails, order);
        // update ESW Payment instrument custom attributes
            ocHelper.updateEswPaymentAttributes(order, totalCheckoutAmount, paymentCardBrand);
            OrderMgr.placeOrder(order);
            if (!empty(obj.shopperCheckoutExperience) && !empty(obj.shopperCheckoutExperience.registeredProfileId)) {
                ocHelper.saveAddressinAddressBook(obj.contactDetails, obj.shopperCheckoutExperience.registeredProfileId, obj.shopperCheckoutExperience.saveAddressForNextPurchase);
            }
        // Add konbini related order information
            let isKonbiniOrder = ocHelper.processKonbiniOrderConfirmation(obj, order, totalCheckoutAmount, paymentCardBrand);
            if (typeof isKonbiniOrder === 'undefined' || !isKonbiniOrder) {
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                order.setExportStatus(Order.EXPORT_STATUS_READY);
                if (eswHelper.isUpdateOrderPaymentStatusToPaidAllowed()) {
                    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                }
            }
        }
        return responseJSON;
    }

};


module.exports.eswEmbCheckoutHelper = eswEmbCheckoutHelper;
