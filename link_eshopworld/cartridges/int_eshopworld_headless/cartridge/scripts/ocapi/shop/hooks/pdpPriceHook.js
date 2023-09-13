exports.modifyGETResponse = function (scriptProduct, doc) {
    // API Includes
    let Status = require('dw/system/Status');

    // Script Includes
    let OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
    OCAPIHelper.eswPdpPriceConversions(scriptProduct, doc);

    return new Status(Status.OK);
};
