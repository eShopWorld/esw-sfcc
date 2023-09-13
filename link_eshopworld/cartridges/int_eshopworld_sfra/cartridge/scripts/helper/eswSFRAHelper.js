/**
 * Helper script to get all ESW site preferences
 **/

const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

const getEswHelper = {
    getEShopWorldModuleEnabled: function () {
        return eswHelper.getEShopWorldModuleEnabled();
    },
    /*
     * Function is used to get override country from given country and currency
     */
    getOverrideCountry: function (selectedCountry, selectedCurrency) {
        return eswHelper.getOverrideCountry(selectedCountry, selectedCurrency);
    },
    /*
     * Function to perform fxrate calculations, apply adjustments, duty and tax and returns money object
     */
    getMoneyObject: function (price, noAdjustment, formatted, noRounding) {
        return eswHelper.getMoneyObject(price, noAdjustment, formatted, noRounding);
    },
    /*
     * This function is used to get total of cart or productlineitems based on input
     */
    getSubtotalObject: function (cart, isCart, listPrice) {
        return eswHelper.getSubtotalObject(cart, isCart, listPrice);
    },
    /*
     * This function is used to get Unit price cost for given lineitem
     */
    getUnitPriceCost: function (lineItem) {
        return eswHelper.getUnitPriceCost(lineItem);
    },
    getAvailableCountry: function () {
        return eswHelper.getAvailableCountry();
    },
    getCurrentEswCurrencyCode: function () {
        return eswHelper.getCurrentEswCurrencyCode();
    },
    /*
     * This function is used to get selected country price cost for given base price
     */
    getSelectedCountryProductPrice: function (price, currency) {
        return eswHelper.getSelectedCountryProductPrice(price, currency);
    },
    /**
    * Function used to get request is ajax.
    * @return {boolean} - boolean
    */
    isAjaxCall: function () {
        return eswHelper.isAjaxCall();
    }
};
module.exports = getEswHelper;
