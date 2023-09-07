'use strict';
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const base = module.superModule;
module.exports = function (object, apiProduct, type) {
    base.call(this, object, apiProduct, type);

    Object.defineProperty(object, 'isReturnProhibited', {
        enumerable: true,
        value: (apiProduct.variationModel.selectedVariant) ? eswHelper.isReturnProhibited(apiProduct.variationModel.selectedVariant) : eswHelper.isReturnProhibited(apiProduct)
    });
};
