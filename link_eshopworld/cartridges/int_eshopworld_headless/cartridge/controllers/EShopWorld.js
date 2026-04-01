'use strict';

const server = require('server');
server.extend(module.superModule);

const logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');

server.get('SupportedCountries', function (req, res, next) {
    let shopperTimezone = !empty(request.httpCookies) && !empty(request.httpCookies['esw.shopperTimezone']) ? request.httpCookies['esw.shopperTimezone'].value : null;
    let tzCountry = eswPwaHelper.getCountryByTimeZone(shopperTimezone);
    res.json({
        allowedCountries: eswPwaHelper.getPwaSitesData(tzCountry)
    });
    next();
});

/**
 * Get AbandonmentCart, this controller also used to update cart and releted country on PWA
 * That is why require basketId in response everytime and should not be null
 */
server.get('AbandonmentCart', function (req, res, next) {
    let eswClientLastOrderId = req.querystring.eswClientLastOrderId;
    let orderItems = { products: [] };
    let basketItems = { products: [] };
    let coupons = [];
    let order = null;
    // eslint-disable-next-line eqeqeq
    if (!empty(eswClientLastOrderId) && eswClientLastOrderId != 'null') {
        order = OrderMgr.getOrder(eswClientLastOrderId);
        if (order && !empty(order) && (order.status.value === dw.order.Order.ORDER_STATUS_FAILED
        || order.status.value === dw.order.Order.ORDER_STATUS_CREATED
        || order.status.value === dw.order.Order.ORDER_STATUS_NEW)) {
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
            while (allLineItems.hasNext()) {
                let currentLineItem = allLineItems.next();
                if (currentLineItem instanceof dw.order.ProductLineItem) {
                    basketItems.products.push({
                        productId: currentLineItem.getProductID(),
                        lineItemId: currentLineItem.getUUID()
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
        couponCodes: coupons,
        removeLineItems: !empty(order) ? (
            order.status.value === dw.order.Order.ORDER_STATUS_NEW
            || order.status.value === dw.order.Order.ORDER_STATUS_OPEN
        ) : false,
        basketItems: basketItems
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

/*
 * Function to handle register customer request coming from ESW order confirmation
 */
server.get('RegisterCustomer', function (req, res, next) {
    let CustomerMgr = require('dw/customer/CustomerMgr');
    let retailerCartId = request.httpParameters.get('retailerCartId'),
        orderNumber = retailerCartId && retailerCartId.length > 0 ? retailerCartId[0] : null,
        existerCustomer,
        pwaUrl;
    try {
        let order = OrderMgr.getOrder(orderNumber);
        let countryCode = null;
        try {
            countryCode = order.getDefaultShipment().getShippingAddress().getCountryCode().getValue();
        } catch (e) {
            logger.error('ESW Checkout Registration error: {0}', e.message);
        }
        pwaUrl = eswPwaHelper.getPwaShopperUrl(countryCode);
        existerCustomer = CustomerMgr.getCustomerByLogin(order.getCustomerEmail());
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
    } catch (error) {
        if (!empty(orderNumber) && !empty(existerCustomer) && existerCustomer.registered) {
            res.redirect(pwaUrl + '/login');
        } else {
            res.redirect(pwaUrl + '/registration');
        }
    }
    next();
});

server.get('GetOrderNumber', function (req, res, next) {
    let orderNumber = request.httpParameters.get('orderNumber')[0];
    let selfHostedOcHelper = require('*/cartridge/scripts/helper/eswSelfHostedOcHelper');
    let order = selfHostedOcHelper.getEswOrderDetail(orderNumber);

    if (order) {
        res.json({
            orderNumber: order.currentOrderNo
        });
    } else {
        res.json({
            orderNumber: orderNumber
        });
    }

    next();
});

module.exports = server.exports();
