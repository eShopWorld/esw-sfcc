'use strict';

const server = require('server');

const logger = require('dw/system/Logger');
const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');

const eswCoreBmHelper = require('*/cartridge/scripts/helper/eswBmHelper');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const Currency = require('dw/util/Currency');

server.get('BmConfigs', function (req, res, next) {
    let configFields = eswCoreBmHelper.loadGroups(
        Site.getCurrent().getPreferences(),
        URLUtils.url('ViewApplication-BM'),
        '#/?preference#site_preference_group_attributes!id!{0}',
        'ESW General Configuration'
    ).attributes;
    let filteredFields = {};
    // Add allowed fields in this array
    let allwedResponseFields = ['eswEshopworldModuleEnabled'];
    for (let i = 0; i < configFields.length; i++) {
        let configFieldId = configFields[i].id;
        if (allwedResponseFields.indexOf(configFieldId) !== -1) {
            filteredFields[configFieldId] = configFields[i].currentValue;
        }
    }
    filteredFields.defaultLoaderText = Resource.msg('message.default.esw.loading', 'esw', null);
    let selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters);
    let selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
    eswHelper.setLocation(selectedCountryDetail.countryCode);
    eswHelper.createCookie('esw.location', selectedCountryDetail.countryCode, '/');
    eswHelper.createCookie('esw.currency', selectedCountryDetail.defaultCurrencyCode, '/');
    res.json({
        eswBmConfigs: filteredFields,
        shopperPricingConfigs: {
            code: selectedCountryDetail.defaultCurrencyCode,
            symbol: Currency.getCurrency(selectedCountryDetail.defaultCurrencyCode).symbol,
            isFixedPriceModel: selectedCountryDetail.isFixedPriceModel,
            fxRate: !empty(selectedCountryLocalizeObj.selectedFxRate) ? selectedCountryLocalizeObj.selectedFxRate.rate : null,
            roundingModel: selectedCountryLocalizeObj.selectedRoundingRule,
            countryAdjustments: selectedCountryLocalizeObj.selectedCountryAdjustments
        }
    });
    next();
});

server.get('SupportedCountries', function (req, res, next) {
    let shopperTimezone = !empty(request.httpCookies) && !empty(request.httpCookies['esw.shopperTimezone']) ? request.httpCookies['esw.shopperTimezone'].value : null;
    let tzCountry = eswPwaHelper.getCountryByTimeZone(shopperTimezone);
    res.json({
        allowedCountries: eswPwaHelper.getPwaSitesData(tzCountry)
    });
    next();
});

server.get('GeoIpAlert', function (req, res, next) {
    let shopperCountry = request.httpParameters.get('shopperCountry');
    let geoIpInfo = eswHelper.isSameGeoIpCountry((shopperCountry && shopperCountry.length > 0 ? shopperCountry[0] : null));
    res.json({ geoIpInfo: geoIpInfo });
    next();
});

/**
 * Get AbandonmentCart, this controller also used to update cart and releted country on PWA
 * That is why require basketId in response everytime and should not be null
 */
server.get('AbandonmentCart', function (req, res, next) {
    let eswClientLastOrderId = req.querystring.eswClientLastOrderId;
    let orderItems = { products: [] };
    let coupons = [];
    // eslint-disable-next-line eqeqeq
    if (!empty(eswClientLastOrderId) && eswClientLastOrderId != 'null') {
        let order = OrderMgr.searchOrder('orderNo={0} AND (status={1} OR status={2})',
            eswClientLastOrderId, dw.order.Order.ORDER_STATUS_FAILED, dw.order.Order.ORDER_STATUS_CREATED);
        if (order && !empty(order)) {
            eswHelper.rebuildCartUponBackFromESW(order.getOrderNo());
            if (order.status.value === dw.order.Order.ORDER_STATUS_CREATED) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, true);
                });
            }
            let allLineItems = order.getAllLineItems().iterator();
            while (allLineItems.hasNext()) {
                let currentLineItem = allLineItems.next();
                if (currentLineItem instanceof dw.order.ProductLineItem) {
                    orderItems.products.push({
                        productId: currentLineItem.getProductID(),
                        price: currentLineItem.getPriceValue(),
                        quantity: currentLineItem.getQuantityValue()
                    });
                }
            }
            coupons = eswPwaHelper.getRetailerPromoCodes(order);
        }
    }
    let customerBasket = BasketMgr.getCurrentOrNewBasket();
    let currentBasketId = customerBasket.getUUID();
    res.json({
        orderLineItems: orderItems,
        basketId: currentBasketId,
        couponCodes: coupons
    });
    next();
});

/**
 * Test controller to get ESW content, this can be removed
 */
server.get('GetEswTestContent', function (req, res, next) {
    let ContentMgr = require('dw/content/ContentMgr');
    let contentBody = {};
    let content = ContentMgr.getContent('esw-test-content');
    if (content) {
        contentBody.body = content.custom ? content.custom.body.markup : '';
    }
    res.json(contentBody);
    next();
});

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
        if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + eswHelper.encodeBasicAuth())) {
            response.setStatus(401);
            logger.error('ESW Inventory Check Error: Basic Authentication Token did not match');
        } else {
            let ocHelper = require('*/cartridge/scripts/helper/orderConfirmationHelper').getEswOcHelper(),
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
    let responseJSON = {};

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
                    OrderMgr.undoFailOrder(order);
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

/*
 * Function to handle register customer request coming from ESW order confirmation
 */
server.get('RegisterCustomer', function (req, res, next) {
    let CustomerMgr = require('dw/customer/CustomerMgr');
    let retailerCartId = request.httpParameters.get('retailerCartId'),
        orderNumber = retailerCartId && retailerCartId.length > 0 ? retailerCartId[0] : null;
    let order = OrderMgr.getOrder(orderNumber);
    let countryCode = null;
    try {
        countryCode = order.getDefaultShipment().getShippingAddress().getCountryCode().getValue();
    } catch (e) {
        logger.error('ESW Checkout Registration error: {0}', e.message);
    }
    let pwaUrl = eswPwaHelper.getPwaShopperUrl(countryCode);
    let existerCustomer = CustomerMgr.getCustomerByLogin(order.getCustomerEmail());
    if (existerCustomer && existerCustomer.registered) {
        Transaction.wrap(function () { order.setCustomer(existerCustomer); });
        res.redirect(pwaUrl + '/login?email=' + order.getCustomerEmail());
    } else {
        eswPwaHelper.setCustomerCustomObject(order.getCustomerEmail(), orderNumber);
        let registrationObj = {
            firstName: order.billingAddress.firstName,
            lastName: order.billingAddress.lastName,
            email: order.customerEmail
        };
        res.redirect(pwaUrl + '/registration?email=' + order.getCustomerEmail() + '&firstName=' + registrationObj.firstName + '&lastName=' + registrationObj.lastName);
    }
    next();
});

/**
 * Process web hook for ESW return portal
 */
server.post('ProcessWebHooks', function (req, res, next) {
    let responseJSON = {};
    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        logger.error('ESW Process Webhooks Check Error: Basic Authentication Token did not match');
    } else {
        let obj = JSON.parse(req.body);
        eswHelper.eswInfoLogger('ProcessWebhook Log', JSON.stringify(obj));
        responseJSON = eswHelper.handleWebHooks(obj, request.httpHeaders.get('esw-event-type'));
    }
    res.json(responseJSON);
    next();
});

module.exports = server.exports();
