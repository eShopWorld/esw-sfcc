'use strict';

const Status = require('dw/system/Status');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');

/**
 * Create Order in ESW CSP using ESW Order API
 *
 * @param {dw.order.Order} order The order to transmit data for
 * @returns {Array<Object>} Results of each order export in ESW CSP.
 */
function createESWOrder(order) {
    let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let marketPlaceOrderHelper = require('*/cartridge/scripts/helper/marketPlaceOrderHelper');
    try {
        let oAuthObj = eswCoreService.getOAuthService();
        let formData = {
            grant_type: 'client_credentials',
            scope: 'order.transaction.create.api.all'
        };

        formData.client_id = eswHelper.getClientID();
        formData.client_secret = eswHelper.getClientSecret();
        let oAuthResult = oAuthObj.call(formData);
        if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
            Logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
            eswHelper.eswInfoLogger('Error', '', 'ESW Export MarketPlaceOrder Error', oAuthResult.errorMessage);
            return new Status(Status.ERROR);
        }
        let maketPlaceOrderPayloadObject = marketPlaceOrderHelper.prepareMarketPlaceOrderOrder(order),
            maketPlaceSvcParams = {
                bearerToken: JSON.parse(oAuthResult.object).access_token,
                requestBody: maketPlaceOrderPayloadObject
            };

        let response = eswCoreService.getOrderSubmitAPIServiceV2().call(maketPlaceSvcParams);
        return response;
    } catch (e) {
        eswHelper.eswInfoLogger('create ESW Order error', e, e.message, e.stack);
        Logger.error('ESW service call error: {0}', e.message);
        return new Status(Status.ERROR);
    }
}

/**
 * execute the job
 * @param {Object} args - Job params
 * @returns {dw.system.Status} - Status of job
 */
function execute() {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    try {
        OrderMgr.processOrders(function (order) {
            let result = createESWOrder(order);
            if (result && result.status === 'OK') {
                Transaction.wrap(function () { // eslint-disable-line no-loop-func
                    // eslint-disable-next-line no-param-reassign
                    order.custom.isnonCheckoutOrderExported = true;
                });
            }
        }, 'custom.nonCheckoutEcommerce = {0} AND custom.isnonCheckoutOrderExported != {1}', true, true);
    } catch (e) {
        Logger.error('eswExportMarketPlaceOrders' + JSON.stringify(e));
        eswHelper.eswInfoLogger('eswExportMarketPlaceOrders Error', e, e.message, e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
