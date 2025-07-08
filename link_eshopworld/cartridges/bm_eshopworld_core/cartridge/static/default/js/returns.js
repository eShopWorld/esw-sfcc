/* global jQuery */
'use strict';

jQuery(document).ready(function () {
    // Checkbox selection
    jQuery('a.selectAllCheckbox').on('click', function () {
        let selectOrders = true;
        if (jQuery('input.order-checkbox:checked').length > 0) {
            selectOrders = false;
        }
        jQuery('.order-checkbox').prop('checked', selectOrders);
    });
    // Export button should be enable when atleast one order is selected
    jQuery('input.order-checkbox, a.selectAllCheckbox').on('click', function () {
        if (jQuery('input.order-checkbox:checked').length === 0) {
            jQuery('button.SyncSlected').attr('disabled', true);
        } else {
            jQuery('button.SyncSlected').attr('disabled', false);
        }
    });
    // Form switching
    jQuery('a.frm-opener').on('click', function () {
        jQuery('.search-frm').hide();
        jQuery('a.frm-opener').removeClass('selected-search-method');
        if (jQuery(this).attr('class').indexOf('simple-search-frm') !== -1) {
            jQuery('.search-frm.simple-frm').show();
        }
        if (jQuery(this).attr('class').indexOf('adv-search-frm') !== -1) {
            jQuery('.search-frm.adv-form').show();
        }
        if ((jQuery(this).attr('class').indexOf('by_id-frm') !== -1)) {
            jQuery('.search-frm.by_id-form').show();
        }
        jQuery(this).addClass('selected-search-method');
    });
});
