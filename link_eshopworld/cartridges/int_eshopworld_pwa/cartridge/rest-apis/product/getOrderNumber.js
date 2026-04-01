
'use strict';


/* API includes */
const logger = require('dw/system/Logger');

const RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getOrderNumber = function () {
    let responseJSON;
    try {
        let orderNumber = request.httpParameters.get('c_orderNumber')[0];
        let selfHostedOcHelper = require('*/cartridge/scripts/helper/eswSelfHostedOcHelper');
        let order = selfHostedOcHelper.getEswOrderDetail(orderNumber);

        if (order) {
            responseJSON = {
                orderNumber: order.currentOrderNo
            };
        } else {
            responseJSON = {
                orderNumber: orderNumber
            };
        }
    } catch (e) {
        logger.error('ESW getOrderNumber Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error',
            errorMessage: e.message
        };
    }
    RESTResponseMgr
        .createSuccess(responseJSON)
        .render();
};

exports.getOrderNumber.public = true;
