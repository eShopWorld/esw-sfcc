const Status = require('dw/system/Status');
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.modifyPUTResponse = function (basket, doc) {
    if (eswCoreHelper.getEShopWorldModuleEnabled()) {
        OCAPIHelper.basketModifyPUTResponse(basket, doc);
    }
    return new Status(Status.OK);
};
