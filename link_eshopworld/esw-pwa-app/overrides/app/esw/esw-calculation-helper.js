/* eslint-disable eqeqeq */

import {getEswShopperCurrencyConfigByKey} from './esw-helpers'

const applyRoundingMethod = (price, model, roundingModel, isFractionalPart) => {
    let roundingMethod = model.split(/(\d+)/)[0]
    let roundedPrice
    let fractionalPrice
    let roundedUp
    let roundedDown
    if (roundingMethod.toLowerCase() == 'none') {
        if (isFractionalPart) {
            fractionalPrice = (price / 100) % 1
            return fractionalPrice
        }
        return price
    }
    let roundingTarget = model.split(/(\d+)/)[1]
    let rTLength = roundingTarget.length

    if (isFractionalPart) {
        // Truncate or make roundingTarget to only two digits for fractional part.
        roundingTarget = rTLength === 1 ? roundingTarget + '0' : roundingTarget.substring(0, 2)
        rTLength = roundingTarget.length
    }

    if (roundingMethod.toLowerCase() == 'fixed') {
        let otherPart = price % Math.pow(10, rTLength)
        let priceWithoutOtherPart = price - otherPart

        // Logic for fixed rounding method.
        if (roundingModel.direction.toLowerCase() == 'up') {
            roundedPrice =
                (roundingTarget < otherPart
                    ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength)
                    : priceWithoutOtherPart) + Number(roundingTarget)
        } else if (roundingModel.direction.toLowerCase() == 'down') {
            roundedPrice =
                (roundingTarget > otherPart
                    ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength)
                    : priceWithoutOtherPart) + Number(roundingTarget)
            roundedPrice = roundedPrice < 0 && !isFractionalPart ? price : roundedPrice
        } else if (roundingModel.direction.toLowerCase() == 'nearest') {
            roundedUp =
                (roundingTarget < otherPart
                    ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength)
                    : priceWithoutOtherPart) + Number(roundingTarget)
            roundedDown =
                (roundingTarget > otherPart
                    ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength)
                    : priceWithoutOtherPart) + Number(roundingTarget)
            roundedDown = roundedDown < 0 && !isFractionalPart ? price : roundedDown
            roundedPrice =
                Math.abs(roundedUp - price) >= Math.abs(price - roundedDown)
                    ? roundedDown
                    : roundedUp
        }
    } else {
        // Logic for multiple rounding method.
        // eslint-disable-next-line no-lonely-if
        if (roundingModel.direction.toLowerCase() == 'up') {
            roundedPrice = Math.ceil(price / roundingTarget) * roundingTarget
        } else if (roundingModel.direction.toLowerCase() == 'down') {
            roundedPrice = Math.floor(price / roundingTarget) * roundingTarget
        } else if (roundingModel.direction.toLowerCase() == 'nearest') {
            // eslint-disable-next-line no-unused-expressions, no-sequences
            ;(roundedUp = Math.ceil(price / roundingTarget) * roundingTarget),
                (roundedDown = Math.floor(price / roundingTarget) * roundingTarget),
                (roundedPrice =
                    Math.abs(roundedUp - price) >= Math.abs(price - roundedDown)
                        ? roundedDown
                        : roundedUp)
        }
    }
    if (isFractionalPart) {
        return roundedPrice / Math.pow(10, rTLength)
    }
    return roundedPrice
}

const applyRoundingModel = (price, roundingModel) => {
    let roundedWholeNumber = 0
    let roundedPrice = 0
    if (!roundingModel || roundingModel.length === 0 || price === 0) {
        return price
    }
    if (roundingModel) {
        let wholeNumber = parseInt(price, 10)
        let model = roundingModel.model.split('.')[0]
        let fractionalPart = Math.round((price % 1) * 100)
        let fractionalModel = roundingModel.model.split('.')[1]
        // First, Apply rounding on the fractional part.
        let roundedFractionalPart = applyRoundingMethod(
            fractionalPart,
            fractionalModel,
            roundingModel,
            true
        )
        // Update the whole number based on the fractional part rounding.
        wholeNumber = parseInt(wholeNumber + roundedFractionalPart, 10)
        roundedFractionalPart = (wholeNumber + roundedFractionalPart) % 1
        // then, Apply rounding on the whole number.
        roundedWholeNumber = applyRoundingMethod(wholeNumber, model, roundingModel, false)
        roundedPrice = roundedWholeNumber + roundedFractionalPart
        return roundingModel.currencyExponent === 0
            ? parseInt(roundedPrice, 10)
            : roundedPrice.toFixed(roundingModel.currencyExponent)
    }
    return price
}

export const convertPrice = () => {
    let priceElements = document.querySelectorAll('span.esw-price:not(.esw-price-converted)')
    let selectedCurrencySymbol = getEswShopperCurrencyConfigByKey('symbol')
    let isFixedPriceModel = getEswShopperCurrencyConfigByKey('isFixedPriceModel')
    let selectedFxRate = parseFloat(getEswShopperCurrencyConfigByKey('fxRate'))

    if (!isFixedPriceModel) {
        let selectedCountryAdjustment = getEswShopperCurrencyConfigByKey('countryAdjustments')
        let roundingModel = getEswShopperCurrencyConfigByKey('roundingModel')

        if (!selectedFxRate || selectedFxRate.length === 0) {
            return false
        }
        priceElements.forEach(function (element) {
            let eleRoundingAttr = element.getAttribute('data-disable-rounding')
            // eslint-disable-next-line no-unneeded-ternary
            let disableRounding = eleRoundingAttr && eleRoundingAttr == 'false' ? true : false
            let eleAdjustmentAttr = element.getAttribute('data-disable-adjustment')
            // eslint-disable-next-line no-unneeded-ternary
            let disableAdjustment = eleAdjustmentAttr && eleAdjustmentAttr == 'false' ? true : false
            let eswPrice = parseFloat(element.textContent.replace(/[^0-9.-]+/g, ''))
            if (selectedCountryAdjustment && !disableAdjustment) {
                eswPrice +=
                    (selectedCountryAdjustment.retailerAdjustments.priceUpliftPercentage / 100) *
                    eswPrice
                eswPrice +=
                    (selectedCountryAdjustment.estimatedRates.dutyPercentage / 100) * eswPrice
                eswPrice +=
                    (selectedCountryAdjustment.estimatedRates.taxPercentage / 100) * eswPrice

                if (selectedCountryAdjustment.estimatedRates.feePercentage) {
                    eswPrice +=
                        (selectedCountryAdjustment.estimatedRates.feePercentage / 100) * eswPrice
                }
            }

            eswPrice = Number(eswPrice * selectedFxRate)

            if (!disableRounding) {
                eswPrice = applyRoundingModel(eswPrice, roundingModel)
            }

            element.textContent = selectedCurrencySymbol + Number(eswPrice).toFixed(2)
            element.classList.add('esw-price-converted')
        })
    } else {
        priceElements.forEach(function (element) {
            let eswPrice = element.textContent.replace(/[^0-9.-]+/g, '')
            element.textContent = selectedCurrencySymbol + eswPrice
            element.classList.add('esw-price-converted')
        })
    }
    return false
}
