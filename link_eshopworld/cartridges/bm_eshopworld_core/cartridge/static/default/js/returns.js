'use strict';

$(document).ready(function () {
    // Checkbox selection
    $('a.selectAllCheckbox').on('click', function () {
        let selectOrders = true;
        if ($('input.order-checkbox:checked').length > 0) {
            selectOrders = false;
        }
        $('.order-checkbox').prop('checked', selectOrders);
    });
    // Export button should be enable when atleast one order is selected
    $('input.order-checkbox, a.selectAllCheckbox').on('click', function () {
        if ($('input.order-checkbox:checked').length === 0) {
            $('button.SyncSlected').attr('disabled', true);
        } else {
            $('button.SyncSlected').attr('disabled', false);
        }
    });
    // Form switching
    $('a.frm-opener').on('click', function () {
        $('.search-frm').hide();
        $('a.frm-opener').removeClass('selected-search-method');
        if ($(this).attr('class').indexOf('simple-search-frm') !== -1) {
            $('.search-frm.simple-frm').show();
        }
        if ($(this).attr('class').indexOf('adv-search-frm') !== -1) {
            $('.search-frm.adv-form').show();
        }
        if (($(this).attr('class').indexOf('by_id-frm') !== -1)) {
            $('.search-frm.by_id-form').show();
        }
        $(this).addClass('selected-search-method');
    });
});
