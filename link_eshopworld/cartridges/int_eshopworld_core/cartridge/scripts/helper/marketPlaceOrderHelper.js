'use strict';

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const StringUtils = require('dw/util/StringUtils');
const Logger = require('dw/system/Logger');

/**
 * function to get order items for version 2
 * @param {dw.order.Order} order - order
 * @returns {Object} - object
 */
function getOrderItemsV2(order) {
    let currentBasket = order,
        cartItems = [];
     // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (let lineItemNumber in currentBasket.productLineItems) {
        let item = currentBasket.productLineItems[lineItemNumber];
        let productVariationModel = item.product.variationModel;
        let color = productVariationModel.getProductVariationAttribute('color') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).displayValue : null;
        let size = productVariationModel.getProductVariationAttribute('size') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size')).displayValue : null;
        let eswImageType = eswHelper.geteswImageType();
        let productTitle = StringUtils.truncate(item.productName, 100, 'TRUNCATE_CHAR', '');
        let cartItem = {
            /* eslint-disable quote-props */
            'quantity': item.quantity.value,
            'estimatedDeliveryDateFromRetailer': 'estimatedDeliveryDateFromRetailer' in item.custom && !empty(item.custom.estimatedDeliveryDateFromRetailer) ? item.custom.estimatedDeliveryDateFromRetailer : '',
            // eslint-disable-next-line radix
            'lineItemId': 'lineItemId' in item.custom && !empty(item.custom.lineItemId) ? parseInt(item.custom.lineItemId) : '',
            'product': {
                'productCode': item.productID,
                'title': productTitle,
                'description': item.productName, // we are using product name/title instead of description. ESW checkout page displays description as product title. same field is used for product title name in ESW OMS which is used for logistic flows.
                'productUnitPriceInfo': 'productUnitPriceInfo' in item.custom && !empty(item.custom.productUnitPriceInfo) ? JSON.parse(item.custom.productUnitPriceInfo) : {},
                'customsDescription': 'customsDescription' in item.custom && !empty(item.custom.customsDescription) ? item.custom.customsDescription : '',
                'hsCode': 'hsCode' in item.custom && !empty(item.custom.hsCode) ? item.custom.hsCode : '',
                'countryOfOriginIso': 'countryOfOriginIso' in item.custom && !empty(item.custom.countryOfOriginIso) ? item.custom.countryOfOriginIso : '',
                'imageUrl': item.product.getImage(eswImageType, 0).httpURL.toString(),
                'color': color,
                'size': !empty(size) ? size : '',
                'metadataItems': {},
                'isReturnProhibited': 'isReturnProhibited' in item.custom && !empty(item.custom.isReturnProhibited) ? item.custom.isReturnProhibited : ''
            }
        };
        cartItems.push(cartItem);
    }
    return { cartItems: cartItems };
}

/**
 * function to prepare marketplace order request object for API Version 2
 * @param {dw.order} order - order
 * @returns {Object} - request object
 */
function prepareMarketPlaceOrderOrder(order) {
    let currentOrder = order;
    let requestObj = {};
    try {
        if (currentOrder != null) {
            let orderItemsV2 = getOrderItemsV2(currentOrder);
            requestObj = {
                'brandOrderReference': order.currentOrderNo,
                'weight': { 'weightTotal': 0, 'weightUnit': 'KG' },
                'orderType': 'orderType' in order.custom && !empty(order.custom.orderType) ? order.custom.orderType : '',
                'parentBrandOrderReference': 'parentBrandOrderReference' in order.custom && !empty(order.custom.parentBrandOrderReference) ? order.custom.parentBrandOrderReference : '',
                'transactionReference': 'transactionReference' in order.custom && !empty(order.custom.transactionReference) ? order.custom.transactionReference : '',
                'transactionDateTime': 'transactionDateTime' in order.custom && !empty(order.custom.transactionDateTime) ? order.custom.transactionDateTime : new Date().toISOString(),
                'actionedBy': 'actionedBy' in order.custom && !empty(order.custom.actionedBy) ? order.custom.actionedBy : '',
                'actionedByUser': 'actionedByUser' in order.custom && !empty(order.custom.actionedByUser) ? order.custom.actionedByUser : '',
                'shopperCurrencyIso': 'shopperCurrencyIso' in order.custom && !empty(order.custom.shopperCurrencyIso) ? order.custom.shopperCurrencyIso : '',
                'retailerCurrencyIso': 'retailerCurrencyIso' in order.custom && !empty(order.custom.retailerCurrencyIso) ? order.custom.retailerCurrencyIso : '',
                'deliveryCountryIso': 'deliveryCountryIso' in order.custom && !empty(order.custom.deliveryCountryIso) ? order.custom.deliveryCountryIso : '',
                'shopperExperience': 'shopperExperience' in order.custom && !empty(order.custom.shopperExperience) ? JSON.parse(order.custom.shopperExperience) : '',
                'contactDetails': 'contactDetails' in order.custom && !empty(order.custom.contactDetails) ? JSON.parse(order.custom.contactDetails) : [],
                'lineItems': orderItemsV2.cartItems,
                'deliveryOption': 'deliveryOption' in order.custom && !empty(order.custom.deliveryOption) ? JSON.parse(order.custom.deliveryOption) : {},
                'retailerInvoice': 'retailerInvoice' in order.custom && !empty(order.custom.retailerInvoice) ? JSON.parse(order.custom.retailerInvoice) : {},
                'payment': 'orderPayment' in order.custom && !empty(order.custom.orderPayment) ? JSON.parse(order.custom.orderPayment) : {},
                'originDetails': 'originDetails' in order.custom && !empty(order.custom.originDetails) ? JSON.parse(order.custom.originDetails) : {},
                'metadataItems': 'metadataItems' in order.custom && !empty(order.custom.metadataItems) ? JSON.parse(order.custom.metadataItems) : {}
            };
        }
    } catch (error) {
        Logger.error('Error while preparing ESW order request Error: ' + error.toString());
        return null;
    }
    return requestObj;
}

module.exports = {
    prepareMarketPlaceOrderOrder: prepareMarketPlaceOrderOrder
};
