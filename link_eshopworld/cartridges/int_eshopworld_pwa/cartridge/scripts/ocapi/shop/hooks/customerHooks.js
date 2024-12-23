'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');

exports.afterPOST = function (customer, registration) {
    OCAPIHelper.handleCustomerPostResponse(customer, registration);

    return new Status(Status.OK);
};
