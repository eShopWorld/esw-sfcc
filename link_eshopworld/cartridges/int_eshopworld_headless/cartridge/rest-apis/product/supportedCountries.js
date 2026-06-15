
'use strict';


/* API includes */
const logger = require('dw/system/Logger');
const eswPwaHelper = require('*/cartridge/scripts/helper/eswPwaCoreHelper');
const RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getSupportedCountries = function () {
    let responseJSON;
    try {
    responseJSON = {
        allowedCountries: eswPwaHelper.getPwaSitesData()
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
