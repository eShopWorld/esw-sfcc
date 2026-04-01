'use strict';

// API Includes
const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');

// Script Includes
const collections = require('*/cartridge/scripts/util/collections');
// Script Includes
const basketHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswCoreAPiHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');



exports.beforePATCH = function (basket) {
    if (request.isSCAPI()) {
        try {
            if (eswHelper.getEShopWorldModuleEnabled()) {
                OCAPIHelper.setOverridePriceBooks(basket);
                let selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters);
                Transaction.wrap(function () {
                // eslint-disable-next-line no-param-reassign
                    basket.custom.eswShopperCurrency = selectedCountryDetail.countryCode;
                    basket.updateTotals();
                });
            }
        } catch (e) {
            eswHelper.eswInfoLogger('OCAPI_beforePATCH_Error', e, e.message, e.stack);
        }
    } else {
        if (eswHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.setOverridePriceBooks(basket);
            OCAPIHelper.handleEswBasketAttributes(basket);
            eswHelper.removeThresholdPromo(basket);
        }
    }
    return new Status(Status.OK);
};

exports.modifyPATCHResponse = function (order, orderResponse) {
    if (request.isSCAPI()) {
        try {
            if (eswHelper.getEShopWorldModuleEnabled()) {
                OCAPIHelper.basketItemsModifyResponse(order, orderResponse);
            }
        } catch (e) {
            eswHelper.eswInfoLogger('OCAPI_modifyPATCHResponse_Error', e, e.message, e.stack);
        }
        if (eswHelper.isEnabledMultiOrigin() && session.privacy.errorMessage) {
            orderResponse.c_MultiOriginProductAddUpdateError = session.privacy.errorMessage;
        }
        if (eswHelper.isEswEnabledEmbeddedCheckout() && 'eswPreOrderRequest' in order.custom) {
            try {
                OCAPIHelper.handleEswPreOrderCall(order, orderResponse);
            } catch (error) {
                Logger.error('Error while modifying basket for  embeded checkout {0} ', error);
            }
        }
        return new Status(Status.OK);
    } else {
        if (eswHelper.isEswEnabledEmbeddedCheckout()) {
            OCAPIHelper.handleEswPreOrderCall(order, orderResponse);
        }
    }
    return new Status(Status.OK);
};


exports.afterPOST = function (basket) {
    eswCoreAPiHelper.getHeadlessLocale(request);// Test purpose only

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

