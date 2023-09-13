'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const Status = require('dw/system/Status');

/**
 * Execute the job
 * @returns {dw.system.Status} - DW Status
 */
function execute() {
    let co = CustomObjectMgr.getCustomObject('ESW_DIAGNOSTIC_DATA', 'ESW_DIAGNOSTIC_DATA');
    let Resource = require('dw/web/Resource');
    Transaction.wrap(function () {
        if (co) { // If custom object exist then only update payload
            co.getCustom().sfccArchitectVersion = empty(co.getCustom().sfccArchitectVersion) ? Resource.msg('sfcc.architect.version', 'esw', null) : co.getCustom().sfccArchitectVersion;
            co.getCustom().eswCartridgeVersion = empty(co.getCustom().eswCartridgeVersion) ? Resource.msg('esw.cartridge.version', 'esw', null) : co.getCustom().eswCartridgeVersion;
        } else { // Create new custom with request payload coming from ESW CSP
            co = CustomObjectMgr.createCustomObject('ESW_DIAGNOSTIC_DATA', 'ESW_DIAGNOSTIC_DATA');
            co.getCustom().sfccArchitectVersion = Resource.msg('sfcc.architect.version', 'esw', null);
            co.getCustom().eswCartridgeVersion = Resource.msg('esw.cartridge.version', 'esw', null);
        }
    });
    return new Status(Status.OK);
}

exports.execute = execute;
