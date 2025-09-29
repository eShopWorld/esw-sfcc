'use strict';

// API Includes
const Status = require('dw/system/Status');

// Script Includes
const collections = require('*/cartridge/scripts/util/collections');
// Script Includes
const basketHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;


exports.beforePATCH = function (basket) {
    if (eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.setOverridePriceBooks(basket);
        OCAPIHelper.handleEswBasketAttributes(basket);
        eswHelper.removeThresholdPromo(basket);
    }

    return new Status(Status.OK);
};

exports.modifyPATCHResponse = function (order, orderResponse) {
    if (eswHelper.isEswEnabledEmbeddedCheckout()) {
        OCAPIHelper.handleEswPreOrderCall(order, orderResponse);
    }
    return new Status(Status.OK);
};


exports.afterPOST = function (basket) {
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    let Transaction = require('dw/system/Transaction');
    if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isEnabledMultiOrigin()) {
        let items = [];
        collections.forEach(basket.productLineItems, function (item) {
            items.push({
                quantity: item.quantity.value,
                productId: item.productID
            });
        });
        Transaction.wrap(function () {
            let response = OCAPIHelper.addMultiOriginInfoToPLI(basket, items);
            if (response.error) {
                session.privacy.errorMessage = response.message;
            }
            basketCalculationHelpers.calculateTotals(basket);
        });
    } else {
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(basket);
        });
    }
    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (basket, response) {
    basketHelper.sendOverrideShippingMethods(basket, response);
    if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isEnabledMultiOrigin()) {
        OCAPIHelper.groupLineItemsByOrigin(response);
        if (session.privacy.errorMessage) {
            response.c_MultiOriginProductAddUpdateError = session.privacy.errorMessage;
        }
    }
    return new Status(Status.OK);
};

