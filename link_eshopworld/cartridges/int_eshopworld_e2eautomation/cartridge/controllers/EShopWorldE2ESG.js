'use strict';

var guard = require('*/cartridge/scripts/guard');

var e2eHelpers = require('*/cartridge/scripts/helpers/e2eHelpers');
const Response = require('*/cartridge/scripts/util/Response');

const URLUtils = require('dw/web/URLUtils');

/* Script Modules */
const Constants = require('*/cartridge/scripts/util/Constants');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * E2eConfigurations : EShopWorld-E2eConfigurations
 * Example endpoint for E2E automation configuration
 */
function E2eConfigurations() {
    let configs = e2eHelpers.getE2eConfigurations();

    Response.renderJSON({ configs: configs });
    return;
}

/**
 * Handle Pre-Order V2. It prepares Pre-Order service request and calls it.
 * @returns {Object} - result
 */
function handlePreOrderRequestV2() {
    let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
        preorderServiceObj = eswCoreService.getPreorderServiceV2(),
        eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper'),
        redirectPreference = eswHelper.getRedirect();

    if (redirectPreference.value !== 'Cart' && session.privacy.guestCheckout == null) {
        if (!customer.authenticated) {
            session.privacy.TargetLocation = URLUtils.https('EShopWorldSG-PreOrderRequest').toString();
            return {
                status: 'REDIRECT'
            };
        }
    }
    eswHelper.setOAuthToken();

    let cart = dw.order.BasketMgr.getCurrentOrNewBasket();
    if (empty(cart.defaultShipment.shippingMethod)) {
        eswServiceHelper.getApplicableDefaultShippingMethod(cart);
    }

    let requestObj = eswServiceHelper.preparePreOrder();
    requestObj.retailerCartId = eswServiceHelper.createOrder();
    eswHelper.validatePreOrder(requestObj, true);
    session.privacy.confirmedOrderID = requestObj.retailerCartId;

    let result = preorderServiceObj.call(JSON.stringify(requestObj));
    return {
        result: result,
        preorderReqPayload: requestObj
    };
}

/**
 * Calls the appropriate version to handle the preorder request
 */
function preOrderRequest() {
    let preorderReqPayload;
    let result,
        isAjax = Object.hasOwnProperty.call(request.httpHeaders, 'x-requested-with'),
        logger = require('dw/system/Logger'),
        redirectURL,
        eswShopperAccessToken = '';

    let BasketMgr = require('dw/order/BasketMgr');
    let currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket) {
        delete session.privacy.restrictedProductID;
        // eslint-disable-next-line no-restricted-syntax
        for (let lineItemNumber in currentBasket.productLineItems) {  // eslint-disable-line guard-for-in
            let cartProduct = currentBasket.productLineItems[lineItemNumber].product;
            if (eswHelper.isProductRestricted(cartProduct)) {
                session.privacy.eswProductRestricted = true;
                session.privacy.restrictedProductID = cartProduct.ID;
                if (isAjax) {
                    Response.renderJSON({
                        redirectURL: URLUtils.https('Cart-Show').toString()
                    });
                } else {
                    response.redirect(URLUtils.https('Cart-Show').toString());
                }
                return;
            }
        }
    }

    try {
        if (!eswHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) {
            redirectURL = URLUtils.https('COCustomer-Start').toString();
        } else {
            if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                let cart = dw.order.BasketMgr.getCurrentOrNewBasket(),
                    eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
                if (empty(cart.defaultShipment.shippingMethod)) {
                    eswServiceHelper.getApplicableDefaultShippingMethod(cart);
                }
                result = eswHelper.generatePreOrderUsingBasket();
            } else {
                // eslint-disable-next-line no-use-before-define
                result = handlePreOrderRequestV2();
            }
            preorderReqPayload = result.preorderReqPayload;
            result = result.result;
            if ((result.status === 'REDIRECT') && (!('guestCheckout' in session.privacy) || session.privacy.guestCheckout == null)) {
                Response.renderJSON({
                    redirectURL: URLUtils.https('COCustomer-Start').toString()
                });
                return;
            }
            if (result.status === 'ERROR' || empty(result.object)) {
                logger.error('ESW Service Error: {0}', result.errorMessage);
                if (isAjax) {
                    if (eswHelper.isEswEnabledEmbeddedCheckout()) {
                        Response.renderJSON({
                            error: 'CHECKOUT_FAILED'
                        });
                    } else {
                        Response.renderJSON({
                            redirectURL: URLUtils.https('Cart-Show', 'eswfail', true).toString()
                        });
                    }
                } else {
                    response.redirect(URLUtils.https('Cart-Show', 'eswfail', true).toString());
                }
                return;
            }
            redirectURL = eswHelper.isEswEnabledEmbeddedCheckout() ?
             URLUtils.https('EShopWorldSG-EswEmbeddedCheckout', Constants.EMBEDDED_CHECKOUT_QUERY_PARAM, JSON.parse(result.object).redirectUrl).toString() :
             JSON.parse(result.object).redirectUrl;
            if ('shopperAccessToken' in JSON.parse(result.object)) {
                eswShopperAccessToken = JSON.parse(result.object).shopperAccessToken;
            }
            delete session.privacy.guestCheckout;
        }
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
        if (e.message === 'SFCC_ORDER_CREATION_FAILED') {
            redirectURL = URLUtils.https('Cart-Show', 'eswRetailerCartIdNullException', true).toString();
        } else if (e.message === 'ATTRIBUTES_MISSING_IN_PRE_ORDER') {
            redirectURL = URLUtils.https('Cart-Show', 'eswPreOrderException', true).toString();
        } else {
            redirectURL = URLUtils.https('Cart-Show', 'eswfail', true).toString();
        }
    }
    if (isAjax) {
        Response.renderJSON({
            redirectURL: redirectURL,
            eswAuthToken: eswShopperAccessToken,
            preorderReqPayload: preorderReqPayload
        });
    } else {
        response.redirect(redirectURL);
    }
}

