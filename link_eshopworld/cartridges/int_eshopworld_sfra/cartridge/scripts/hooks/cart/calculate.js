/* eslint-disable */
'use strict';

/** @module calculate */
/**
 * This javascript file implements methods (via Common.js exports) that are needed by
 * the new (smaller) CalculateCart.ds script file.  This allows OCAPI calls to reference
 * these tools via the OCAPI 'hook' mechanism
 */

const HashMap = require('dw/util/HashMap');
const PromotionMgr = require('dw/campaign/PromotionMgr');
const ShippingMgr = require('dw/order/ShippingMgr');
const ShippingLocation = require('dw/order/ShippingLocation');
const TaxMgr = require('dw/order/TaxMgr');
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const HookMgr = require('dw/system/HookMgr');
const collections = require('*/cartridge/scripts/util/collections');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * @function calculate
 *
 * calculate is the arching logic for computing the value of a basket.  It makes
 * calls into cart/calculate.js and enables both SG and OCAPI applications to share
 * the same cart calculation logic.
 *
 * @param {object} basket The basket to be calculated
 */
exports.calculate = function (basket, isESWOrderCalculate, currentMethodID) {
    // ===================================================
    // =====   CALCULATE PRODUCT LINE ITEM PRICES    =====
    // ===================================================

    if (!isESWOrderCalculate) {
        calculateProductPrices(basket);
    }

    // ===================================================
    // =====    CALCULATE GIFT CERTIFICATE PRICES    =====
    // ===================================================
    if (!isESWOrderCalculate) {
        calculateGiftCertificatePrices(basket);
    }

    // ===================================================
    // =====   Note: Promotions must be applied      =====
    // =====   after the tax calculation for         =====
    // =====   storefronts based on GROSS prices     =====
    // ===================================================

    // ===================================================
    // =====   APPLY PROMOTION DISCOUNTS			 =====
    // =====   Apply product and order promotions.   =====
    // =====   Must be done before shipping 		 =====
    // =====   calculation. 					     =====
    // ===================================================
    if (!isESWOrderCalculate) {
        eswHelper.adjustThresholdDiscounts(basket);
        eswHelper.removeThresholdPromo(basket);
        PromotionMgr.applyDiscounts(basket);
    }

    // ===================================================
    // =====        CALCULATE SHIPPING COSTS         =====
    // ===================================================

    // apply product specific shipping costs
    // and calculate total shipping costs
    HookMgr.callHook('dw.order.calculateShipping', 'calculateShipping', basket);

    // ===================================================
    // =====   APPLY PROMOTION DISCOUNTS			 =====
    // =====   Apply product and order and 			 =====
    // =====   shipping promotions.                  =====
    // ===================================================
    if (!eswHelper.getEShopWorldModuleEnabled() || !isESWOrderCalculate  || !eswHelper.isDeliveryDiscountBasedOnCoupon(basket, currentMethodID) ) {
        PromotionMgr.applyDiscounts(basket);
        if (isESWOrderCalculate) {
            eswHelper.removeCouponsIfNoPromotions(basket);
        }
    }

    // since we might have bonus product line items, we need to
    // reset product prices
    if (!isESWOrderCalculate) {
        calculateProductPrices(basket);
    }

    // ===================================================
    // =====         CALCULATE TAX                   =====
    // ===================================================
        HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);
    // ===================================================
    // =====         CALCULATE BASKET TOTALS         =====
    // ===================================================
        basket.updateTotals();
    // ===================================================
    // =====            DONE                         =====
    // ===================================================

    return new Status(Status.OK);
};

/**
 * @function calculateProductPrices
 *
 * Calculates product prices based on line item quantities. Set calculates prices
 * on the product line items.  This updates the basket and returns nothing
 *
 * @param {object} basket The basket containing the elements to be computed
 */
function calculateProductPrices (basket) {
    // get total quantities for all products contained in the basket
    let productQuantities = basket.getProductQuantities();
    let productQuantitiesIt = productQuantities.keySet().iterator();

    // get product prices for the accumulated product quantities
    let productPrices = new HashMap();

    while (productQuantitiesIt.hasNext()) {
        let prod = productQuantitiesIt.next();
        let quantity = productQuantities.get(prod);
        productPrices.put(prod, prod.priceModel.getPrice(quantity));
    }

    // iterate all product line items of the basket and set prices
    let productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        let productLineItem = productLineItems.next();

        // handle non-catalog products
        if (!productLineItem.catalogProduct) {
            productLineItem.setPriceValue(productLineItem.basePrice.valueOrNull);
            continue;
        }

        let product = productLineItem.product;

        // handle option line items
        if (productLineItem.optionProductLineItem) {
            // for bonus option line items, we do not update the price
            // the price is set to 0.0 by the promotion engine
            if (!productLineItem.bonusProductLineItem) {
                productLineItem.updateOptionPrice();
            }
        // handle bundle line items, but only if they're not a bonus
        } else if (productLineItem.bundledProductLineItem) {
            // no price is set for bundled product line items
        // handle bonus line items
        // the promotion engine set the price of a bonus product to 0.0
        // we update this price here to the actual product price just to
        // provide the total customer savings in the storefront
        // we have to update the product price as well as the bonus adjustment
        } else if (productLineItem.bonusProductLineItem && product !== null) {
            let price = product.priceModel.price;
            let adjustedPrice = productLineItem.adjustedPrice;
            productLineItem.setPriceValue(price.valueOrNull);
            // get the product quantity
            let quantity2 = productLineItem.quantity;
            // we assume that a bonus line item has only one price adjustment
            let adjustments = productLineItem.priceAdjustments;
            if (!adjustments.isEmpty()) {
                let adjustment = adjustments.iterator().next();
                let adjustmentPrice = price.multiply(quantity2.value).multiply(-1.0).add(adjustedPrice);
                adjustment.setPriceValue(adjustmentPrice.valueOrNull);
            }


        // set the product price. Updates the 'basePrice' of the product line item,
        // and either the 'netPrice' or the 'grossPrice' based on the current taxation
        // policy

        // handle product line items unrelated to product
        } else if (product === null) {
            productLineItem.setPriceValue(null);
        // handle normal product line items
        } else {
            productLineItem.setPriceValue(productPrices.get(product).valueOrNull);
        }
    }
}

