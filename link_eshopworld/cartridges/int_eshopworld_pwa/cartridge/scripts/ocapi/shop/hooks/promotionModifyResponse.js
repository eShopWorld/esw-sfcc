const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswServiceHelperV3 = require('*/cartridge/scripts/helper/serviceHelperV3');
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

// eslint-disable-next-line no-unused-vars
exports.modifyGETResponse = function (Promotion, doc) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        let locale = request.httpParameters.get('locale')[0],
            selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(request.httpParameters),
            selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
    //  eslint-disable-next-line no-param-reassign
        doc.calloutMsg[locale] = eswServiceHelperV3.convertPromotionMessage(doc.calloutMsg[locale], selectedCountryDetail, selectedCountryLocalizeObj);
    }
    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (basket, doc) {
    OCAPIHelper.basketItemsModifyResponse(basket, doc);
    return new Status(Status.OK);
};

exports.afterPOST = function (basket) {
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    let countryParam = request.httpParameters;
    let selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(countryParam);
    let selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
    var subtotal;
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(basket);
        if (selectedCountryDetail.isFixedPriceModel) {
            subtotal = basket.getAdjustedMerchandizeTotalPrice(false).decimalValue;
        } else {
            subtotal = eswCoreHelper.getMoneyObject(basket.getAdjustedMerchandizeTotalPrice(false), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
        }
        OCAPIHelper.adjustThresholdDiscounts(basket, subtotal, selectedCountryLocalizeObj);
        basketCalculationHelpers.calculateTotals(basket);
        eswCoreHelper.removeThresholdPromo(basket);
    });
    return new Status(Status.OK);
};
