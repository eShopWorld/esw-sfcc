/* eslint-disable quotes */
/* eslint-disable no-unused-vars */
/* eslint-disable require-jsdoc */

function switchSearchSelection(name, value) {
    let formTab = document.getElementById(name);
    formTab.style.display = value;
}

function switchToAdvancedSearch() {
    switchSearchSelection('simpleSearchDiv', 'none');
    switchSearchSelection('AdvancedSearchDiv', '');
    switchSearchSelection('IDSearchListDiv', 'none');
}

function switchToIDListSearch() {
    switchSearchSelection('simpleSearchDiv', 'none');
    switchSearchSelection('AdvancedSearchDiv', 'none');
    switchSearchSelection('IDSearchListDiv', '');
}

function switchToSimpleSearch() {
    switchSearchSelection('simpleSearchDiv', '');
    switchSearchSelection('AdvancedSearchDiv', 'none');
    switchSearchSelection('IDSearchListDiv', 'none');
}

function selectAllProducts() {
    var ele = document.querySelectorAll('.select-Product');
    for (var i = 0; i < ele.length; i++) {
        // eslint-disable-next-line eqeqeq
        if (ele[i].type == 'checkbox' && ele[i].disabled === false) {
            // eslint-disable-next-line no-unneeded-ternary, eqeqeq
            ele[i].checked = ele[i].checked == true ? false : true;
        }
    }
}

window.addEventListener("load", function () {
    let $selectedSearch = document.querySelector(".productsList");
    let selectedSearch = $selectedSearch.dataset.selectedsearch;
    let synceMsg = document.getElementsByClassName("synceMsg");
    if (selectedSearch === 'byID') {
        switchToIDListSearch();
    } else if (selectedSearch === 'advanced') {
        switchToAdvancedSearch();
    }
    if (synceMsg.length > 0) {
        setTimeout(function () {
            synceMsg[0].style.display = "none";
        }, 3000);
    }
});

function sendAjax(formAction, formData, sneakBarMsgHtml, reloadPage) {
    $.ajax({
        method: "POST",
        url: formAction,
        data: formData,
        beforeSend: function () {
            $("#esw-overlay").fadeIn();
        },
        success: function (data, status, xhr) {
            $('#esw-snackbar').html(sneakBarMsgHtml);
            $("#esw-snackbar").addClass('show');
            setTimeout(function () { $("#esw-snackbar").removeClass('show'); }, 3000);
            if (reloadPage) {
                window.location.reload();
            }
        },
        complete: function () {
            $("#esw-overlay").fadeOut();
            $(".esw-frm-submit-btn").attr('disabled', false);
        }
    });
}

function submitForm($productGridForm, clickEvent) {
    let formAction = $($productGridForm).attr('action');
    let formData = $($productGridForm).serialize() + '&' + clickEvent + '=' + clickEvent;
    sendAjax(formAction, formData, 'Sync request has been generated for the products/orders.', true);
}

$(document).ready(function () {
    // Left menu
    $(".esw-menu > a").click(function () {
        $(this).next('.esw-submenu').slideToggle(function () {
            if ($(this).is(":visible")) {
                $(this).parent('.esw-menu').addClass('selected');
            } else {
                $(this).parent('.esw-menu').removeClass('selected');
            }
        });
    });
    // form selection
    if ($('#productGridForm')) {
        let $productGridForm = $('#productGridForm');
        $(document).on('click', '.SyncSlected', function (e) {
            e.preventDefault();
            submitForm($productGridForm, 'SyncSlected');
        });
        $(document).on('click', '.SyncAll', function (e) {
            e.preventDefault();
            submitForm($productGridForm, 'SyncAll');
        });
    }
    // Submit configuration form only
    if ($('#esw-bm-config-form')) {
        $('#esw-bm-config-form').submit(function (e) {
            $(".esw-frm-submit-btn").attr('disabled', true);
            e.preventDefault();
            let formData = {};
            $('.esw-pref-input').each(function () {
                // req.form on server is removing empty values
                formData[$(this).attr('name')] = ($(this).val().length === 0) ? ' ' : $(this).val();
            });
            let formAction = $(this).attr('action');
            sendAjax(formAction, formData, 'The custom preferences were saved.', true);
        });
    }
});
