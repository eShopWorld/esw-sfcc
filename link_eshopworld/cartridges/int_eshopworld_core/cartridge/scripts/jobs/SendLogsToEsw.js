'use strict';


/**
 * Executes the job to send logs to ESW.
 * Retrieves integration report JSON and logs the information using ESW helper.
 *
 * @returns {dw.system.Status} The status of the job execution.
 */
function execute() {
    const Status = require('dw/system/Status');

    const eswImHelepr = require('*/cartridge/scripts/helper/eswIntegrationMonitorHelper');
    const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    try {
        let logsJson = eswImHelepr.getLogsJson();
        eswHelper.eswInfoLogger('ESW Logs via Job ', ' SendLogsToEswJob ', JSON.stringify(logsJson), 'N/A', 'N/A');
        return new Status(Status.OK);
    } catch (e) {
        return new Status(Status.ERROR);
    }
}

exports.execute = execute;
