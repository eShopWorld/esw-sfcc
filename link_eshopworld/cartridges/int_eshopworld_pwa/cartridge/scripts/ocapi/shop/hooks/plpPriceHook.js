const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.modifyGETResponse = function (doc) {
    // API Includes
    let Status = require('dw/system/Status');
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        // Script Includes
            let OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
            OCAPIHelper.eswPlpPriceConversions(doc);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_plpPriceHook_modifyGETResponse_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};