/**
 * Returns Order details
 */
function getOrderDetail() {
    let OrderMgr = require('dw/order/OrderMgr');
    let requestBody = request.httpParameterMap.requestBodyAsString;
    let orderNumber = JSON.parse(requestBody).orderNumber;
    let order = OrderMgr.getOrder(orderNumber);

    if (!order) {
        response.setStatus(404);
        Response.renderJSON({
            error: true,
            message: 'Order not found'
        });
        return;
    }

    // Serialize only safe fields (do not expose sensitive data)
    let orderProductLineItems = [];
    let pliIter = order.productLineItems.iterator();
    while (pliIter.hasNext()) {
        let lineItem = pliIter.next();
        orderProductLineItems.push({
            productID: lineItem.productID,
            eswShopperCurrencyItemPriceInfo: lineItem.custom.eswShopperCurrencyItemPriceInfo
        });
    }

    Response.renderJSON({
        orderNo: order.orderNo,
        eswOrderAttributes: {
            eswShopperCurrencyTotal: order.custom.eswShopperCurrencyTotal,
            eswShopperCurrencyPaymentAmount: String(order.custom.eswShopperCurrencyPaymentAmount)
        },
        eswProductLineItemAttribute: orderProductLineItems
    });
}

/**
 * Returns Basket promotion Info
 */
function getPromoDetail() {
    const collections = require('*/cartridge/scripts/util/collections');
    const BasketMgr = require('dw/order/BasketMgr');
    const currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
    Response.renderJSON({ promotionResult: [], message: 'No basket found' });
        return;
    }

    let promoDetails = [];
    let orderPriceAdjustments = currentBasket.getPriceAdjustments();

    collections.forEach(orderPriceAdjustments, function (pa) {
        let promo = pa.getPromotion();
        promoDetails.push({
            promotionId: promo ? promo.getID() : pa.promotionID,
            promotionName: promo ? promo.getName() : pa.lineItemText,
            appliedDiscountValue: pa.price ? pa.price.value : 0,
            discountType: 'Order',
            discountValue: Math.abs(pa.price.value)
        });
    });

    collections.forEach(currentBasket.getAllProductLineItems(), function (pli) {
        collections.forEach(pli.getPriceAdjustments(), function (pa) {
            let promo = pa.getPromotion();
            promoDetails.push({
                promotionId: promo ? promo.getID() : pa.promotionID,
                promotionName: promo ? promo.getName() : pa.lineItemText,
                appliedDiscountValue: pa.price ? pa.price.value : 0,
                discountType: 'Product',
                discountValue: Math.abs(pa.price.value)
            });
        });
    });

    collections.forEach(currentBasket.getAllShippingPriceAdjustments(), function (pa) {
        let promo = pa.getPromotion();
        promoDetails.push({
            promotionId: promo ? promo.getID() : pa.promotionID,
            promotionName: promo ? promo.getName() : pa.lineItemText,
            appliedDiscountValue: pa.price ? pa.price.value : 0,
            discountType: 'Shipping',
            discountValue: Math.abs(pa.price.value)
        });
    });

    Response.renderJSON(
        { promotionResult: promoDetails,
            basketTotal: currentBasket.getTotalGrossPrice().value,
            currency: currentBasket.currencyCode
        }
    );
    return;
}

exports.GetOrderDetail = guard.ensure(['post'], getOrderDetail);

exports.E2eConfigurations = guard.ensure(['post'], E2eConfigurations);

/** Handles the preorder request
 * @see {@link module:controllers/EShopWorld~PreOrder} */
exports.PreOrderRequest = guard.ensure(['get', 'https'], preOrderRequest);

exports.GetPromoDetail = guard.ensure(['get'], getPromoDetail);
