/* eslint-disable no-useless-escape */
/* eslint-disable no-alert */
/* eslint-disable consistent-return */
/* eslint-disable no-mixed-operators */
/* eslint-disable eqeqeq */
/* eslint-disable no-undef */
/* eslint-disable require-jsdoc */
'use strict';

function changeAjaxCall(dataObj) {
    $.ajax({
        type: 'get',
        url: Urls.selectors,
        data: dataObj,
        success: function () {
            if (dataObj.changeAddressAjax) {
                alert(Resources.SHIPPING_COUNTRY_CHANGE_MSG);
                window.location.href = Urls.cartShow;
            } else {
                location.reload();
            }
        }
    });
}

function setDefaultCurrency($selectedCurrency) {
    let $currencySelector = $('.esw-country-selector.selectCurrency .select-field');
    let $currencySelectorDropDown = $('.esw-country-selector.selectCurrency .select-field .current-country');
    let selectedCountry = $('#selected-country').attr('data-value');
    $.ajax({
        type: 'get',
        url: Urls.getDefaultCurrency,
        data: { country: selectedCountry },
        success: function (response) {
            if (response.success) {
                // Setting the default mapped currency
                $selectedCurrency.html(response.currency);
                $selectedCurrency.attr('data-value', response.currency);
                // Check if country is esw allowed country and not fixed price country
                if (response.isAllowed && !response.isFixedPriceCountry) {
                    // Yes, Enable Currency Selectors
                    $currencySelector.removeClass('disabled');
                    $currencySelectorDropDown.removeClass('disabled');
                } else {
                    // No, Disable Currency Selectors
                    $currencySelector.addClass('disabled');
                    $currencySelectorDropDown.addClass('disabled');
                }
            }
        }
    });
}

window.openEswCountrySwitcher = function (dataObj, selectedCountryParam) {
    $.ajax({
        type: 'get',
        url: Urls.getEswLandingPage,
        data: dataObj,
        success: function (response) {
            $('#navigation').prepend(response);
            if (selectedCountryParam && typeof selectedCountryParam !== 'undefined' && selectedCountryParam.length > 0) {
                $('.esw-country-selector .selector .country.landing-link[data-param="' + selectedCountryParam + '"]').trigger('click');
            } else {
                let $selectedCurrency = $('#selected-currency');
                if ($selectedCurrency.length > 0) {
                    setDefaultCurrency($selectedCurrency);
                }
            }
        }
    });
};

