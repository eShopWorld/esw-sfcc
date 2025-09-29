const Status = require('dw/system/Status');

const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswMultiOriginHelper = require('*/cartridge/scripts/helper/eswMultiOriginHelper');
const collections = require('*/cartridge/scripts/util/collections');

exports.modifyPATCHResponse = function (basket, item) {
    let requestHttpPath = request.getHttpPath();
    let requestLineItem = null;
    // Get last uri param to get item_id
    if (!requestHttpPath || typeof requestHttpPath !== 'string') {
        return new Status(Status.OK); // Do not change response in case httpPath is not valid
    }
    let parts = requestHttpPath.split('/');
    let requestItemId = parts[parts.length - 1]; // Return the last part of the URI
    if (eswCoreHelper.isEnabledMultiOrigin()) {
        requestLineItem = collections.find(basket.productLineItems, function (pli) {
            return pli.UUID === requestItemId;
        });
        item.c_moAvailableQtys = eswMultiOriginHelper.getProductOriginDetails({
            productId: requestLineItem.productID,
            quantity: requestLineItem.quantityValue
        });
    }
    return new Status(Status.OK);
};
