'use strict';

/**
 * @namespace Checkout
 */

const server = require('server');
server.extend(module.superModule);

const ProductMgr = require('dw/catalog/ProductMgr');
const ArrayList = require('dw/util/ArrayList');
const logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const Site = require('dw/system/Site');

const Constants = require('*/cartridge/scripts/util/Constants');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
const eswCoreApiHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
const eswOcapiServiceHelper = require('*/cartridge/scripts/services/EswOcapiService').getEswOcapiServices;
const embCheckoutHelper = require('*/cartridge/scripts/helper/eckoutHelper').eswEmbCheckoutHelper;

server.get('EswEmbeddedCheckout', function (req, res, next) {
    let iframeUrlQueryParam = req.querystring[Constants.EMBEDDED_CHECKOUT_QUERY_PARAM];
    let eswIframeCheckoutUrl = empty(iframeUrlQueryParam) ? request.httpCookies[embCheckoutHelper.getEswIframeCookieName()].value : iframeUrlQueryParam;
    res.render('/checkout/eswEmbeddedCheckout', {
        eswCheckoutUrl: eswIframeCheckoutUrl,
        eswIframeErrorLogUrl: URLUtils.https('EShopWorld-EswIframeFailed').toString(),
        eswIframeFallbackUrl: embCheckoutHelper.getEswIframeFallbackUrl()
    });
    next();
});


