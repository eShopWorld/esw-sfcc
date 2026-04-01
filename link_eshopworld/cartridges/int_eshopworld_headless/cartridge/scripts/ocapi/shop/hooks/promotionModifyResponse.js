const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswServiceHelperV3 = require('*/cartridge/scripts/helper/serviceHelperV3');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

// eslint-disable-next-line no-unused-vars
exports.modifyGETResponse = function (Promotion, doc) {
    if (request.isSCAPI()) {
        try {
            if (eswCoreHelper.getEShopWorldModuleEnabled()) {
                let locale = request.httpParameters.get('locale')[0],
                    selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters),
                    selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
            //  eslint-disable-next-line no-param-reassign
                doc.calloutMsg[locale] = eswServiceHelperV3.convertPromotionMessage(doc.calloutMsg[locale], selectedCountryDetail, selectedCountryLocalizeObj);
            }
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_promotion_modifyGETResponse_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (basket, doc) {
    if (request.isSCAPI()) {
        try {
            OCAPIHelper.basketItemsModifyResponse(basket, doc);
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_promotion_modifyPOSTResponse_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};

exports.afterPOST = function (basket) {
    if (request.isSCAPI()) {
        try {
            let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            let countryParam = request.httpParameters;
            let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(countryParam);
            let selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
            var subtotal;
            let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(basket);
                if (selectedCountryDetail.isFixedPriceModel) {
                    subtotal = basket.getAdjustedMerchandizeTotalPrice(false).decimalValue;
                } else {
                    subtotal = eswCoreHelper.getMoneyObject(basket.getAdjustedMerchandizeTotalPrice(false), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                }
                eswHelperHL.adjustThresholdDiscountsPwa(basket, subtotal, selectedCountryLocalizeObj);
                basketCalculationHelpers.calculateTotals(basket);
                eswCoreHelper.removeThresholdPromo(basket);
            });
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_promotion_afterPOST_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};

exports.afterDELETE = function (basket) {
    if (request.isSCAPI()) {
        OCAPIHelper.basketModifyBasketAfterCouponDelete(basket);
    }
    return new Status(Status.OK);
};
