'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');

const eswJwtHelper = require('*/cartridge/scripts/jwt/eswJwtHelpers');

/**
 * Job step to get ASN from ESW within a specified date range.
 * @return {boolean} - returns execute result
 */
function execute() {
    try {
        eswJwtHelper.getJwksFromEsw();
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('JWKS service call failed: {0}: {1}', e.message, e.stack);
        return new Status(Status.ERROR);
    }
}

exports.execute = execute;