/**
 * @function calculateGiftCertificates
 *
 * Function sets either the net or gross price attribute of all gift certificate
 * line items of the basket by using the gift certificate base price. It updates the basket in place.
 *
 * @param {object} basket The basket containing the gift certificates
 */
function calculateGiftCertificatePrices (basket) {
    let giftCertificates = basket.getGiftCertificateLineItems().iterator();
    while (giftCertificates.hasNext()) {
        let giftCertificate = giftCertificates.next();
        giftCertificate.setPriceValue(giftCertificate.basePrice.valueOrNull);
    }
}

exports.calculateShipping = function(basket) {
    ShippingMgr.applyShippingCost(basket);
    return new Status(Status.OK);
}

/**
 * @function calculateTax <p>
 *
 * Determines tax rates for all line items of the basket. Uses the shipping addresses
 * associated with the basket shipments to determine the appropriate tax jurisdiction.
 * Uses the tax class assigned to products and shipping methods to lookup tax rates. <p>
 *
 * Sets the tax-related fields of the line items. <p>
 *
 * Handles gift certificates, which aren't taxable. <p>
 *
 * Note that the function implements a fallback to the default tax jurisdiction
 * if no other jurisdiction matches the specified shipping location/shipping address.<p>
 *
 * Note that the function implements a fallback to the default tax class if a
 * product or a shipping method does explicitly define a tax class.
 *
 * @param {dw.order.Basket} basket The basket containing the elements for which taxes need to be calculated
 */
exports.calculateTax = function(basket) {
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    let taxes = basketCalculationHelpers.calculateTaxes(basket);

    // convert taxes into hashmap for performance.
    let taxesMap = {};

    taxes.taxes.forEach(function (item) {
        taxesMap[item.uuid] = { value: item.value, amount: item.amount };
    });

    let lineItems = basket.getAllLineItems();

    let totalShippingGrossPrice = 0;
    let totalShippingNetPrice = 0;

    let containsGlobalPriceAdjustments = false;

    // update taxes for all line items
    collections.forEach(lineItems, function (lineItem) {
        let tax = taxesMap[lineItem.UUID];

        if (tax) {
            if (tax.amount) {
                lineItem.updateTaxAmount(tax.value);
                if (lineItem instanceof dw.order.ShippingLineItem) {
                    totalShippingGrossPrice += lineItem.getAdjustedGrossPrice();
                    totalShippingNetPrice += lineItem.getAdjustedNetPrice();
                }
            } else {
                lineItem.updateTax(tax.value);
            }
        } else {
            if (lineItem.taxClassID === TaxMgr.customRateTaxClassID) {
                // do not touch tax rate for fix rate items
                lineItem.updateTax(lineItem.taxRate);
            } else {
                // otherwise reset taxes to null
                lineItem.updateTax(null);
            }
        }
    });

    // besides shipment line items, we need to calculate tax for possible order-level price adjustments
    // this includes order-level shipping price adjustments
    if (!basket.getPriceAdjustments().empty || !basket.getShippingPriceAdjustments().empty) {
        if (collections.first(basket.getPriceAdjustments(), function (priceAdjustment) {
            return taxesMap[priceAdjustment.UUID] === null;
        }) || collections.first(basket.getShippingPriceAdjustments(), function (shippingPriceAdjustment) {
            return taxesMap[shippingPriceAdjustment.UUID] === null;
        })) {
            // tax hook didn't provide taxes for global price adjustment, we need to calculate them ourselves.
            // calculate a mix tax rate from
            let basketPriceAdjustmentsTaxRate = ((basket.getMerchandizeTotalGrossPrice().value + basket.getShippingTotalGrossPrice().value)
                / (basket.getMerchandizeTotalNetPrice().value + basket.getShippingTotalNetPrice())) - 1;

                let basketPriceAdjustments = basket.getPriceAdjustments();
                collections.forEach(basketPriceAdjustments, function (basketPriceAdjustment) {
                    basketPriceAdjustment.updateTax(basketPriceAdjustmentsTaxRate);
                });

                let basketShippingPriceAdjustments = basket.getShippingPriceAdjustments();
                collections.forEach(basketShippingPriceAdjustments, function(basketShippingPriceAdjustment) {
                    basketShippingPriceAdjustment.updateTax(totalShippingGrossPrice/totalShippingNetPrice - 1);
                });
            }
    }

    // if hook returned custom properties attach them to the order model
    if (taxes.custom) {
        Object.keys(taxes.custom).forEach(function (key) {
            basket.custom[key] = taxes.custom[key];
        });
    }

    return new Status(Status.OK);
}
