'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.beforePOST = function (basket) {
    if (eswHelper.isEswEnabledEmbeddedCheckout()) {
        eswHelper.setEmbededCheckoutOverridePriceBooks(basket);
        eswHelper.handleEmbededCheckoutEswBasketAttributes(basket);
    }

    return new Status(Status.OK);
};
