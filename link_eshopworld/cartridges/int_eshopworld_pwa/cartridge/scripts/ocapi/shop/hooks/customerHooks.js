'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.afterPOST = function (customer, registration) {
    try {
        OCAPIHelper.handleCustomerPostResponse(customer, registration);
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_customerHook_afterPOST_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};
