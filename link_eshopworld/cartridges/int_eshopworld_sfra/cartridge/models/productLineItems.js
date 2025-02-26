'use strict';

const base = module.superModule;

const BasketMgr = require('dw/order/BasketMgr');

const collections = require('*/cartridge/scripts/util/collections');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

/**
 * @constructor
 * @classdesc class that represents a collection of line items and total quantity of
 * items in current basket or per shipment
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function ProductLineItems(productLineItems, view) {
    base.call(this, productLineItems, view);
    let currentBasket = BasketMgr.getCurrentBasket();
    if (!empty(currentBasket) && eswCoreHelper.isEnabledMultiOrigin() && productLineItems) {
        let modifiedPlis = [];
        let basketProductLineItems = currentBasket.productLineItems;
        let plis = this.items;
        for (let i = 0; i < plis.length; i++) {
            let pli = plis[i];
            collections.forEach(basketProductLineItems, function (basketPli) {
                if (basketPli.UUID === pli.UUID) {
                    pli.eswOriginIso = basketPli.custom.eswFulfilmentCountryIso;
                }
            });
            modifiedPlis.push(pli);
        }
        this.items = modifiedPlis;
    }
}

ProductLineItems.getTotalQuantity = base.getTotalQuantity;
module.exports = ProductLineItems;
