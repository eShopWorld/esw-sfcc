const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.modifyGETResponse = function (scriptProduct, doc) {
    // API Includes
    let Status = require('dw/system/Status');
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
    // Script Includes
        let OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
        OCAPIHelper.eswPdpPriceConversions(scriptProduct, doc);
    }
    return new Status(Status.OK);
};
