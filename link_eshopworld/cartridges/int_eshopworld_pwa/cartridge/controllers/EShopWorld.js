'use strict';

const server = require('server');
server.extend(module.superModule);

const logger = require('dw/system/Logger');
const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');

const eswCoreBmHelper = require('*/cartridge/scripts/helper/eswBmHelper');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
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
    let selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters);
    let selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);

    filteredFields.defaultLoaderText = Resource.msg('message.default.esw.loading', 'esw', null);
    if (eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
        filteredFields.eswNativeShippingEnabled = eswHelper.isEswNativeShippingHidden() ? !eswHelper.isSelectedCountryOverrideShippingEnabled(selectedCountryDetail.countryCode) : false;
        filteredFields.eswNativeShippingEnabledMsg = Resource.msg('hide.shipping.disclaimer.msg', 'esw', null);
    }
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
    let basketItems = { products: [] };
    let coupons = [];
    let order = null;
    // eslint-disable-next-line eqeqeq
    if (!empty(eswClientLastOrderId) && eswClientLastOrderId != 'null') {
        order = OrderMgr.searchOrder('orderNo={0} AND (status={1} OR status={2} OR status={3})',
            eswClientLastOrderId,
            dw.order.Order.ORDER_STATUS_FAILED,
            dw.order.Order.ORDER_STATUS_CREATED,
            dw.order.Order.ORDER_STATUS_NEW);
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

module.exports = server.exports();
