/* eslint-disable no-param-reassign */
/* eslint-disable block-scoped-var */
'use strict';
const server = require('server');

/* API includes */
const logger = require('dw/system/Logger');
const Order = require('dw/order/Order');

/* Script Modules */
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswControllerHelper = require('*/cartridge/scripts/helper/eswControllersHelper');

/**
 * function to get cart item
 * @param {Object} obj - object containing cartItems
 * @param {Object} order - order object
 * @param {Object} lineItem - Product lineitem object
 * @return {Object} - cart item
 */
function getCartItem(obj, order, lineItem) {
    return eswControllerHelper.getCartItem(obj, order, lineItem);
}

/*
 * ValidateInventory url will call from ESW to check Order items inventory in SFCC side.
 */
server.post('ValidateInventory', function (req, res, next) {
    let obj = JSON.parse(req.body);
    let responseJSON = eswHelper.getValidateInventoryResponseJson(obj);
    res.json(responseJSON);
    next();
});

/*
 * Notify url will call from ESW to udpate Order configuration in SFCC side.
 */
server.post('Notify', function (req, res, next) {
    let Transaction = require('dw/system/Transaction'),
        OrderMgr = require('dw/order/OrderMgr'),
        responseJSON = {};

    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        logger.error('ESW Order Confirmation Error: Basic Authentication Token did not match');
    } else {
        let obj = JSON.parse(req.body);
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
                paymentCardBrand = ('paymentDetails' in obj) ? obj.paymentDetails.methodCardBrand : obj.paymentMethodCardBrand;
            // Set Override Price Books
            ocHelper.setOverridePriceBooks(obj.deliveryCountryIso, shopperCurrency, req);

            Transaction.wrap(function () {
                let order = OrderMgr.getOrder(obj.retailerCartId);
                // If order not found in SFCC
                if (empty(order)) {
                    response.setStatus(400);
                    responseJSON.ResponseCode = '400';
                    responseJSON.ResponseText = (empty(order)) ? 'Order not found' : 'Order Failed';
                    res.json(responseJSON);
                    return;
                } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
                    let result = OrderMgr.undoFailOrder(order);
                    if (result.error) {
                        response.setStatus(409);
                        responseJSON.ResponseCode = '409';
                        responseJSON.ResponseText = 'Error: Inventory Reservation Failed';
                        res.json(responseJSON);
                        return;
                    }
                }
                // If order already confirmed & processed
                if (order.confirmationStatus.value === Order.CONFIRMATION_STATUS_CONFIRMED) {
                    responseJSON.ResponseText = 'Order already exists';
                    res.json(responseJSON);
                    return;
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
                            cartItem = getCartItem(ocLineItemObject, order, lineItem);
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
                    ocHelper.updateEswPaymentAttributes(order, totalCheckoutAmount, paymentCardBrand, obj);

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
            });
        } catch (e) {
            logger.error('ESW Service Error: {0}', e.message);
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
    res.json(responseJSON);
    next();
});

/**
 * Process web hook for ESW return portal
 */
server.post('ProcessWebHooks', function (req, res, next) {
    let responseJSON = {};
    responseJSON = eswHelper.handleWebHooks(JSON.parse(req.body), request.httpHeaders.get('esw-event-type'));
    res.json(responseJSON);
    next();
});

/**
 * Process web hook for ESW return portal
 */
server.post('ProcessExternalOrder', function (req, res, next) {
    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        logger.error('ESW Order export Error: Basic Authentication Token did not match');
        res.json({
            success: false
        });
    } else {
        let obj = JSON.parse(req.body),
            responseJSON,
            eswOrderImportHelper = require('*/cartridge/scripts/helper/eswOrderImportHelper');
        if (obj) {
            responseJSON = eswOrderImportHelper.handleOrderRequest(obj, req);
        }
        res.json(responseJSON);
    }
    next();
});

module.exports = server.exports();
