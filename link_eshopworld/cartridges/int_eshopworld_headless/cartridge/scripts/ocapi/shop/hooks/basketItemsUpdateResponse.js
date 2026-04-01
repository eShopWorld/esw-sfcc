const Status = require('dw/system/Status');
const logger = require('dw/system/Logger');

const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswMultiOriginHelper = require('*/cartridge/scripts/helper/eswMultiOriginHelper');
const OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
const collections = require('*/cartridge/scripts/util/collections');
const Transaction = require('dw/system/Transaction');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
const eswCoreAPiHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');

exports.modifyPOSTResponse = function (basket, doc) {
    if (request.isSCAPI()) {
        eswCoreAPiHelper.getHeadlessLocale(request); // Test purpose only
        if (eswCoreHelper.getEShopWorldModuleEnabled()) {
            OCAPIHelper.basketItemsModifyResponse(basket, doc);
            if (eswCoreHelper.isEnabledMultiOrigin() && session.privacy.errorMessage) {
                doc.c_MultiOriginProductAddUpdateError = session.privacy.errorMessage;
            }
        }
    }
    return new Status(Status.OK);
};

exports.modifyPATCHResponse = function (basket, item) {
    if (request.isSCAPI()) {
        try {
            if (eswCoreHelper.getEShopWorldModuleEnabled()) {
                OCAPIHelper.basketItemsModifyResponse(basket, item);
            }
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_modifyPATCHResponse_Error', e, e.message, e.stack);
        }
        if (eswCoreHelper.isEnabledMultiOrigin() && session.privacy.errorMessage) {
            item.c_MultiOriginProductAddUpdateError = session.privacy.errorMessage;
        }
        if (eswCoreHelper.isEswEnabledEmbeddedCheckout() && 'eswPreOrderRequest' in basket.custom) {
            try {
                OCAPIHelper.handleEswPreOrderCall(basket, item);
            } catch (error) {
                logger.error('Error while modifying basket for  embeded checkout {0} ', error);
            }
        }
    } else {
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
    }
    return new Status(Status.OK);
};

exports.beforePATCH = function (basket) {
    if (request.isSCAPI()) {
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
    }
    return new Status(Status.OK);
};

exports.afterPATCH = function (basket) {
    if (request.isSCAPI()) {
        try {
            let eswHelperHL = require('*/cartridge/scripts/helper/eswHelperHL');
            if (eswCoreHelper.getEShopWorldModuleEnabled()) {
                let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
                let selectedCountryLocalizeObj = eswCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
                Transaction.wrap(function () {
                    if (empty(basket.shipments[0].shippingMethodID)) {
                        eswCoreHelper.applyOverrideShipping(basket, selectedCountryDetail.countryCode);
                    }
                    if (!selectedCountryDetail.isFixedPriceModel) {
                        let cartTotals = eswCoreHelper.getMoneyObject(basket.getAdjustedMerchandizeTotalPrice(false), false, false, !selectedCountryLocalizeObj.applyRoundingModel, selectedCountryLocalizeObj).value;
                        eswHelperHL.adjustThresholdDiscounts(basket, cartTotals, selectedCountryLocalizeObj);
                        basketCalculationHelpers.calculateTotals(basket);
                        eswCoreHelper.removeThresholdPromo(basket);
                    }
                });
            }
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_afterPATCH_Error', e, e.message, e.stack);
        }
        if (eswCoreHelper.isEswEnabledEmbeddedCheckout() && 'eswPreOrderRequest' in basket.custom) {
            try {
                Transaction.wrap(function () {
                    OCAPIHelper.handleEswBasketAttributes(basket);
                    OCAPIHelper.handleEswOrderAttributes(basket);
                });
            } catch (error) {
                logger.error('Error while modifying basket for  embeded checkout {0} ', error);
                Transaction.wrap(function () {
                    basket.custom.eswPreOrderRequest = '';
                });
            }
        } else {
            basketCalculationHelpers.calculateTotals(basket);
        }
    }
    return new Status(Status.OK);
};

exports.modifyDELETEResponse = function (basket, doc) {
    if (request.isSCAPI()) {
        try {
            if (eswCoreHelper.getEShopWorldModuleEnabled()) {
                OCAPIHelper.deleteBasketItem(basket, doc);
            }
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_modifyDELETEResponse_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};

// eslint-disable-next-line no-unused-vars
exports.beforePOST = function (basket, items) {
    if (request.isSCAPI()) {
        try {
            if (eswCoreHelper.getEShopWorldModuleEnabled()) {
                let selectedCountryDetail = eswCoreHelper.getCountryDetailByParam(request.httpParameters);
                Transaction.wrap(function () {
                    if (selectedCountryDetail.isFixedPriceModel) {
                        eswCoreHelper.updateShopperBasketCurrency(selectedCountryDetail, basket);
                    }
                    if (empty(basket.shipments[0].shippingMethodID)) {
                        eswCoreHelper.applyOverrideShipping(basket, selectedCountryDetail.countryCode);
                    }
                    basket.custom.eswShopperCurrency = selectedCountryDetail.countryCode;
                });
            }
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_beforePOST_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};

exports.beforeGET = function () {
    if (request.isSCAPI()) {
        try {
            const BasketMgr = require('dw/order/BasketMgr');
            if (eswCoreHelper.getEShopWorldModuleEnabled()) {
                OCAPIHelper.setSessionBaseCurrency(BasketMgr.getCurrentBasket());
            }
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_beforeGET_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};

exports.modifyGETResponse_v2 = function (basket, doc) {
    if (request.isSCAPI()) {
        try {
            if (eswCoreHelper.getEShopWorldModuleEnabled()) {
                OCAPIHelper.basketModifyGETResponse_v2(basket, doc);
            }
        } catch (e) {
            eswCoreHelper.eswInfoLogger('OCAPI_modifyGETResponse_v2_Error', e, e.message, e.stack);
        }
    }
    return new Status(Status.OK);
};