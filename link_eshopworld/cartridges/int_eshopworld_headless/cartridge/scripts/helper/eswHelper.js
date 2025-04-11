/**
 * Helper script to get all ESW site preferences
 **/

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

module.exports = {
    getEswHelper: function () {
        return eswHelper;
    }
};
