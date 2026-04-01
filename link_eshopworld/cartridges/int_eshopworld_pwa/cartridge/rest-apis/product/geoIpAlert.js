
'use strict';


/* API includes */
const logger = require('dw/system/Logger');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getGeoIpAlert = function () {
    let responseJSON;
    try {
    let shopperCountry = request.httpParameters.get('c_shopperCountry')[0];
    let geoIpInfo = eswHelper.isSameGeoIpCountry(shopperCountry);
    responseJSON = { geoIpInfo: geoIpInfo };
    } catch (e) {
        logger.error('ESW geoIpAlert Error: {0}', e.message);
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

exports.getGeoIpAlert.public = true;
