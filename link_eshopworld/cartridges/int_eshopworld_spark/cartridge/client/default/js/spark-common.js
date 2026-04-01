'use strict';
const sparkElements = [
  '.esw-general-price',
  '.esw-cart-line-item-unit-price',
  '.esw-cart-line-item-total-price',
  '.esw-cart-quantity',
  '.esw-discount',
  '.esw-cart-surcharge',
  '.esw-cart-total',
  '.esw-minicart-subtotal',
  '.esw-price'
].join(', ');

/**
 * Retrieves the value of a cookie by name.
 * @param {*} name
 * @returns {string|null} The cookie value or null if not found.
 */
function getCookie(name) {
  let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

/**
 * Sets a cookie with the given name, value, and expiration days.
 * @param {*} name
 * @param {*} value
 * @param {*} days
 */
function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie =
    name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=None; Secure';
}
/**
 * Extracts and parses a number from a string, or returns the number as is if already a number.
 * @param {string|number} value - The value to parse.
 * @returns {number} The parsed number, or NaN if not found.
 */
function parseNumber(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    // Remove all non-numeric except dot and minus
    let match = value.match(/-?\d+(\.\d+)?/);
    if (match) {
      return Number.parseFloat(match[0]);
    }
  }
  return Number.NaN;
}

/**
 * Makes Spark-related price elements visible by setting their CSS visibility to 'visible'.
 */
function makeSparkElementVisible() {
  $(sparkElements).css('visibility', 'visible');
}

/**
 * Hides Spark-related price elements by setting their CSS visibility to 'hidden'.
 */
function hideSparkElements() {
  $(sparkElements).css('visibility', 'hidden');
}

function mapCartridgeCookiesWithLti() {
  let eswLtiValue = getCookie('ESW_LTI');
  if (eswLtiValue) {
    let decodedEswLtiCookie = JSON.parse(decodeURIComponent(eswLtiValue));
    setCookie('esw.location', decodedEswLtiCookie.countryIso, 1);
    setCookie('esw.currency', decodedEswLtiCookie.currencyIso, 1);
  }
}

// Fire event when all resources including external scripts are loaded
$(window).on('load', function () {
  mapCartridgeCookiesWithLti();
  makeSparkElementVisible();
});

$(document).ajaxStart(function () {
  // Hide prices during AJAX calls to prevent flickering
  hideSparkElements();
});

// Ensure prices are visible after any AJAX updates
$(document).ajaxComplete(function () {
  makeSparkElementVisible();
});

// Listen for the custom Spark script event `ESW_LTI_COOKIE_SET` and set cookies accordingly
$(document).on('ESW_LTI_COOKIE_SET', function () {
  mapCartridgeCookiesWithLti();
});

/**
 * Handles cart or promotion updates by updating the relevant price elements.
 * @param {*} event
 * @param {*} response
 */
function handleCartOrPromotionUpdate(event, response) {
  if (response) {
    // Order level discount update
    if (response.totals.orderLevelDiscountTotal) {
      $('.order-discount-total.esw-discount').attr(
        'data-bp-lti',
        '- ' + response.totals.orderLevelDiscountTotal.formatted
      );
    }
    // handle shipping cost update
    if ($('.esw-shipping-cost') && response.totals && response.totals.totalShippingCost) {
      let shippingCost = parseNumber(response.totals.totalShippingCost);
      $('.esw-shipping-cost').attr('data-bp-lti', shippingCost);
    }
    //update tax
    if ($('.esw-tax') && response.totals && response.totals.totalTax) {
      $('.esw-tax').attr('data-bp-lti', parseNumber(response.totals.totalTax));
    }
    // Product level discount update
    if (response.items) {
      response.items.forEach(function (item) {
        let itemUUID = item.eswUUID || item.UUID || item.uuid;
        let itemPriceTotal = parseNumber(item.priceTotal.price);
        let itemQty = item.quantity;
        let itemUnitAdjustedPrice = itemPriceTotal / itemQty;
        $('.line-item-price-' + itemUUID)
          .find('.sales.esw-cart-line-item-unit-price')
          .attr('data-bp-lti', itemUnitAdjustedPrice);
        $('.line-item-promo.item-' + itemUUID)
          .find('.esw-promotion')
          .addClass('liuuid-' + itemUUID)
          .removeClass('liuuid-null');
      });
    }
    makeSparkElementVisible();
  }
}