function updateCountryList() {
    $(document).on('click', '.btnCheckout', function (e) {
        e.preventDefault();
        $('.eshopworld-loader').removeClass('d-none');
        $('.btnCheckout').attr('disabled', 'disabled');
        let domain = $(this).attr('data-tld');
        $.ajax({
            type: 'get',
            url: Urls.preparePreOrderRequest,
            data: '',
            success: function (response) {
                if (response.eswAuthToken && response.eswAuthToken !== '') {
                  // Set cookie with 1 hour expiration
                    let expirationDate = new Date();
                    expirationDate.setTime(expirationDate.getTime() + (3600 * 1000)); // 1 hour
                    document.cookie = 'esw-shopper-access-token=' + response.eswAuthToken +
                                ';path=/;domain=' + domain +
                                ';expires=' + expirationDate.toUTCString() +
                                ';SameSite=None;Secure';
                } else {
                    document.cookie = 'esw-shopper-access-token=' + response.eswAuthToken +
                                ';path=/;domain=' + domain +
                                ';expires=expired' + 'SameSite=None;Secure';
                }
                window.open(response.redirectURL, '_self');
            }
        });
    });
    $(document).on('click', '.closeLandingPage', function () {
        $('.eswModal').hide();
        $('.modalBg').hide();
        let geoCountry = $('script#eswMattAutoOpen').attr('data-current-geo-location');
        window.localStorage.setItem('esw.GeoIpChangeIgnore', geoCountry);
    });
    $(document).on('click', '#continueButton', function () {
        let geoCountry = $('script#eswMattAutoOpen').attr('data-current-geo-location');
        window.localStorage.setItem('esw.GeoIpChangeIgnore', geoCountry);
    });

    // set currency first before reload
    $('body').on('click', '.esw-country-selector .selector a.landing-link', function (e) {
        e.preventDefault();
        let element = $(this).parents('.select-field');
        $(element).find('span').attr('data-value', $(this).attr('data-param'));
        $(element).find('.current-country .flag-icon').attr('class', 'flag-icon flag-icon-' + $(this).attr('data-param').toLowerCase());
        $(element).find('span').text($(this).text());
        $('.selector-active').removeClass('selector-active');
        $(this).parents('.active').removeClass('active');
    });

    // This function selects default currency based on the selected country.
    $('body').on('click', '.esw-country-selector .selector .country.landing-link', function () {
        let $selectedCurrency = $('#selected-currency');
        if ($selectedCurrency.length > 0) {
            setDefaultCurrency($selectedCurrency);
        }
    });

    $(document).on('click', '.esw-btn', function () {
        let dataObj = {
            country: $('#selected-country').attr('data-value'),
            currency: $('#selected-currency').attr('data-value'),
            language: $('#selected-locale').attr('data-value')
        };
        changeAjaxCall(dataObj);
    });

    $(document).on('change', '#dwfrm_singleshipping_shippingAddress_addressFields_country', function () {
        let country = { country: $('#dwfrm_singleshipping_shippingAddress_addressFields_country').val().toUpperCase() };
        $.ajax({
            type: 'get',
            url: Urls.getAllowedCountry,
            data: country,
            success: function (response) {
                if (response.success == false) {
                    return;
                }
                let dataObj = {
                    country: response.country,
                    currency: response.currency,
                    language: response.language,
                    changeAddressAjax: true
                };
                changeAjaxCall(dataObj);
            }
        });
    });

    $('.headerDropdown, .footerDropdown').click(function () {
        let dataObj = {
            dropDownSelection: 'true'
        };
        window.openEswCountrySwitcher(dataObj);
    });

    $(document).on('click', '.selected-link', function () {
        let dataObj = {
            country: $(this).attr('data-country'),
            currency: $(this).attr('data-currency'),
            language: $(this).attr('data-locale')
        };
        changeAjaxCall(dataObj);
    });

    $('body').on('click', '.esw-country-selector .current-country', function (e) {
        e.stopPropagation();
        let siblingSelector = $(this).siblings('.selector');
        siblingSelector.toggleClass('active');
        $(this).toggleClass('selector-active');
        $('.esw-country-selector .selector').not(siblingSelector).removeClass('active');
        $('.esw-country-selector .current-country').not(this).removeClass('selector-active');
    });

    $(document).on('click', function () {
        $('.esw-country-selector .selector').removeClass('active');
        $('.esw-country-selector .current-country').removeClass('selector-active');
    });
}

/*
 * applies rounding method as per the rounding model.
 */
