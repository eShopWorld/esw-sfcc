const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

exports.beforePATCH = function (basket) {
    let collections = require('*/cartridge/scripts/util/collections');
    if (eswCoreHelper.isEnabledMultiOrigin()) {
        delete session.privacy.alreadyAddedQuantityInCart;
        delete session.privacy.alreadyAddedQuantityInCartItemUUID;
        let params = request.SCAPIPathParameters;
        let itemuuId = params.get('itemId');
        if (!empty(itemuuId)) {
            let requestLineItem = collections.find(basket.productLineItems, function (item) {
                return item.UUID === itemuuId;
            });
            if (!empty(requestLineItem)) {
                session.privacy.alreadyAddedQuantityInCart = requestLineItem.quantity.value;
                session.privacy.alreadyAddedQuantityInCartItemUUID = itemuuId;
            }
        }
    }
    return new Status(Status.OK);
};

exports.afterPATCH = function (basket) {
    if (eswCoreHelper.getEShopWorldModuleEnabled() && eswCoreHelper.isEnabledMultiOrigin()) {
        let alreadyAddedQuantityInCart = session.privacy.alreadyAddedQuantityInCart;
        let productId = session.privacy.alreadyAddedQuantityInCartItemUUID;
        if (!empty(productId) && !empty(alreadyAddedQuantityInCart)) {
            Transaction.wrap(function () {
                var response = OCAPIHelper.updateMultiOriginInfoToPLI(basket, [{ quantity: alreadyAddedQuantityInCart, productId: productId }]);
                if (response.error) {
                    session.privacy.errorMessage = response.message;
                } else {
                    basketCalculationHelpers.calculateTotals(basket);
                }
            });
        }
    }
    return new Status(Status.OK);
};
