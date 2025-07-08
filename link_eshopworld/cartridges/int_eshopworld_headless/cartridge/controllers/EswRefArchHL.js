/* eslint-disable no-param-reassign */
'use strict';
const server = require('server');

/* API includes */
const logger = require('dw/system/Logger');

/**
* Returns the converted price
*/
server.get('PriceConversion', function (req, res, next) {
    // API Includes
    let formatMoney = require('dw/util/StringUtils').formatMoney;

    // Script Includes
    let pricingHelper = require('*/cartridge/scripts/helper/eswPricingHelper').eswPricingHelper;
    let responseJSON;
    try {
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
        responseJSON = {
            price: formatMoney(new dw.value.Money(convertedPrice, localizeObj.localizeCountryObj.currencyCode)),
            ResponseCode: '200',
            ResponseText: 'Price converted successfully'
        };
    } catch (e) {
        logger.error('ESW Plugin Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error'
        };
    }
    res.json(responseJSON);
    next();
});

/**
 * Rebuilds the basket from the last ESW client order ID
 */
server.post('RebuildBasketFromOrder', function (req, res, next) {
    let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
    let eswClientLastOrderId = req.querystring.eswClientLastOrderId;
    let response = eswHelperHL.generateBasketFromOrder(eswClientLastOrderId);
    res.json(response);
    return next();
});

module.exports = server.exports();
