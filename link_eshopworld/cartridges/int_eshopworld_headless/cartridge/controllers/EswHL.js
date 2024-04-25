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
const app = require('*/cartridge/scripts/app');
const guard = require('*/cartridge/scripts/guard');

/**
* Returns the converted price
*/
function PriceConversion() {
    // API Includes
    let formatMoney = require('dw/util/StringUtils').formatMoney;

    // Script Includes
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;

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
    app.getView({
        price: formatMoney(new dw.value.Money(convertedPrice, localizeObj.localizeCountryObj.currencyCode))
    }).render('eswPrice');
}
/**
 * Function to be called from ESW to check Order items inventory in SFCC side.
 */
function validateInventory() {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
        obj = JSON.parse(request.httpParameterMap.requestBodyAsString);
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
        Response = require('*/cartridge/scripts/util/Response'),
        eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
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
                paymentCardBrand = ('paymentDetails' in obj) ? obj.paymentDetails.methodCardBrand : obj.paymentMethodCardBrand;
            // Set Override Price Books
            ocHelper.setOverridePriceBooks(obj.deliveryCountryIso, shopperCurrency);

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
                    OrderMgr.undoFailOrder(order);
                }
                // If order already confirmed & processed
                if (order.confirmationStatus.value === Order.CONFIRMATION_STATUS_CONFIRMED) {
                    responseJSON.ResponseText = 'Order already exists';
                    Response.renderJSON(responseJSON);
                    return;
                }
                // If order exist with created status in SFCC then perform order confirmation
                if (order.status.value === Order.ORDER_STATUS_CREATED) {
                    ocHelper.setApplicableShippingMethods(order, obj.deliveryOption.deliveryOption, obj.deliveryCountryIso);
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

                    if (!empty(obj.shopperCheckoutExperience) && !empty(obj.shopperCheckoutExperience.registeredProfileId) && obj.shopperCheckoutExperience.saveAddressForNextPurchase) {
                        ocHelper.saveAddressinAddressBook(obj.contactDetails, obj.shopperCheckoutExperience.registeredProfileId);
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
 * Function to handle order cancellation request coming from ESW CSP
 */
function cancelOrder() {
    let CustomObjectMgr = require('dw/object/CustomObjectMgr'),
        Transaction = require('dw/system/Transaction'),
        OrderMgr = require('dw/order/OrderMgr'),
        Order = require('dw/order/Order'),
        Response = require('*/cartridge/scripts/util/Response'),
        logger = require('dw/system/Logger'),
        responseJSON,
        obj;

    try {
        obj = JSON.parse(request.httpParameterMap.requestBodyAsString);
        // cancel order check
        let order = OrderMgr.getOrder(obj.Request.BrandOrderReference);
        if (order.status.value !== Order.ORDER_STATUS_CANCELLED) {
            Transaction.wrap(function () {
                let co = CustomObjectMgr.getCustomObject('eswCancelledOrders', obj.Request.BrandOrderReference);

                if (co) { // If custom object exist then only update payload
                    co.getCustom().cancelledOrderRequestPayload = JSON.stringify(obj);
                } else { // Create new custom with request payload coming from ESW CSP
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
    Response.renderJSON(responseJSON);
}

/** Exports of the controller
 * @see {@link module:controllers/EswHL~PriceConversion} */
exports.PriceConversion = guard.ensure(['get'], PriceConversion);

/** Handles the order inventory check before order confirmation.
 * @see {@link module:controllers/EShopWorld~ValidateInventory} */
exports.ValidateInventory = guard.ensure(['post', 'https'], validateInventory);

/** Handles the order confirmation request
 * @see {@link module:controllers/EShopWorld~Notify} */
exports.Notify = guard.ensure(['post', 'https'], notify);

/** Handles the order cancellation request coming from ESW CSP
 * @see {@link module:controllers/EswHL~CancelOrder} */
exports.CancelOrder = guard.ensure(['post', 'https'], cancelOrder);
