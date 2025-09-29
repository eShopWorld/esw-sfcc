'use strict';
const base = module.superModule;

const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const Locale = require('dw/util/Locale');
const formatMoney = require('dw/util/StringUtils').formatMoney;

const OrderModel = require('*/cartridge/models/order');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const formatCurrency = require('*/cartridge/scripts/util/formatting').formatCurrency;


/**
* Returns a list of orders for the current customer
* @param {Object} currentCustomer - object with customer properties
* @param {Object} querystring - querystring properties
* @param {string} locale - the current request's locale id
* @returns {Object} - orderModel of the current dw order object
* */
function getOrders(currentCustomer, querystring, locale) {
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
    try {
        // get all orders for this user
        let orderHistory = currentCustomer.raw.getOrderHistory();
        let customerOrders = orderHistory.getOrders(
            'status!={0}',
            'creationDate desc',
            Order.ORDER_STATUS_REPLACED
        );

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
    } catch (error) {
        eswHelper.eswInfoLogger('getOrders Error', error, error.message, error.stack);
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
    try {
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
    } catch (error) {
        eswHelper.eswInfoLogger('getLastOrder Error', error, error.message, error.stack);
    }
    return orderModel;
}


/**
 * Creates an ESW package JSON from the provided static JSON and order.
 *
 * @param {Array} eswOrderPkgJson - The static JSON array containing package information.
 * @param {Object} order - The order object containing order details.
 * @returns {Array} - An array of ESW package JSON objects.
 * @throws {Error} - Throws an error if eswOrderPkgJson is not a valid array.
 */
function createEswPackageJson(eswOrderPkgJson, order) {
    let eswPackageJson = [];
    let groupedPackages = {};

    if (!Array.isArray(eswOrderPkgJson)) {
        throw new Error('eswOrderPkgJson is not a valid array.');
    }

    // Group the items by trackingNumber
    eswOrderPkgJson.forEach(function (staticItem) {
        if (!staticItem || !staticItem.productLineItem || !staticItem.trackingNumber) {
            return;
        }


        if (!groupedPackages[staticItem.trackingNumber]) {
            groupedPackages[staticItem.trackingNumber] = {
                trackingNumber: staticItem.trackingNumber,
                productLineItems: [],
                trackingUrl: staticItem.trackingUrl || ''
            };
        }
        let price = !empty(staticItem.lineItemDetail.price) && !empty(staticItem.lineItemDetail.currency) ? formatCurrency(staticItem.lineItemDetail.price, staticItem.lineItemDetail.currency) : staticItem.lineItemDetail.price;

        // If the package with that trackingNumber does not exist, initialize it
        groupedPackages[staticItem.trackingNumber].productLineItems.push({
            productLineItem: staticItem.productLineItem,
            lineItemDetail: {
                productName: staticItem.lineItemDetail.name || 'N/A',
                color: staticItem.lineItemDetail.color || 'N/A',
                size: staticItem.lineItemDetail.size || 'N/A',
                price: price || 'N/A',
                currency: staticItem.lineItemDetail.currency || 'N/A',
                productImage: staticItem.lineItemDetail.productImage,
                quantity: staticItem.qty ? staticItem.qty : 0,
                total: staticItem.lineItemDetail.total ? formatMoney(new dw.value.Money(staticItem.lineItemDetail.total, order.custom.eswShopperCurrencyCode)) : 'N/A'
            }
        });
    });


    for (let trackingNumber of Object.keys(groupedPackages)) {
        if (Object.prototype.hasOwnProperty.call(groupedPackages, trackingNumber)) {
            eswPackageJson.push(groupedPackages[trackingNumber]);
        }
    }

    return eswPackageJson;
}


/**
 * Creates an order model for the current customer
 * @param {Object} req - the request object
 * @returns {Object} an object of the customer's order
 */
function getOrderDetails(req) {
    let orderModel;
    try {
        let order = OrderMgr.getOrder(req.querystring.orderID);

        let config = {
            numberOfLineItems: '*'
        };

        let currentLocale = Locale.getLocale(req.locale.id);

        orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        orderModel.isEswOrder = 'custom' in order && 'eswOrderNo' in order.custom && !empty(order.custom.eswOrderNo);
        if (eswHelper.isEswSplitShipmentEnabled() && ('eswPackageJSON' in order.custom && !empty(order.custom.eswPackageJSON))) {
            let eswOrderPkgJson = eswHelper.strToJson(order.custom.eswPackageJSON);
            orderModel.eswPackageJSON = createEswPackageJson(eswOrderPkgJson, order);
        }
    } catch (error) {
        eswHelper.eswInfoLogger('getOrderDetails Error', error, error.message, error.stack);
    }

    return orderModel;
}


base.getOrderDetails = getOrderDetails;
base.getOrders = getOrders;
base.getLastOrder = getLastOrder;
module.exports = base;
