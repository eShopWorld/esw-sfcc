'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');

exports.beforeGET = function () {
    OCAPIHelper.setOverridePriceBooks();

    return new Status(Status.OK);
};

exports.beforePOST = function (basket) {
    OCAPIHelper.setOverridePriceBooks(basket);
    OCAPIHelper.setDefaultOverrideShippingMethod(basket);

    return new Status(Status.OK);
};
