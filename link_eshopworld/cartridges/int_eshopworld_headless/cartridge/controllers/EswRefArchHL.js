/* eslint-disable no-param-reassign */
'use strict';
const server = require('server');

/* API includes */
const logger = require('dw/system/Logger');
const Order = require('dw/order/Order');

/* Script Modules */
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

/**
 * function to get cart item
 * @param {Object} obj - object containing cartItems
 * @param {Object} order - order object
 * @param {Object} lineItem - Product lineitem object
 * @return {Object} - cart item
 */
function getCartItem(obj, order, lineItem) {
    let item;
    let cartItem = obj.filter(function (value) {
        if (value.product.productCode === order.productLineItems[lineItem].productID && value.lineItemId === order.productLineItems[lineItem].custom.eswLineItemId) {
            item = value;
        }
        return item;
    });
    return cartItem;
}

/*
 * ValidateInventory url will call from ESW to check Order items inventory in SFCC side.
 */
server.post('ValidateInventory', function (req, res, next) {
    let responseJSON = {},
        obj = JSON.parse(req.body);
    let inventoryAvailable = true;
    if (eswHelper.getEnableInventoryCheck()) {
        let OrderMgr = require('dw/order/OrderMgr'),
            ocHelper = require('*/cartridge/scripts/helper/orderConfirmationHelper').getEswOcHelper(),
            order = OrderMgr.getOrder(obj.retailerCartId);
        /* ***********************************************************************************************************************************************/
        /* The following line of code checks order line items inventory availaibility from business manager.                                             */
        /* If want to check inventory availability through third party api call please comment inventoryAvailable at line 275                            */
        /* Update the inventoryAvailable variable with third party inventory api call response.                                                          */
        /* Make sure value of inventoryAvailable variable is of boolean type true/false                                                                  */
        /* To disable the inventory check disable "Enable ESW Inventory Check" custom preference from ESW checkout configuration custom preference group.*/
        /* ***********************************************************************************************************************************************/
        inventoryAvailable = ocHelper.validateEswOrderInventory(order);
    }
    responseJSON.retailerCartId = obj.retailerCartId.toString();
    responseJSON.eShopWorldOrderNumber = obj.eShopWorldOrderNumber.toString();
    responseJSON.inventoryAvailable = inventoryAvailable;
    eswHelper.eswInfoLogger('Esw Inventory Check Response', JSON.stringify(responseJSON));
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
                // If order not found or Failed in SFCC
                if (empty(order) || order.status.value === Order.ORDER_STATUS_FAILED) {
                    response.setStatus(400);
                    responseJSON.ResponseCode = '400';
                    responseJSON.ResponseText = (empty(order)) ? 'Order not found' : 'Order Failed';
                    res.json(responseJSON);
                    return;
                }
                // If order already confirmed & processed
                if (order.confirmationStatus.value === Order.CONFIRMATION_STATUS_CONFIRMED) {
                    responseJSON.ResponseText = 'Order already exists';
                    res.json(responseJSON);
                    return;
                }
                // If order exist with created status in SFCC then perform order confirmation
                if (order.status.value === Order.ORDER_STATUS_CREATED) {
                    ocHelper.setApplicableShippingMethods(order, obj.deliveryOption.deliveryOption, obj.deliveryCountryIso, req);
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
                    ocHelper.updateEswPaymentAttributes(order, totalCheckoutAmount, paymentCardBrand);

                    OrderMgr.placeOrder(order);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                    if (!empty(obj.shopperCheckoutExperience) && !empty(obj.shopperCheckoutExperience.registeredProfileId) && obj.shopperCheckoutExperience.saveAddressForNextPurchase) {
                        ocHelper.saveAddressinAddressBook(obj.contactDetails, obj.shopperCheckoutExperience.registeredProfileId);
                    }
                    if (eswHelper.isUpdateOrderPaymentStatusToPaidAllowed()) {
                        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
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
* Returns the converted price
*/
server.get('PriceConversion', function (req, res, next) {
    // API Includes
    let formatMoney = require('dw/util/StringUtils').formatMoney;

    // Script Includes
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
    let responseJSON;
    try {
        let param = request.httpParameterMap;
        let price = Number(param.price.value);
        let shopperCountry = param.country.stringValue;
        let shopperCurrency = param.currency.stringValue || pricingHelper.getShopperCurrency(shopperCountry);

        let localizeObj = {
            localizeCountryObj: {
                countryCode: shopperCountry,
                currencyCode: shopperCurrency
            },
            applyCountryAdjustments: param.applyAdjust.stringValue || 'true',
            applyRoundingModel: param.applyRounding.stringValue || 'true'
        };

        let convertedPrice = pricingHelper.getConvertedPrice(price, localizeObj);
        responseJSON = {
            price: formatMoney(new dw.value.Money(convertedPrice, localizeObj.localizeCountryObj.currencyCode)),
            ResponseCode: '200',
            ResponseText: 'Price converted successfully'
        };
    } catch (e) {
        logger.error('ESW Plugin Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error'
        };
    }
    res.json(responseJSON);
    next();
});

/*
 * Function to handle order cancellation request coming from ESW CSP
 */
server.post('CancelOrder', function (req, res, next) {
    let CustomObjectMgr = require('dw/object/CustomObjectMgr'),
        OrderMgr = require('dw/order/OrderMgr'),
        Transaction = require('dw/system/Transaction'),
        responseJSON,
        obj;

    try {
        obj = JSON.parse(req.body);
        // cancel order check
        let order = OrderMgr.getOrder(obj.Request.BrandOrderReference);
        if (order.status.value !== Order.ORDER_STATUS_CANCELLED) {
            Transaction.wrap(function () {
                let co = CustomObjectMgr.getCustomObject('eswCancelledOrders', obj.Request.BrandOrderReference);

                if (co) {
                    co.getCustom().cancelledOrderRequestPayload = JSON.stringify(obj);
                } else {
                    co = CustomObjectMgr.createCustomObject('eswCancelledOrders', obj.Request.BrandOrderReference);
                    co.getCustom().cancelledOrderRequestPayload = JSON.stringify(obj);
                }
            });
        }
        responseJSON = {
            OrderNumber: obj.Request.BrandOrderReference,
            ResponseCode: '200',
            ResponseText: 'Order processed successfuly'
        };
    } catch (e) {
        logger.error('ESW Plugin Error: {0}', e.message);
        responseJSON = {
            OrderNumber: obj.Request.BrandOrderReference,
            ResponseCode: '400',
            ResponseText: 'Error: Internal error'
        };
    }
    res.json(responseJSON);
    next();
});

module.exports = server.exports();
