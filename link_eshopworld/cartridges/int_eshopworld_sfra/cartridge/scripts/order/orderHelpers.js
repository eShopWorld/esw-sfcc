'use strict';
const base = module.superModule;

const OrderMgr = require('dw/order/OrderMgr');
const Locale = require('dw/util/Locale');

const OrderModel = require('*/cartridge/models/order');

/**
 * Creates an order model for the current customer
 * @param {Object} req - the request object
 * @returns {Object} an object of the customer's order
 */
function getOrderDetails(req) {
    let order = OrderMgr.getOrder(req.querystring.orderID);

    let config = {
        numberOfLineItems: '*'
    };

    let currentLocale = Locale.getLocale(req.locale.id);

    let orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );
    orderModel.isEswOrder = 'custom' in order && 'eswOrderNo' in order.custom && !empty(order.custom.eswOrderNo);

    return orderModel;
}

base.getOrderDetails = getOrderDetails;
module.exports = base;