server.post('EswEmbeddedCheckoutNotify', function (req, res, next) {
    let preorderServiceObj = eswCoreService.getSFCCOcapi();
    let responseJSON = {};
    let siteID = Site.getCurrent().getID();
    let currentBasketData = null;
    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals('Basic ' + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        logger.error('ESW Order Confirmation Error: Basic Authentication Token did not match');
    } else {
        let obj = JSON.parse(req.body);
        try {
            eswHelper.eswInfoLogger('Esw Order Confirmation Request', JSON.stringify(obj));
            let ocHelper = require('*/cartridge/scripts/helper/orderConfirmationHelper').getEswOcHelper();
            let shopperCurrency = ('checkoutTotal' in obj) ? obj.checkoutTotal.shopper.currency : obj.shopperCurrencyPaymentAmount.substring(0, 3);
            // Set Override Price Books
            ocHelper.setOverridePriceBooks(obj.deliveryCountryIso, shopperCurrency, req);
            let inventoryValidationPlis = { productLineItems: new ArrayList([]) };
            let authKey,
                accessToken;
            let basketID = eswHelper.getRetailerCartId(obj.retailerCartId);
            accessToken = eswHelper.getPWAHeadlessAccessToken(obj);
            if (!empty(accessToken)) {
                if (typeof accessToken === 'string') {
                    authKey = 'Bearer ' + accessToken;
                } else {
                    authKey = accessToken.authorization;
                }
            } else {
                let dwSid = eswHelper.getDwsid(obj);
                let customerEndpoint = Constants.CUSTOMER_AUTH + eswHelper.getOcapiClientID();
                let customerAuth = preorderServiceObj.call({ requestBody: { type: 'session' }, endpoint: customerEndpoint, dwsid: dwSid });
                authKey = customerAuth.ok && !empty(customerAuth.object) ? customerAuth.object.getResponseHeader('authorization') : null;
            }
            let ocapiBasketResponse = eswOcapiServiceHelper.ocapiBasketService().call({
                basketId: basketID,
                httpMethod: 'GET',
                authToken: authKey,
                siteID: siteID
            });

            if (ocapiBasketResponse.isOk() && !empty(ocapiBasketResponse.getObject())) {
                currentBasketData = JSON.parse(ocapiBasketResponse.object.text);
                     // inventory validation
                if (eswHelper.getEnableInventoryCheck()) {
                    if ('productItems' in currentBasketData) {
                        for (let item of currentBasketData.productItems) {
                            inventoryValidationPlis.productLineItems.add({
                                product: ProductMgr.getProduct(item.productId),
                                quantityValue: item.quantity
                            });
                        }
                    } else {
                        for (let i = 0; i < currentBasketData.product_items; i++) {
                            inventoryValidationPlis.productLineItems.add({
                                product: ProductMgr.getProduct(currentBasketData.product_items[i].product_id),
                                quantityValue: currentBasketData.product_items[i].quantity
                            });
                        }
                    }
                    if (!ocHelper.validateEswOrderInventory(inventoryValidationPlis)) {
                        throw new Error('Inventory validation failed');
                    }
                }
            }

            let isValidBasket = eswCoreApiHelper.compareBasketAndOcProducts(currentBasketData, obj);
            if (!isValidBasket) {
                throw new Error('Basket data from OCAPI and ESW Checkout are not equal');
            }
            // Generate order from the basket
            let ocapiOrderResponse = eswOcapiServiceHelper.ocapiOrderService().call({
                httpMethod: 'POST',
                authToken: authKey,
                basketId: basketID,
                countryCode: obj.deliveryCountryIso,
                siteID: siteID
            });
            // Update ESW order attributes
            if (ocapiOrderResponse.isOk() && !empty(ocapiOrderResponse.getObject())) {
                ocapiOrderResponse = JSON.parse(ocapiOrderResponse.object.text);
                Transaction.wrap(function () {
                    embCheckoutHelper.processUpdateOrderAttributes('order_no' in ocapiOrderResponse ? ocapiOrderResponse.order_no : ocapiOrderResponse.orderNo, obj, req);
                });
            } else {
                throw new Error('Error while generating order from the basket');
            }
            responseJSON = {
                OrderNumber: 'order_no' in ocapiOrderResponse ? ocapiOrderResponse.order_no : ocapiOrderResponse.orderNo,
                EShopWorldOrderNumber: obj.eShopWorldOrderNumber,
                ResponseCode: '200',
                ResponseText: 'Success'
            };
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
    return next();
});

server.post('EswIframeFailed', function (req, res, next) {
    let clientDetail = {
        userAgent: req.httpHeaders.get('user-agent') || 'N/A',
        timeStamp: new Date(Date.now()).toLocaleString(),
        message: 'ESW_EMBEDDED_CHECKOUT_FAILED'
    };
    eswHelper.eswInfoLogger('Error While Creating customers account', JSON.stringify(clientDetail));
    res.json({ success: true });
    next();
});

server.post('EswEmbeddedCheckoutPreOrderRequest', function (req, res, next) {
    let ocapiBasketResponse = null;
    let postedData = null,
        param = request.httpParameters;
    try {
        // Validate country code
        if (empty(param['country-code']) || !eswHelper.checkIsEswAllowedCountry(param['country-code'][0])) {
            res.json({ error: 'CHECKOUT_FAILED' });
            return next();
        }
        postedData = JSON.parse(req.body);
        ocapiBasketResponse = eswOcapiServiceHelper.ocapiBasketService().call({
            basketId: postedData.basket_id,
            httpMethod: 'PATCH',
            countryCode: param['country-code'][0]
        });
        if (ocapiBasketResponse.isOk() && !empty(ocapiBasketResponse.getObject())) {
            let response = JSON.parse(ocapiBasketResponse.object.text);
            if (response.c_eswPreOrderResponseStatus && response.c_eswPreOrderResponseStatus === 'OK') {
                response.c_eswPreOrderResponse.redirectUrl = eswHelper.getEswHeadlessSiteUrl() + Constants.EMBEDDED_CHECKOUT_ENDPOINT_HEADLESS + Constants.EMBEDDED_CHECKOUT_QUERY_PARAM + Constants.EQUALS_OPERATOR + response.c_eswPreOrderResponse.redirectUrl;
            }
            res.json(response);
        } else {
            res.json({
                error: 'CHECKOUT_FAILED'
            });
        }
    } catch (e) {
        logger.error('EShopWorld-Checkout Error: {0}', e.message);
        res.json({
            error: 'CHECKOUT_FAILED'
        });
    }
    return next();
});

module.exports = server.exports();