function applyRoundingMethod(price, model, roundingModel, isFractionalPart) {
    let roundingMethod = model.split(/(\d+)/)[0];
    let roundedPrice;
    let fractionalPrice;
    if (roundingMethod.toLowerCase() == 'none') {
        if (isFractionalPart) {
            fractionalPrice = (price / 100) % 1;
            return fractionalPrice;
        }
        return price;
    }
    let roundingTarget = model.split(/(\d+)/)[1];
    let rTLength = roundingTarget.length;

    if (isFractionalPart) {
        // Truncate or make roundingTarget to only two digits for fractional part.
        roundingTarget = rTLength === 1 ? roundingTarget + '0' : roundingTarget.substring(0, 2);
        rTLength = roundingTarget.length;
    }

    if (roundingMethod.toLowerCase() == 'fixed') {
        let otherPart = price % Math.pow(10, rTLength);
        let priceWithoutOtherPart = price - otherPart;

        // Logic for fixed rounding method.
        if (roundingModel.direction.toLowerCase() == 'up') {
            roundedPrice = (roundingTarget < otherPart ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
        } else if (roundingModel.direction.toLowerCase() == 'down') {
            roundedPrice = (roundingTarget > otherPart ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
            roundedPrice = roundedPrice < 0 && !isFractionalPart ? price : roundedPrice;
        } else if (roundingModel.direction.toLowerCase() == 'nearest') {
            let roundedUp = (roundingTarget < otherPart ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
            let roundedDown = (roundingTarget > otherPart ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
            roundedDown = roundedDown < 0 && !isFractionalPart ? price : roundedDown;
            roundedPrice = Math.abs(roundedUp - price) >= Math.abs(price - roundedDown) ? roundedDown : roundedUp;
        }
    } else {
        // Logic for multiple rounding method.
        // eslint-disable-next-line no-lonely-if
        if (roundingModel.direction.toLowerCase() == 'up') {
            roundedPrice = Math.ceil(price / roundingTarget) * roundingTarget;
        } else if (roundingModel.direction.toLowerCase() == 'down') {
            roundedPrice = Math.floor(price / roundingTarget) * roundingTarget;
        } else if (roundingModel.direction == 'nearest') {
            // eslint-disable-next-line no-unused-expressions, no-sequences
            roundedUp = Math.ceil(price / roundingTarget) * roundingTarget,
                roundedDown = Math.floor(price / roundingTarget) * roundingTarget,
                roundedPrice = Math.abs(roundedUp - price) >= Math.abs(price - roundedDown) ? roundedDown : roundedUp;
        }
    }
    if (isFractionalPart) {
        return roundedPrice / Math.pow(10, rTLength);
    }
    return roundedPrice;
}

// function to apply rounding on the content static price conversion
function applyRoundingModel(price) {
    let roundingModel = window.ESWSitePreferences.ESW_SELECTED_ROUNDING ? JSON.parse(window.ESWSitePreferences.ESW_SELECTED_ROUNDING) : false;
    let roundedWholeNumber = 0;
    let roundedPrice = 0;
    if (!roundingModel || price === 0) {
        return price;
    }

    if (roundingModel) {
        // eslint-disable-next-line no-param-reassign
        price = price.toFixed(2);

        let wholeNumber = parseInt(price, 10);
        let model = roundingModel.model.split('.')[0];

        let fractionalPart = Math.round((price % 1) * 100);
        let fractionalModel = roundingModel.model.split('.')[1];

        // First, Apply rounding on the fractional part.
        let roundedFractionalPart = applyRoundingMethod(fractionalPart, fractionalModel, roundingModel, true);


        // Update the whole number based on the fractional part rounding.
        wholeNumber = parseInt(wholeNumber + roundedFractionalPart, 10);
        roundedFractionalPart = (wholeNumber + roundedFractionalPart) % 1;

        // then, Apply rounding on the whole number.
        roundedWholeNumber = applyRoundingMethod(wholeNumber, model, roundingModel, false);

        roundedPrice = roundedWholeNumber + roundedFractionalPart;

        return roundingModel.currencyExponent === 0 ? parseInt(roundedPrice, 10) : roundedPrice.toFixed(roundingModel.currencyExponent);
    }

    return price;
}

// function to convert static prices on the page.
function convertPrice() {
    let priceElements = $('.esw-price:not(.esw-price-converted)');
    let selectedCurrencySymbol = window.ESWSitePreferences.ESW_CURRENCY_SYMBOL;

    // Update price elements
    if (!window.ESWSitePreferences.ESW_FIXED_COUNTRY) {
        let selectedCountryAdjustment = window.ESWSitePreferences.ESW_SELECTED_COUNTRY_ADJUSTMENT ? JSON.parse(window.ESWSitePreferences.ESW_SELECTED_COUNTRY_ADJUSTMENT) : '';
        let selectedFxRate = window.ESWSitePreferences.ESW_SELECTED_FXRATE ? JSON.parse(window.ESWSitePreferences.ESW_SELECTED_FXRATE) : '';
        let enableRounding = window.ESWSitePreferences.ESW_ENABLE_ROUNDING;
        if (!selectedFxRate) {
            return false;
        }

        // Update price elements
        priceElements.each(function () {
            let element = $(this);
            let disableRounding = !!((element.attr('data-disable-rounding') && element.attr('data-disable-rounding') == 'true'));
            let disableAdjustment = !!((element.attr('data-disable-adjustments') && element.attr('data-disable-adjustments') == 'true'));
            let eswPrice = Number($.trim(element.text()).replace(/[^0-9.-]+/g, ''));
            if (selectedCountryAdjustment && !disableAdjustment) {
                // applying adjustment
                eswPrice += Number((selectedCountryAdjustment.retailerAdjustments.priceUpliftPercentage / 100 * eswPrice));
                // applying duty
                eswPrice += Number((selectedCountryAdjustment.estimatedRates.dutyPercentage / 100 * eswPrice));
                // applying tax
                eswPrice += Number((selectedCountryAdjustment.estimatedRates.taxPercentage / 100 * eswPrice));
                // apply feepercentage specific to PAv4
                if (selectedCountryAdjustment.estimatedRates.feePercentage) {
                    eswPrice += Number((selectedCountryAdjustment.estimatedRates.feePercentage / 100 * eswPrice));
                }
            }
            eswPrice = Number((eswPrice * selectedFxRate.rate).toFixed(2));
            if (!disableRounding && enableRounding) {
                eswPrice = applyRoundingModel(eswPrice);
            }
            element.text(selectedCurrencySymbol + eswPrice);
            element.addClass('esw-price-converted');
        });
    } else {
        priceElements.each(function () {
            let element = $(this);
         // eslint-disable-next-line no-shadow
            let selectedFxRate = window.SitePreferences.ESW_SELECTED_FXRATE ? JSON.parse(window.SitePreferences.ESW_SELECTED_FXRATE) : '';
            let eswPrice = Number($.trim(element.text()).replace(/[^0-9\.-]+/g, ''));
            if (selectedFxRate && element.text().indexOf(window.SitePreferences.ESW_CURRENCY_SYMBOL) == -1) {
                eswPrice = Number((eswPrice * selectedFxRate.rate).toFixed(2));
            }
            element.text(selectedCurrencySymbol + eswPrice);
            element.addClass('esw-price-converted');
        });
    }
}

/* * This function is used to get the last currency and amount from the string.
 * It uses a regular expression to match the pattern of currency and amount.
 * The function returns the last matched currency and amount as a string.
 * @param {string} inputString - The input string containing currency and amount - example: "€95.10€95.1€95.10€95.1"
 * @returns {string|null} - The last matched currency and amount or null if no match is found.
 */
function getLastCurrencyAndAmount(inputString) {
    let regex = /([^\d.\s]*?)(\d+\.\d)0?/g;
    let finalresult = null;
    let matches = Array.from(inputString.matchAll(regex));
    if (matches.length > 0) {
        let lastMatchObject = matches[matches.length - 1];
        finalresult = lastMatchObject[1] + lastMatchObject[2];
    }
    return finalresult;
}


function formatPrice(priceElement) {
    if (!priceElement || !priceElement.jquery || !priceElement[0]) {
        return '';
    }
    let price = $.trim(priceElement.text());
    let finalFormattedPrice = price.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
    return getLastCurrencyAndAmount(finalFormattedPrice);
}


function currencyDisplayFormatting() {
    let selectedCountryAdjustment = window.ESWSitePreferences.ESW_SELECTED_COUNTRY_ADJUSTMENT ? JSON.parse(window.ESWSitePreferences.ESW_SELECTED_COUNTRY_ADJUSTMENT) : '';
    let showTrailingZero = selectedCountryAdjustment && selectedCountryAdjustment.currencyDisplay ? selectedCountryAdjustment.currencyDisplay.showTrailingZeros : true;
    if (showTrailingZero) {
        return;
    }
    $('.product-sales-price').each(function () {
            // If there are no .value children, format the current element
        let formatted = formatPrice($(this));
        $(this).text(formatted);
    });

    $('.price-sales').each(function () {
        // If there are no .value children, format the current element
        let formatted = formatPrice($(this));
        $(this).text(formatted);
    });
    $('.order-shipping td:nth-child(2)').text(formatPrice($('.order-shipping td:nth-child(2)')));
    $('.order-subtotal td:nth-child(2)').text(formatPrice($('.order-subtotal td:nth-child(2)')));
    $('.mini-cart-subtotals .value').text(formatPrice($('.mini-cart-subtotals .value')));
    $('.mini-cart-price').text(formatPrice($('.mini-cart-price')));
    $('.price-total').text(formatPrice($('.price-total')));
    $('.order-value').text(formatPrice($('.order-value')));
    $('.price-unadjusted > span').text(formatPrice($('.price-unadjusted > span')));
    $('.price-adjusted-total > span').text(formatPrice($('.price-adjusted-total > span')));
}

$(document).ready(function () {
    updateCountryList();
    if ($('.eswModal').length > 0) {
        // Logic to enable/disable welcome matt currency dropdowns
        let $selectedCurrency = $('#selected-currency');
        setDefaultCurrency($selectedCurrency);
    }
    currencyDisplayFormatting();
    $(document).ajaxComplete(function () {
        currencyDisplayFormatting();
    });
    if (typeof window.ESWSitePreferences !== 'undefined' && window.ESWSitePreferences.ESW_ENABLE_PRICECONVERSION) {
        convertPrice();
        $(document).ajaxComplete(function () {
            convertPrice();
        });
    }
    $('body').on('click', '.formbuttonrow button', function () {
        $('.formbuttonrow button').prop('disabled', true);
    });

    // Mini cart update in case of trailing zero
    const $miniCart = $('#mini-cart');
    if (!$miniCart.length) {
        return;
    }

    const observer = new MutationObserver(function (mutationsList, observerInstance) {
        // Check current state using jQuery within the observer callback
        currencyDisplayFormatting();

        // Disonnect the observer to prevent re-triggering
        // This is important to avoid infinite loops
        observer.disconnect();
        // Reconnect the observer after processing
        setTimeout(function () {
            observerInstance.observe($miniCart[0], {
                childList: true,
                subtree: true
            });
        }, 1000);
    });

    // Start observing the raw DOM element (jQuery objects are wrappers)
    observer.observe($miniCart[0], {
        childList: true,
        subtree: true
    });
});
