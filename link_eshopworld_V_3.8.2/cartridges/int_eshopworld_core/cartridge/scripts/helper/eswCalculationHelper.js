/* eslint-disable no-undef */
/* eslint-disable block-scoped-var */
/* eslint-disable no-mixed-operators */
/**
 * Helper script to get all ESW site preferences
 **/
const formatMoney = require('dw/util/StringUtils').formatMoney;
const Money = require('dw/value/Money');

const logger = require('dw/system/Logger');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();


const getEswCalculationHelper = {
    /*
     * Function to perform fxrate calculations, apply adjustments, duty and tax and returns money object
     */
    // eslint-disable-next-line consistent-return
    getMoneyObject: function (price, noAdjustment, formatted, noRounding, selectedCountryInfoObjParam) {
        let selectedCountryInfo = !empty(selectedCountryInfoObjParam) ? selectedCountryInfoObjParam : null;
        if (!eswHelper.getEShopWorldModuleEnabled()) {
            return price;
        }
        try {
            let baseCurrency = eswHelper.getBaseCurrencyPreference(),
                billingPrice = (typeof price === 'object') ? Number(price.value) : Number(price),
                selectedCountry = !empty(selectedCountryInfo) ? selectedCountryInfo.selectedCountry : eswHelper.getAvailableCountry(),
                selectedFxRate = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate) : false,
                selectedCountryDetail = eswHelper.getSelectedCountryDetail(selectedCountry),
                selectedCountryAdjustment = !empty(session.privacy.countryAdjustment) ? JSON.parse(session.privacy.countryAdjustment) : '';

            if (!empty(selectedCountryInfo)) {
                selectedFxRate = selectedCountryInfo.selectedFxRate;
                selectedCountryAdjustment = selectedCountryInfo.selectedCountryAdjustments;
            }

            // Checking if selected country is set as a fixed price country
            let isFixedPriceCountry = selectedCountryDetail.isFixedPriceModel;

            // if fxRate is empty, return the price without applying any calculations
            if (!selectedFxRate || empty(selectedFxRate.toShopperCurrencyIso) || !selectedCountryDetail.isSupportedByESW) {
                return (formatted == null) ? formatMoney(new Money(billingPrice, session.getCurrency().currencyCode)) : new Money(billingPrice, session.getCurrency().currencyCode);
            }

            // applying override price if override pricebook is set
            billingPrice = Number(eswHelper.applyOverridePrice(billingPrice, selectedCountry));
            // fixed price countries will not have adjustment, duty and taxes applied
            if (!noAdjustment) {
                if (!isFixedPriceCountry && selectedCountryAdjustment && !empty(selectedCountryAdjustment)) {
                    // applying adjustment
                    billingPrice += Number((selectedCountryAdjustment.retailerAdjustments.priceUpliftPercentage / 100 * billingPrice));
                    // applying duty
                    billingPrice += Number((selectedCountryAdjustment.estimatedRates.dutyPercentage / 100 * billingPrice));
                    // applying tax
                    billingPrice += Number((selectedCountryAdjustment.estimatedRates.taxPercentage / 100 * billingPrice));
                }
            }
            // applying FX rate if currency is not same as base currency
            if (selectedFxRate.toShopperCurrencyIso !== baseCurrency) {
                if (selectedFxRate && !empty(selectedFxRate)) {
                    billingPrice = Number((billingPrice * selectedFxRate.rate).toFixed(2));
                }
            }
            // applying the rounding model
            if (eswHelper.isEswRoundingsEnabled() && billingPrice > 0 && !noRounding && !isFixedPriceCountry) {
                billingPrice = eswHelper.applyRoundingModel(billingPrice, false);
            }
            billingPrice = new Money(billingPrice, selectedFxRate.toShopperCurrencyIso);
            return (formatted == null) ? formatMoney(billingPrice) : billingPrice;
        } catch (e) {
            logger.error('Error converting price {0} {1}', e.message, e.stack);
        }
        return typeof billingPrice !== 'undefined' ? billingPrice : null;
    },
    /*
     * This function is used to get total of cart or productlineitems based on input
     */
    getSubtotalObject: function (cart, isCart, listPrice, unitPrice) {
        try {
            let total = 0;
            if (isCart) {
                let productLineItems = cart.getProductLineItems();
                // eslint-disable-next-line guard-for-in, no-restricted-syntax
                for (let productLineItem in productLineItems) {
                    total += eswHelper.getSubtotalObject(productLineItems[productLineItem], false);
                }
            } else {
                let cartBasePrice = 0;
                if (!empty(cart.optionProductLineItems)) {
                    // eslint-disable-next-line guard-for-in, no-restricted-syntax
                    for (let option in cart.optionProductLineItems) {
                        cartBasePrice += cart.optionProductLineItems[option].adjustedNetPrice.value;
                    }
                }
                cartBasePrice += cart.basePrice.value;
                total = eswHelper.getMoneyObject(cartBasePrice, false, false).value * cart.quantity.value;
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
                            if (!empty(cart.optionProductLineItems)) {
                                // eslint-disable-next-line guard-for-in, no-restricted-syntax
                                for (let option in cart.optionProductLineItems) {
                                    total += cart.optionProductLineItems[option].adjustedNetPrice.value;
                                }
                            }
                        } else {
                            let adjustedUnitPrice = eswHelper.getMoneyObject(adjustment.price, false, false, false).value;
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
            return false;
        }
    }
};

module.exports = {
    getEswCalculationHelper: getEswCalculationHelper
};
