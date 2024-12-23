/* eslint-disable no-loop-func */
/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/**
* EShopWorld Controller for Headless Architecture (OCAPI)
*
* @module  controllers/EswHL
*/

'use strict';
const guard = require('*/cartridge/scripts/guard');

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

/**
 * Function to be called from ESW to check Order items inventory in SFCC side.
 */
function validateInventory() {
    let Response = require('*/cartridge/scripts/util/Response');
    let obj = JSON.parse(request.httpParameterMap.requestBodyAsString);
    let responseJSON = eswHelper.getValidateInventoryResponseJson(obj);
    Response.renderJSON(responseJSON);
}
/**
 * Function to handle order confirmation request in V2
 */
function notify() {
    /* eslint-disable no-new-wrappers */
    let Transaction = require('dw/system/Transaction'),
        OrderMgr = require('dw/order/OrderMgr'),
        logger = require('dw/system/Logger'),
        Order = require('dw/order/Order'),
        BasketMgr = require('dw/order/BasketMgr'),
        Response = require('*/cartridge/scripts/util/Response'),
        pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper,
        responseJSON = {};
    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        logger.error('ESW Order Confirmation Error: Basic Authentication Token did not match');
    } else {
        let obj = JSON.parse(request.httpParameterMap.requestBodyAsString);
        responseJSON = {
            OrderNumber: obj.retailerCartId.toString(),
            EShopWorldOrderNumber: obj.eShopWorldOrderNumber.toString(),
            ResponseCode: '200',
            ResponseText: 'Success'
        };

        try {
            eswHelper.eswInfoLogger('Esw Order Confirmation Request', JSON.stringify(obj));
            let ocHelper = require('*/cartridge/scripts/helper/orderConfirmationHelper').getEswOcHelper(),
                shopperCurrency = ('checkoutTotal' in obj) ? obj.checkoutTotal.shopper.currency : obj.shopperCurrencyPaymentAmount.substring(0, 3),
                totalCheckoutAmount = ('checkoutTotal' in obj) ? obj.checkoutTotal.shopper.amount : obj.shopperCurrencyPaymentAmount.substring(3),
                paymentCardBrand = ('paymentDetails' in obj) ? obj.paymentDetails.methodCardBrand : obj.paymentMethodCardBrand,
                basket = BasketMgr.getCurrentOrNewBasket();
            // Set Override Price Books
            try {
                pricingHelper.setOverridePriceBooks(obj.deliveryCountryIso, shopperCurrency, basket, true);
            } catch (e) {
                ocHelper.setOverridePriceBooks(obj.deliveryCountryIso, shopperCurrency);
            }
            Transaction.wrap(function () {
                let order = OrderMgr.getOrder(obj.retailerCartId);
                // If order not found in SFCC
                if (empty(order)) {
                    response.setStatus(400);
                    responseJSON.ResponseCode = '400';
                    responseJSON.ResponseText = (empty(order)) ? 'Order not found' : 'Order Failed';
                    Response.renderJSON(responseJSON);
                    return;
                } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
                    let result = OrderMgr.undoFailOrder(order);
                    if (result.error) {
                        response.setStatus(409);
                        responseJSON.ResponseCode = '409';
                        responseJSON.ResponseText = 'Error: Inventory Reservation Failed';
                        Response.renderJSON(responseJSON);
                        return;
                    }
                }
                // If order already confirmed & processed
                if (order.confirmationStatus.value === Order.CONFIRMATION_STATUS_CONFIRMED) {
                    responseJSON.ResponseText = 'Order already exists';
                    Response.renderJSON(responseJSON);
                    return;
                }
                // If order exist with created status in SFCC then perform order confirmation
                if (order.status.value === Order.ORDER_STATUS_CREATED) {
                    let currentMethodID = order.shipments[0].shippingMethodID;
                    ocHelper.setApplicableShippingMethods(order, obj.deliveryOption.deliveryOption, obj.deliveryCountryIso, null, currentMethodID);
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
                        for (let lineItem in order.productLineItems) {
                            cartItem = ocLineItemObject.filter(function (value) {
                                if (value.product.productCode === order.productLineItems[lineItem].productID && value.lineItemId === order.productLineItems[lineItem].custom.eswLineItemId) {
                                    return value;
                                }
                            });
                            if ('lineItems' in obj) { // OC response v3.0
                                ocHelper.updateEswOrderItemAttributesV3(obj, order.productLineItems[lineItem], cartItem);
                            } else { // OC response v2.0
                                ocHelper.updateEswOrderItemAttributesV2(obj, order.productLineItems[lineItem], cartItem);
                            }
                        }
                        if ('lineItems' in obj) { // OC response v3.0
                            ocHelper.updateOrderLevelAttrV3(obj, order);
                        }
                    }
                    // update ESW order Item custom attributes
                    ocHelper.updateShopperAddressDetails(obj.contactDetails, order);
                    // update ESW Payment instrument custom attributes
                    ocHelper.updateEswPaymentAttributes(order, totalCheckoutAmount, paymentCardBrand);

                    OrderMgr.placeOrder(order);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);

                    if (!empty(obj.shopperCheckoutExperience) && !empty(obj.shopperCheckoutExperience.registeredProfileId)) {
                        ocHelper.saveAddressinAddressBook(obj.contactDetails, obj.shopperCheckoutExperience.registeredProfileId, obj.shopperCheckoutExperience.saveAddressForNextPurchase);
                    }

                    if (eswHelper.isUpdateOrderPaymentStatusToPaidAllowed()) {
                        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    }
                }
            });
        } catch (e) {
            logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
            // In SFCC, SystemError suggest exceptions initiated by system like optimistic lock exception etc.
            if (e.name === 'SystemError') {
                response.setStatus(429);
                responseJSON.ResponseCode = '429';
                responseJSON.ResponseText = 'Transient Error: Too many requests';
            } else { // For other errors like ReferenceError etc.
                response.setStatus(400);
                responseJSON.ResponseCode = '400';
                responseJSON.ResponseText = 'Error: Internal error';
            }
        }
        eswHelper.eswInfoLogger('Esw Order Confirmation Response', JSON.stringify(responseJSON));
    }
    Response.renderJSON(responseJSON);
}

/**
 * Store webhook response
 * @returns {void} - Void
 */
function processWebHooks() {
    let responseJSON = {};
    responseJSON = eswHelper.handleWebHooks(JSON.parse(request.httpParameterMap.requestBodyAsString), request.httpHeaders.get('esw-event-type'));
    Response.renderJSON(responseJSON);
}

/** Handles the order inventory check before order confirmation.
 * @see {@link module:controllers/EShopWorld~ValidateInventory} */
exports.ValidateInventory = guard.ensure(['post', 'https'], validateInventory);

/** Handles the order confirmation request
 * @see {@link module:controllers/EShopWorld~Notify} */
exports.Notify = guard.ensure(['post', 'https'], notify);

/** Process the webhook for Logistic return portal.
 * @see module:controllers/EShopWorld~processWebHooks */
exports.ProcessWebHooks = guard.ensure(['post'], processWebHooks);