$(document).on('promotion:success', handleCartOrPromotionUpdate);
$(document).on('cart:update', handleCartOrPromotionUpdate);
$(document).on('cart:shippingMethodSelected', handleCartOrPromotionUpdate);

// Remove any previous .btnCheckout click handlers and implement Spark's own
function getAllDiscountsHtml() {
  let discountsByProduct = {};
  let promotionCalloutTxt = '';
  // For each .esw-promotion block
  $('.esw-promotion').each(function () {
    // Extract productId from class, e.g. lipid-701642923503M
    let classList = $(this).attr('class').split(/\s+/);
    let lineItemUUID = null;
    let promotionID = null;
    classList.forEach(function (cls) {
      let matchLiUUID = cls.match(/^liuuid-(.+)$/);
      if (matchLiUUID) {
        lineItemUUID = matchLiUUID[1];
      }
      let matchPromoID = cls.match(/^promo-id-(.+)$/);
      if (matchPromoID) {
        promotionID = matchPromoID[1];
      }
    });
    if (lineItemUUID) {
      let promotionCalloutHtml = $(this).html();
      if (!discountsByProduct[lineItemUUID]) {
        discountsByProduct[lineItemUUID] = [];
        if (promotionCalloutHtml && promotionCalloutHtml.length > 0) {
          promotionCalloutTxt = promotionCalloutHtml.replace(/<[^>]{0,2048}>/g, '').trim();
        }
      }
      discountsByProduct[lineItemUUID].push({
        promotionID: promotionID,
        calloutText: promotionCalloutTxt
      });
    }
  });

  // This will output coupons with coupon_code and coupon_calloutMsg
  let coupons = [];
  $('.coupons-and-promos .coupon-price-adjustment').each(function () {
    let code = $(this).find('.remove-coupon').data('code');
    let calloutMsg = $(this).find('.coupon-promotion-relationship li').first().text().trim();
    if (code) {
      coupons.push({
        coupon_code: code,
        coupon_calloutMsg: calloutMsg
      });
    }
  });
  return { productDiscounts: discountsByProduct, couponDiscounts: coupons };
}

$(document).off('click', '.btnCheckout');
$(document).on('click', '.btnCheckout', function (e) {
  // Spark-only implementation
  e.preventDefault();
  let promotionsCallouts = getAllDiscountsHtml();
  console.log('Promotions Callouts:', promotionsCallouts);
  $('.eshopworld-loader').removeClass('d-none');
  $('.btnCheckout').addClass('disabled');
  let domain = $(this).attr('data-tld');
  $.ajax({
    type: 'get',
    url: $(this).attr('data-url'),
    data: {
      promotionsCallouts: JSON.stringify(promotionsCallouts)
    },
    dataType: 'json',
    success: function (response) {
      if (response.eswAuthToken && response.eswAuthToken !== '') {
        let expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + 3600 * 1000); // 1 hour
        document.cookie =
          'esw-shopper-access-token=' +
          response.eswAuthToken +
          ';path=/;domain=' +
          domain +
          ';expires=' +
          expirationDate.toUTCString() +
          ';SameSite=None;Secure';
      } else {
        document.cookie =
          'esw-shopper-access-token=' +
          response.eswAuthToken +
          ';path=/;domain=' +
          domain +
          ';expires=expired;SameSite=None;Secure';
      }
      window.open(response.redirectURL, '_self');
    }
  });
});
