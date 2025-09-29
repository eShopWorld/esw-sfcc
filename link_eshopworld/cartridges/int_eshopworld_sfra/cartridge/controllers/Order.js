'use strict';

/**
 * @namespace Cart
 */

const server = require('server');
server.extend(module.superModule);

/* Script Modules */
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');

server.append('Track', function (req, res, next) {
    try {
        let viewData = res.getViewData();
        if (!empty(viewData.order)) {
            let order = OrderMgr.getOrder(viewData.order.orderNumber);
            viewData.order.isPaymentConfirmed = order.confirmationStatus.value === Order.CONFIRMATION_STATUS_NOTCONFIRMED;
            viewData.order.paymentInstruments = order.paymentInstruments;
            viewData.order.currencySymbol = !empty(viewData.order.priceTotal) ? viewData.order.priceTotal.replace(/[0-9.]/g, '') : null;
        }
        res.setViewData(viewData);
    } catch (error) {
        eswHelper.eswInfoLogger('ESW Track Order Error', error, error.message, error.stack);
    }
    next();
});

server.append('Details', function (req, res, next) {
    try {
        let viewData = res.getViewData();
        if (!empty(viewData.order)) {
            let order = OrderMgr.getOrder(viewData.order.orderNumber);
            viewData.order.isPaymentConfirmed = order.confirmationStatus.value === Order.CONFIRMATION_STATUS_NOTCONFIRMED;
            viewData.order.paymentInstruments = order.paymentInstruments;
            viewData.order.currencySymbol = !empty(viewData.order.priceTotal) ? viewData.order.priceTotal.replace(/[0-9.]/g, '') : null;
        }
        res.setViewData(viewData);
    } catch (error) {
        eswHelper.eswInfoLogger('ESW Details Order Error', error, error.message, error.stack);
    }
    next();
});

module.exports = server.exports();
