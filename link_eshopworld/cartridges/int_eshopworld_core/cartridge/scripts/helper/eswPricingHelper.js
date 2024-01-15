'use strict';
/**
* Get Rounding Model for localize country
* @param {Object} localizeObj configured in site preference
* @returns {array} returns selected rounding rule
*/
const eswPricingHelper = {
    // TODO: Since empty() is not able to run from unit tests, need to check how to mock empty() from sinon
    isEmpty: function (param) {
        return typeof param === 'undefined' || param === null || param === '' || param.length === 0;
    },
    getESWRoundingModel: function (localizeObj) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
        let selectedRoundingRule = [];
        try {
            let paData = eswHelper.getPricingAdvisorData();
            let roundingModels = paData.roundingModels,
                selectedRoundingModel;
            if (localizeObj.applyRoundingModel === true && !this.isEmpty(roundingModels)) {
                selectedRoundingModel = roundingModels.filter(function (rule) {
                    return rule.deliveryCountryIso === localizeObj.countryCode;
                });
                if (this.isEmpty(selectedRoundingModel)) {
                    eswHelper.eswInfoLogger('error', 'Rounding rule for ' + localizeObj.countryCode + ' is not defined');
                } else {
                    selectedRoundingRule = selectedRoundingModel[0].roundingModels.filter(function (rule) {
                        return rule.currencyIso === localizeObj.currencyCode;
                    });
                }
            }
        } catch (e) {
            eswHelper.eswInfoLogger('ESW Localize Pricing Job error: ' + e);
        }
        return selectedRoundingRule;
    }
};

module.exports = {
    eswPricingHelper: eswPricingHelper
};
