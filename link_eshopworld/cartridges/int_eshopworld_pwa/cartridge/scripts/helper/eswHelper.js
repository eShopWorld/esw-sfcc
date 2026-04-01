/**
 * Helper script to get all ESW site preferences
 **/

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Transaction = require('dw/system/Transaction');

/*
 * Function that is used to set the pricebook and update session currency
 */
eswHelper.setBaseCurrencyPriceBook = function (req, currencyCode) {
    let Currency = require('dw/util/Currency');
    let BasketMgr = require('dw/order/BasketMgr');
    let HookMgr = require('dw/system/HookMgr');
    let currentBasket = BasketMgr.getCurrentOrNewBasket();
    let currency = Currency.getCurrency(currencyCode);

    Transaction.wrap(function () {
        req.session.setCurrency(currency);
        currentBasket.updateCurrency();
        HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
    });
};

module.exports = {
    getEswHelper: function () {
        return eswHelper;
    }
};
