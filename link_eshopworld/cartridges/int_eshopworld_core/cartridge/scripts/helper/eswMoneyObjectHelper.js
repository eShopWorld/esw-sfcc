/* eslint-disable no-undef */
/* eslint-disable no-mixed-operators */
/**
 * Helper script to get all ESW site preferences
 **/
const Money = require('dw/value/Money');

const logger = require('dw/system/Logger');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;


const getEswMoneyHelper = {
    /*
     * Function to perform fxrate calculations, apply adjustments, duty and tax and returns money object
     */
    // eslint-disable-next-line consistent-return
    getMoneyObject: function (price, noAdjustment, formatted, noRounding, selectedCountryInfoObjParam) {
        let eswCalculationHelper = require('*/cartridge/scripts/helper/eswCalculationHelper').getEswCalculationHelper;
        return eswCalculationHelper.getMoneyObject(price, noAdjustment, formatted, noRounding, selectedCountryInfoObjParam);
    },
    /*
     * This function is used to get total of cart or productlineitems based on input
     */
    getSubtotalObject: function (cart, isCart, listPrice, unitPrice) {
        try {
            let total = 0;
            if (isCart) {
                let productLineItems = cart.getAllProductLineItems();
                // eslint-disable-next-line guard-for-in, no-restricted-syntax
                for (let productLineItem in productLineItems) {
                    total += this.getSubtotalObject(productLineItems[productLineItem], false);
                }
            } else {
                total = eswHelper.getMoneyObject(cart.basePrice.value, false, false).value * cart.quantity.value;
                if (listPrice) {
                    if (unitPrice) {
                        total /= cart.quantity.value;
                    }
                    return new dw.value.Money(total, request.httpCookies['esw.currency'].value);
                }
                let that = eswHelper;
                if (cart.getAdjustedPrice().getValue() > 0) {
                    cart.priceAdjustments.toArray().forEach(function (adjustment) {
                        if (adjustment.promotion && that.isThresholdEnabled(adjustment.promotion)) {
                            return;
                        }
                        if (adjustment.appliedDiscount.type === dw.campaign.Discount.TYPE_FIXED_PRICE) {
                            total = that.getMoneyObject(adjustment.appliedDiscount.fixedPrice, false, false).value * adjustment.quantity;
                            if (adjustment.quantity < cart.quantity.value) {
                                total += (cart.quantity.value - adjustment.quantity) * that.getMoneyObject(cart.basePrice.value, false, false).value;
                            }
                        } else {
                            let adjustedUnitPrice = this.getMoneyObject(adjustment.price, false, false, false).value;
                            total -= (adjustedUnitPrice) * -1;
                        }
                    });
                } else {
                    total = 0;
                }
            }
            if (unitPrice) {
                total /= cart.quantity.value;
            }
            return new Money(total, request.httpCookies['esw.currency'].value);
        } catch (error) {
            logger.error('Error in getting subtotal price {0} {1}', error.message, error.stack);
        }
        return total;
    }
};

module.exports = {
    getEswMoneyHelper: getEswMoneyHelper
};
