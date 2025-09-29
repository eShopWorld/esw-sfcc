const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
const logger = require('dw/system/Logger');

const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.modifyPOSTResponse = function (basket, doc) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.basketItemsModifyResponse(basket, doc);
        if (eswCoreHelper.isEnabledMultiOrigin() && session.privacy.errorMessage) {
            doc.c_MultiOriginProductAddUpdateError = session.privacy.errorMessage;
        }
    }
    return new Status(Status.OK);
};


exports.modifyPATCHResponse = function (basket, doc) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.basketItemsModifyResponse(basket, doc);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_modifyPATCHResponse_Error', e, e.message, e.stack);
    }
    if (eswCoreHelper.isEnabledMultiOrigin() && session.privacy.errorMessage) {
        doc.c_MultiOriginProductAddUpdateError = session.privacy.errorMessage;
    }
    if (eswCoreHelper.isEswEnabledEmbeddedCheckout() && 'eswPreOrderRequest' in basket.custom) {
        try {
            OCAPIHelper.handleEswPreOrderCall(basket, doc);
        } catch (error) {
            logger.error('Error while modifying basket for  embeded checkout {0} ', error);
        }
    }
    return new Status(Status.OK);
};

exports.modifyGETResponse_v2 = function (basket, doc) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.basketModifyGETResponse_v2(basket, doc);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_modifyGETResponse_v2_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

exports.beforePATCH = function (basket) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.setOverridePriceBooks(basket);
            let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
            Transaction.wrap(function () {
            // eslint-disable-next-line no-param-reassign
                basket.custom.eswShopperCurrency = selectedCountryDetail.countryCode;
                basket.updateTotals();
            });
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_beforePATCH_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

exports.afterPATCH = function (basket) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
            let selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
            let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            Transaction.wrap(function () {
                if (empty(basket.shipments[0].shippingMethodID)) {
                    eswCoreHelper.applyOverrideShipping(basket, selectedCountryDetail.countryCode);
                }
                if (!selectedCountryDetail.isFixedPriceModel) {
                    let cartTotals = eswCoreHelper.getMoneyObject(basket.getAdjustedMerchandizeTotalPrice(false), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                    OCAPIHelper.adjustThresholdDiscounts(basket, cartTotals, selectedCountryLocalizeObj);
                    basketCalculationHelpers.calculateTotals(basket);
                    eswCoreHelper.removeThresholdPromo(basket);
                }
            });
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_afterPATCH_Error', e, e.message, e.stack);
    }
    if (eswCoreHelper.isEswEnabledEmbeddedCheckout() && 'eswPreOrderRequest' in basket.custom) {
        try {
            Transaction.wrap(function () {
                OCAPIHelper.handleEswBasketAttributes(basket);
                OCAPIHelper.handleEswOrderAttributes(basket);
            });
        } catch (error) {
            logger.error('Error while modifying basket for  embeded checkout {0} ', error);
            Transaction.wrap(function () {
                basket.custom.eswPreOrderRequest = '';
            });
        }
    }
    return new Status(Status.OK);
};


exports.modifyDELETEResponse = function (basket, doc) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.deleteBasketItem(basket, doc);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_modifyDELETEResponse_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

// eslint-disable-next-line no-unused-vars
exports.beforePOST = function (basket, items) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
            Transaction.wrap(function () {
                if (selectedCountryDetail.isFixedPriceModel) {
                    eswCoreHelper.updateShopperBasketCurrency(selectedCountryDetail, basket);
                }
                if (empty(basket.shipments[0].shippingMethodID)) {
                    eswCoreHelper.applyOverrideShipping(basket, selectedCountryDetail.countryCode);
                }
            });
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_beforePOST_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

exports.beforeGET = function () {
    try {
        const BasketMgr = require('dw/order/BasketMgr');
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.setSessionBaseCurrency(BasketMgr.getCurrentBasket());
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_beforeGET_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};
