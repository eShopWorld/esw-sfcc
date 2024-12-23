const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;


exports.modifyPOSTResponse = function (basket, doc) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.basketItemsModifyResponse(basket, doc);
    }
    return new Status(Status.OK);
};


exports.modifyPATCHResponse = function (basket, doc) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.basketItemsModifyResponse(basket, doc);
    }
    return new Status(Status.OK);
};

exports.modifyGETResponse_v2 = function (basket, doc) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.basketModifyGETResponse_v2(basket, doc);
    }
    return new Status(Status.OK);
};

exports.beforePATCH = function (basket) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.setOverridePriceBooks(basket);
        let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
        Transaction.wrap(function () {
        // eslint-disable-next-line no-param-reassign
            basket.custom.eswShopperCurrency = selectedCountryDetail.countryCode;
            basket.updateTotals();
        });
    }
    return new Status(Status.OK);
};

exports.afterPATCH = function (basket) {
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
    return new Status(Status.OK);
};


exports.modifyDELETEResponse = function (basket, doc) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.deleteBasketItem(basket, doc);
    }
    return new Status(Status.OK);
};

// eslint-disable-next-line no-unused-vars
exports.beforePOST = function (basket, items) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
        Transaction.wrap(function () {
            if (empty(basket.shipments[0].shippingMethodID)) {
                eswCoreHelper.applyOverrideShipping(basket, selectedCountryDetail.countryCode);
            }
        });
    }
    return new Status(Status.OK);
};

exports.beforeGET = function () {
    const BasketMgr = require('dw/order/BasketMgr');
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.setSessionBaseCurrency(BasketMgr.getCurrentBasket());
    }
    return new Status(Status.OK);
};
