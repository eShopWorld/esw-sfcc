'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.beforePOST = function (basket) {
    if (eswHelper.isEswEnabledEmbeddedCheckout()) {
        eswHelper.setEmbededCheckoutOverridePriceBooks(basket);
        eswHelper.handleEmbededCheckoutEswBasketAttributes(basket);
    } else {
        const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
        OCAPIHelper.setOverridePriceBooksAndDefaultShipments(basket);
        OCAPIHelper.handleEswBasketAttributes(basket);
    }

    return new Status(Status.OK);
};
