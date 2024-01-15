'use strict';
const base = module.superModule;

const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const Locale = require('dw/util/Locale');

const OrderModel = require('*/cartridge/models/order');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
* Returns a list of orders for the current customer
* @param {Object} currentCustomer - object with customer properties
* @param {Object} querystring - querystring properties
* @param {string} locale - the current request's locale id
* @returns {Object} - orderModel of the current dw order object
* */
function getOrders(currentCustomer, querystring, locale) {
    // get all orders for this user
    let orderHistory = currentCustomer.raw.getOrderHistory();
    let customerOrders = orderHistory.getOrders(
        'status!={0}',
        'creationDate desc',
        Order.ORDER_STATUS_REPLACED
    );

    let orders = [];

    let filterValues = [
        {
            displayValue: Resource.msg('orderhistory.sixmonths.option', 'order', null),
            optionValue: URLUtils.url('Order-Filtered', 'orderFilter', '6').abs().toString()
        },
        {
            displayValue: Resource.msg('orderhistory.twelvemonths.option', 'order', null),
            optionValue: URLUtils.url('Order-Filtered', 'orderFilter', '12').abs().toString()
        }
    ];
    let orderYear;
    let years = [];
    let customerOrder;
    let SIX_MONTHS_AGO = Date.now() - 15778476000;
    let YEAR_AGO = Date.now() - 31556952000;
    let orderModel;

    let currentLocale = Locale.getLocale(locale);

    while (customerOrders.hasNext()) {
        customerOrder = customerOrders.next();
        if (eswHelper.isOrderDetailEnabled() && (customerOrder.status.value === 0 || customerOrder.status.value === 8)) {
            /* eslint-disable no-continue */
            continue;
        }
        let config = {
            numberOfLineItems: 'single'
        };

        orderYear = customerOrder.getCreationDate().getFullYear().toString();
        let orderTime = customerOrder.getCreationDate().getTime();

        if (years.indexOf(orderYear) === -1) {
            let optionURL =
                URLUtils.url('Order-Filtered', 'orderFilter', orderYear).abs().toString();
            filterValues.push({
                displayValue: orderYear,
                optionValue: optionURL
            });
            years.push(orderYear);
        }

        if (querystring.orderFilter
            && querystring.orderFilter !== '12'
            && querystring.orderFilter !== '6') {
            if (orderYear === querystring.orderFilter) {
                orderModel = new OrderModel(
                    customerOrder,
                    { config: config, countryCode: currentLocale.country }
                );
                orders.push(orderModel);
            }
        } else if (querystring.orderFilter
            && YEAR_AGO < orderTime
            && querystring.orderFilter === '12') {
            orderModel = new OrderModel(
                customerOrder,
                { config: config, countryCode: currentLocale.country }
            );
            orders.push(orderModel);
        } else if (SIX_MONTHS_AGO < orderTime) {
            orderModel = new OrderModel(
                customerOrder,
                { config: config, countryCode: currentLocale.country }
            );
            orders.push(orderModel);
        }
    }

    return {
        orders: orders,
        filterValues: filterValues
    };
}

/**
 * Creates an order model for the current customer
 * @param {Object} req - the request object
 * @returns {Object} an object of the customer's last order
 */
function getLastOrder(req) {
    let orderModel = null;
    let orderHistory = req.currentCustomer.raw.getOrderHistory();
    let customerOrders = eswHelper.isOrderDetailEnabled() ? orderHistory.getOrders(
        'status!={0} AND status!={1} AND status!={2}',
        'creationDate desc',
        Order.ORDER_STATUS_REPLACED, Order.ORDER_STATUS_FAILED, Order.ORDER_STATUS_CREATED
    ) : orderHistory.getOrders(
        'status!={0}',
        'creationDate desc',
        Order.ORDER_STATUS_REPLACED
    );

    let order = customerOrders.first();

    if (order) {
        let currentLocale = Locale.getLocale(req.locale.id);

        let config = {
            numberOfLineItems: 'single'
        };

        orderModel = new OrderModel(order, { config: config, countryCode: currentLocale.country });
    }

    return orderModel;
}
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
base.getOrders = getOrders;
base.getLastOrder = getLastOrder;
module.exports = base;
