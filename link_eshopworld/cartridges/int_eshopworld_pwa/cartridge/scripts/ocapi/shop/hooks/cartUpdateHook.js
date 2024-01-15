const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.afterPATCH = function (basket) {
    let countryParam = empty(request.httpParameters.get('locale')) && !empty(basket) ? basket.custom.eswShopperCurrency : request.httpParameters;
    let selectedCountryDetail = eswPwaHelper.getCountryDetailByParam(countryParam);
    let selectedCountryLocalizeObj = eswPwaHelper.getCountryLocalizeObj(selectedCountryDetail);
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    Transaction.wrap(function () {
        if (!selectedCountryDetail.isFixedPriceModel) {
            let cartTotals = eswCoreHelper.getMoneyObject(basket.getAdjustedMerchandizeTotalPrice(false), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
            OCAPIHelper.adjustThresholdDiscounts(basket, cartTotals, selectedCountryLocalizeObj);
            basketCalculationHelpers.calculateTotals(basket);
            eswCoreHelper.removeThresholdPromo(basket);
        }
    });
    return new Status(Status.OK);
};
