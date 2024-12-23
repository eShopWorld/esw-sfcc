'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const basketHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');


exports.modifyPOSTResponse = function (basket, basketResponse) {
    basketHelper.sendOverrideShippingMethods(basket, basketResponse);
    return new Status(Status.OK);
};
