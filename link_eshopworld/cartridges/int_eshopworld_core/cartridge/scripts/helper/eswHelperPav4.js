'use strict';

var eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
var Constants = require('*/cartridge/scripts/util/Constants');

var eswPav4Helper = {
    getPaDataByCategoryOrCountry: function (selectedCountry, category, eswCurrency) {
        var selectedPaCategory = empty(category) ? Constants.DEFAULT_PA_CATEGORY : category;
        var country = empty(selectedCountry) ? request.httpCookies['esw.location'] : selectedCountry;
        var paDataObj = eswHelper.getPricingAdvisorData();
        var countryAdjustment = paDataObj.countryAdjustment,
            roundingModels = paDataObj.roundingModels,
            selectedCountryAdjustment = [],
            selectedRoundingRule = [];
        if (!empty(countryAdjustment)) {
            selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
                return adjustment.deliveryCountryIso === country && selectedPaCategory === adjustment.category;
            });
        }

        if (!empty(roundingModels)) {
            var selectedRoundingModel = roundingModels.filter(function (rule) {
                return rule.deliveryCountryIso === country && selectedPaCategory === rule.category;
            });

            if (!empty(selectedRoundingModel)) {
                selectedRoundingRule = selectedRoundingModel[0].roundingModels.filter(function (rule) {
                    return rule.currencyIso === eswCurrency.value;
                });
            }
        }
        return {
            selectedCountryAdjustment: selectedCountryAdjustment,
            selectedRoundingRule: selectedRoundingRule
        };
    },
    /**
     * Map PAV4 data same as PAv3 data
     * @param {Object} paV4Json - API response of PAv4
     * @returns {Object} - FxRate, countryAdjustment and rounding rule
     */
    getMapPaV4DataForCustomObject: function (paV4Json) {
        var ArrayList = require('dw/util/ArrayList');
        var collections = require('*/cartridge/scripts/util/collections');
        var fxRates = [];
        var countryAdjustments = [];
        var countryAdjusmentCategoryArr = [];
        var roundingRuleArr = [];
        var roundingRules = [];
        var paV4Arr = new ArrayList(paV4Json);
        collections.forEach(paV4Arr, function (pav4Data) {
            // Map fxRates
            fxRates.push({
                fromRetailerCurrencyIso: pav4Data.fxRates[0].from,
                toShopperCurrencyIso: pav4Data.fxRates[0].to,
                rate: parseFloat(pav4Data.fxRates[0].rate.toFixed(30), 10)
            });
            // Map country adjustments and rounding rules
            var paCategories = new ArrayList(pav4Data.categories);
            collections.forEach(paCategories, function (paCategory) {
                // Country adjustment array
                countryAdjusmentCategoryArr.push({
                    category: paCategory.id,
                    deliveryCountryIso: pav4Data.countryIso,
                    syncID: pav4Data.id,
                    retailerAdjustments: {
                        priceUpliftPercentage: paCategory.retailerAdjustment
                    },
                    estimatedRates: {
                        dutyPercentage: paCategory.estimatedDuty,
                        taxPercentage: paCategory.estimatedTax,
                        feePercentage: paCategory.estimatedFee
                    }
                });
                // Rounding rules array
                var roundingModels = [];
                if (paCategory.roundingConfigurations && !empty(paCategory.roundingConfigurations[0])) {
                    roundingModels = [
                        {
                            currencyIso: paCategory.roundingConfigurations[0].currencyIso,
                            currencyExponent: paCategory.roundingConfigurations[0].currencyExponent,
                            direction: paCategory.roundingConfigurations[0].direction,
                            model: paCategory.roundingConfigurations[0].model
                            // category: paCategory.id
                        }
                    ];
                }
                roundingRuleArr.push({
                    category: paCategory.id,
                    deliveryCountryIso: pav4Data.countryIso,
                    roundingModels: roundingModels
                });
            });
            countryAdjustments.push(countryAdjusmentCategoryArr);
            roundingRules.push(roundingRuleArr);
        });
        return { fxRates: fxRates, countryAdjustments: countryAdjustments[0], roundingRules: roundingRules[0] };
    }
};
module.exports = eswPav4Helper;
