/* eslint-disable no-loop-func */
/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/**
* EShopWorld Controller for Headless Architecture (OCAPI)
*
* @module  controllers/EswHL
*/

'use strict';
const app = require('*/cartridge/scripts/app');
const guard = require('*/cartridge/scripts/guard');

/**
* Returns the converted price
*/
function PriceConversion() {
    // API Includes
    let formatMoney = require('dw/util/StringUtils').formatMoney;

    // Script Includes
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;

    let param = request.httpParameterMap;
    let price = Number(param.price.value);
    let shopperCountry = param.country.stringValue;
    let shopperCurrency = param.currency.stringValue || pricingHelper.getShopperCurrency(shopperCountry);

    let localizeObj = {
        localizeCountryObj: {
            countryCode: shopperCountry,
            currencyCode: shopperCurrency
        },
        applyCountryAdjustments: param.applyAdjust.stringValue || 'true',
        applyRoundingModel: param.applyRounding.stringValue || 'true'
    };

    let convertedPrice = pricingHelper.getConvertedPrice(price, localizeObj);
    app.getView({
        price: formatMoney(new dw.value.Money(convertedPrice, localizeObj.localizeCountryObj.currencyCode))
    }).render('eswPrice');
}

/**
 * Function to return basket from order created
 */
function rebuildBasketFromOrder() {
    let Response = require('*/cartridge/scripts/util/Response');
    let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
    let param = request.httpParameterMap,
        eswClientLastOrderId = param.eswClientLastOrderId.stringValue;
    let response = eswHelperHL.generateBasketFromOrder(eswClientLastOrderId, true);
    Response.renderJSON(response);
}
/** Exports of the controller
 * @see {@link module:controllers/EswHL~rebuildBasketFromOrder} */
exports.RebuildBasketFromOrder = guard.ensure(['post'], rebuildBasketFromOrder);

/** Exports of the controller
 * @see {@link module:controllers/EswHL~PriceConversion} */
exports.PriceConversion = guard.ensure(['get'], PriceConversion);
