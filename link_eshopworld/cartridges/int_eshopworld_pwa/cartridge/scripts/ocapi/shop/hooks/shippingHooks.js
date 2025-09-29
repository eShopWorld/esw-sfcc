const Status = require('dw/system/Status');
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

exports.modifyPUTResponse = function (basket, doc) {
    try {
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.basketModifyPUTResponse(basket, doc);
        }
    } catch (e) {
        eswCoreHelper.eswInfoLogger('OCAPI_ShippingHook_modifyPUTResponse_Error', e, e.message, e.stack);
    }
    return new Status(Status.OK);
};

exports.modifyGETResponse_v2 = function (shipment, shippingMethodResult) {
    OCAPIHelper.updateShippingMethodSelection(shippingMethodResult);
    return new Status(Status.OK);
};
