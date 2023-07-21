/* eslint-disable no-useless-escape */
/* eslint-disable eqeqeq */
/* eslint-disable no-mixed-operators */
'use strict';

/**
 * Change ajax call
 * @param {Object} dataObj - Data object
 */
function changeAjaxCall(dataObj) {
    $.ajax({
        type: 'get',
        url: dataObj.url,
        data: dataObj,
        success: function (response) {
            if (dataObj.changeAddressAjax) {
                // eslint-disable-next-line no-alert
                alert(dataObj.successMsg);
                window.location.href = dataObj.redirect;
            } else {
                window.location.href = response.redirectUrl;
            }
        }
    });
}

/**
 * Set Default Country
 * @param {Object} $selectedCurrency - Selected country
 */
function setDefaultCurrency($selectedCurrency) {
    let $currencySelector = $('.esw-country-selector.selectCurrency .select-field');
    let $currencySelectorDropDown = $('.esw-country-selector.selectCurrency .select-field .current-country');
    let $selectedCountry = $('#selected-country');
    let selectedCountry = $selectedCountry.attr('data-value');
    let urlGetDefaultCurrency = $selectedCountry.attr('data-url');

    $.ajax({
        type: 'get',
        url: urlGetDefaultCurrency,
        data: {
            country: selectedCountry
        },
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

/**
 * Open country switcher
 * @param {Object} dataObj - Data object
 */
function openEswCountrySwitcher(dataObj) {
    $.ajax({
        type: 'get',
        url: dataObj.eswLandingPageUrl,
        data: dataObj,
        success: function (response) {
            $('header').prepend(response);
            let $selectedCurrency = $('#selected-currency');

            if ($selectedCurrency.length > 0) {
                setDefaultCurrency($selectedCurrency);
            }
        }
    });
}

/**
 * Updat country list
 */
function updateCountryList() {
    $(document).on('click', '.btnCheckout', function (e) {
        e.preventDefault();
        $('.eshopworld-loader').removeClass('d-none');
        $('.btnCheckout').addClass('disabled');
        $.ajax({
            type: 'get',
            url: $(this).attr('data-url'),
            data: '',
            success: function (response) {
                window.open(response.redirectURL, '_self');
            }
        });
    });

    $(document).on('click', '.closeLandingPage', function () {
        $('.eswModal').hide();
        $('.modalBg').hide();
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

	// This function selects default currency based on the selected country.
    $('body').on('click', '.esw-country-selector .selector .country.landing-link', function () {
        let $selectedCurrency = $('#selected-currency');
        let $selectedCountry = $('#selected-country');
        let selectedCountry = $selectedCountry.attr('data-value');

        let dataUrl = $selectedCountry.attr('data-url');

        if ($selectedCurrency.length > 0) {
            $.ajax({
                type: 'get',
                url: dataUrl,
                data: {
                    country: selectedCountry
                },
                success: function (response) {
                    if (response.success) {
                        $selectedCurrency.html(response.currency);
                        $selectedCurrency.attr('data-value', response.currency);
                    }
                }
            });
        }
    });

    $(document).on('click', '.esw-btn', function () {
        let country = $('#selected-country').attr('data-value');
        let currency = $('#selected-currency').attr('data-value');
        let language = $('#selected-locale').attr('data-value');

        if (country) {
            if (!currency) {
                currency = $('#selected-country').closest('.select-field').find('.country a:first').attr('data-currency');
            }
            if (!language) {
                language = $('#selected-country').closest('.select-field').find('.country a:first').attr('data-locale');
            }
        } else if (language) {
            if (!currency) {
                currency = $('#selected-locale').closest('.select-field').find('.country a:first').attr('data-currency');
            }
            if (!country) {
                country = $('#selected-locale').closest('.select-field').find('.country a:first').attr('data-country');
            }
        } else if (currency) {
            if (!country) {
                country = $('#selected-currency').closest('.select-field').find('.country a:first').attr('data-currency');
            }
            if (!language) {
                language = $('#selected-currency').closest('.select-field').find('.country a:first').attr('data-locale');
            }
        }
        let dataObj = {
            country: country,
            currency: currency,
            language: language,
            url: $(this).attr('data-url'),
            action: 'Home-Show'
        };
        changeAjaxCall(dataObj);
    });

    $('.headerDropdown, .footerDropdown').click(function () {
        let eswLandingPageUrl = $(this).attr('data-url');
        let dataObj = {
            eswLandingPageUrl: eswLandingPageUrl,
            dropDownSelection: 'true'
        };
        openEswCountrySwitcher(dataObj);
    });

    $(document).on('click', '.selected-link', function () {
        let dataObj = {
            country: $(this).attr('data-country'),
            currency: $(this).attr('data-currency'),
            language: $(this).attr('data-locale'),
            url: $(this).attr('data-url'),
            action: $('.page').data('action'),
            queryString: $('.page').data('querystring')
        };
        changeAjaxCall(dataObj);
    });

    $(document).on('change', '#shippingCountrydefault', function () {
        let selectedData = {
            country: $('#shippingCountrydefault').val().toUpperCase(),
            url: $('#shippingCountrydefault').attr('data-url')
        };
        $.ajax({
            type: 'get',
            url: selectedData.url,
            data: selectedData,
            success: function (response) {
                if (response.success == false) {
                    return;
                }
                let dataObj = {
                    country: response.country,
                    currency: response.currency,
                    language: response.language,
                    url: response.url,
                    action: $('.page').data('action'),
                    queryString: $('.page').data('querystring'),
                    redirect: response.redirect,
                    successMsg: response.successMsg,
                    changeAddressAjax: true
                };
                changeAjaxCall(dataObj);
            }
        });
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
    $('body').on('product:afterAttributeSelect', function (e, response) {
        if (response.data.product.isProductRestricted) {
            $('.modal.show').find('button.update-cart-product-global').addClass('d-none');
            $('.modal.show').find('.price').addClass('d-none');
            $('.modal.show').find('.product-not-available-msg').removeClass('d-none');
        } else {
            $('.modal.show').find('button.update-cart-product-global').removeClass('d-none');
            $('.modal.show').find('.price').removeClass('d-none');
            $('.modal.show').find('.product-not-available-msg').addClass('d-none');
        }
    });
}

/**
 * applies rounding method as per the rounding model.
 * @param {*} price - price
 * @param {*} model - model
 * @param {*} roundingModel - rounding model
 * @param {*} isFractionalPart - isFractionalPart
 * @returns {number}- rounding number
 */
function applyRoundingMethod(price, model, roundingModel, isFractionalPart) {
    let roundingMethod = model.split(/(\d+)/)[0];
    let roundedPrice;
    let fractionalPrice;
    let roundedUp;
    let roundedDown;
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
            roundedUp = (roundingTarget < otherPart ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
            roundedDown = (roundingTarget > otherPart ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + Number(roundingTarget);
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

/**
 * function to apply rounding on the content static price conversion
 * @param {*} price - price
 * @returns {number} - price
 */
function applyRoundingModel(price) {
    let roundingModel = window.SitePreferences.ESW_SELECTED_ROUNDING ? JSON.parse(window.SitePreferences.ESW_SELECTED_ROUNDING) : false;
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

/**
 * function to convert static prices on the page.
 * @returns {boolean} - ture
 */
function convertPrice() {
    let priceElements = $('.esw-price:not(.esw-price-converted)');
    let selectedCurrencySymbol = window.SitePreferences.ESW_CURRENCY_SYMBOL;

	// Update price elements
    if (!window.SitePreferences.ESW_FIXED_COUNTRY) {
        let selectedCountryAdjustment = window.SitePreferences.ESW_SELECTED_COUNTRY_ADJUSTMENT ? JSON.parse(window.SitePreferences.ESW_SELECTED_COUNTRY_ADJUSTMENT) : '';
        let selectedFxRate = window.SitePreferences.ESW_SELECTED_FXRATE ? JSON.parse(window.SitePreferences.ESW_SELECTED_FXRATE) : '';
        let enableRounding = window.SitePreferences.ESW_ENABLE_ROUNDING;
        if (!selectedFxRate) {
            return false;
        }

        priceElements.each(function () {
            let element = $(this);
            let disableRounding = !!((element.attr('data-disable-rounding') && element.attr('data-disable-rounding') == 'true'));
            let disableAdjustment = !!((element.attr('data-disable-adjustments') && element.attr('data-disable-adjustments') == 'true'));
            let eswPrice = Number($.trim(element.text()).replace(/[^0-9\.-]+/g, ''));
            if (selectedCountryAdjustment && !disableAdjustment) {
				// applying adjustment
                eswPrice += Number((selectedCountryAdjustment.retailerAdjustments.priceUpliftPercentage / 100 * eswPrice));
				// applying duty
                eswPrice += Number((selectedCountryAdjustment.estimatedRates.dutyPercentage / 100 * eswPrice));
				// applying tax
                eswPrice += Number((selectedCountryAdjustment.estimatedRates.taxPercentage / 100 * eswPrice));
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
    return true;
}

$(document).ready(function () {
    updateCountryList();
    if ($('.eswModal').length > 0) {
		// Logic to enable/disable welcome matt currency dropdowns
        let $selectedCurrency = $('#selected-currency');
        setDefaultCurrency($selectedCurrency);
    }
    if (typeof window.SitePreferences !== 'undefined' && window.SitePreferences.ESW_ENABLE_PRICECONVERSION) {
        convertPrice();
        $(document).ajaxComplete(function () {
            convertPrice();
        });
    }
    $('body').on('click', '.submit-customer', function () {
        if ($('#email-guest').val() && $('#email-guest').val().indexOf('@') > 0) {
            $('.submit-customer').prop('disabled', true);
        }
    });
});
