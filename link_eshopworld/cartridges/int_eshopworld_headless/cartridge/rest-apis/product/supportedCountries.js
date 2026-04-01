
'use strict';


/* API includes */
const logger = require('dw/system/Logger');
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getSupportedCountries = function () {
    let responseJSON;
    try {
    let shopperTimezone = !empty(request.httpParameters.get('c_eswShopperTimezone')) ? request.httpParameters.get('c_eswShopperTimezone')[0] : null;
    let tzCountry = eswPwaHelper.getCountryByTimeZone(shopperTimezone);
    responseJSON = {
        allowedCountries: eswPwaHelper.getPwaSitesData(tzCountry)
    };
    } catch (e) {
        logger.error('ESW supportedCountries Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error',
            errorMessage: e.message
        };
    }
    RESTResponseMgr
        .createSuccess(responseJSON)
        .render();
};

exports.getSupportedCountries.public = true;
