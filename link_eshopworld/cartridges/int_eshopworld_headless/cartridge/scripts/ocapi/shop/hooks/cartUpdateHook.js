const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');

exports.afterPATCH = function (basket) {
    if (request.isSCAPI()) {
        let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        try {
            let countryParam = empty(request.httpParameters.get('locale')) && !empty(basket) ? basket.custom.eswShopperCurrency : request.httpParameters;
            let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(countryParam);
            let selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
            Transaction.wrap(function () {
                if (!selectedCountryDetail.isFixedPriceModel) {
                    let cartTotals = eswCoreHelper.getMoneyObject(basket.getAdjustedMerchandizeTotalPrice(false), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                    eswHelperHL.adjustThresholdDiscountsPwa(basket, cartTotals, selectedCountryLocalizeObj);
                    basketCalculationHelpers.calculateTotals(basket);
                    eswCoreHelper.removeThresholdPromo(basket);
                } else {
                    basketCalculationHelpers.calculateTotals(basket);
                }
            });
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_cartUpdate_afterPATCH_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};
