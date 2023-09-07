'use strict';

const OrderMgr = require('dw/order/OrderMgr');
const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger').getLogger('ESWRmaJobLog', 'ESWRmaJobLog');
const Transaction = require('dw/system/Transaction');

/**
 * Get Auth token
 * @returns {string} - access token
 */
function getOathToken() {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
    let oAuthObj = eswCoreService.getOAuthService();
    let formData = {
        grant_type: 'client_credentials',
        scope: 'logistics.returns.api.all'
    };
    formData.client_id = eswHelper.getClientID();
    formData.client_secret = eswHelper.getClientSecret();
    let oAuthResult = oAuthObj.call(formData);
    if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
        Logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
        return null;
    }
    return JSON.parse(oAuthResult.object).access_token;
}
/**
 * Create json payload for line items
 * @param {dw.util.Collection} lineItemsCollection -  Collection of line items
 * @returns {Object} - line item payload object
 */
function getReturnLineItemsPayload(lineItemsCollection) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let collections = require('*/cartridge/scripts/util/collections');
    let returnLineItems = [];
    collections.forEach(lineItemsCollection, function (lineItem) {
        returnLineItems.push({
            productCode: lineItem.getProductID(),
            unitPrice: {
                amount: lineItem.getAdjustedGrossPrice().getValue(),
                currency: eswHelper.getBaseCurrency()
            },
            quantity: lineItem.getQuantity().getValue()
        });
    });
    return returnLineItems;
}
/**
 * Create return payload for logistic API
 * @param {dw.order.Order} order - DW order object
 * @returns {Object} - Required payload for the API
 */
function getReturnOrderPayload(order) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let orderReturnPayloadJson = {
        brandOrderReference: order.getOrderNo(),
        emailAddress: order.getCustomerEmail(),
        returnLineItems: [],
        returnOrderType: eswHelper.getReturnOrderType(),
        requestCreateLabel: false
    };
    orderReturnPayloadJson.returnLineItems = getReturnLineItemsPayload(order.getAllProductLineItems());
    return orderReturnPayloadJson;
}
/**
 * Execute the job
 * @returns {dw.system.Status} - Status of the job
 */
function execute() {
    try {
        let authToken = getOathToken();
        if (empty(authToken)) {
            Logger.error('Could not get access token.');
            return new Status(Status.ERROR);
        }
        let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
        OrderMgr.processOrders(function (order) {
            if (typeof order.custom.eswRmaJson === 'undefined' || empty(order.custom.eswRmaJson)) {
                let returOrderPayloadObject = getReturnOrderPayload(order);
                let returnSvcParams = {
                    bearerToken: authToken,
                    requestBody: returOrderPayloadObject
                };
                let returnOrderResponse = eswCoreService.getEswOrderReturnService().call(returnSvcParams);
                let responseToStore = (returnOrderResponse.isOk()) ? returnOrderResponse.getObject() : returnOrderResponse.getErrorMessage();
                Transaction.wrap(function () {
                    // eslint-disable-next-line no-param-reassign
                    order.custom.eswRmaJson = responseToStore;
                });
            }
        }, 'custom.eswIsReturned = {0}', true);
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('ESW Service Error: {0}', e.message);
        return new Status(Status.ERROR);
    }
}
exports.execute = execute;
