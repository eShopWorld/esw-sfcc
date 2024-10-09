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
    let ele = document.querySelectorAll('.select-Product');
    for (let i = 0; i < ele.length; i++) {
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

function isValidJSON(jsonString) {
    try {
        JSON.parse(jsonString);
        return true;
    } catch (error) {
        return false;
    }
}

$(document).ready(function () {
    $.ajax({
        url: $('#shippingMethods').attr('href'),
        type: 'POST',
        dataType: 'html',
        data: { PageSize: 'All' },
        success: function (data, textStatus, jqXHR) {
            // handle the response data
            let html = $.parseHTML(data);
            let tableRows = $(html).find('tr');
            let result = [];
            // eslint-disable-next-line no-undef
            let seenIds = new Set();
            // Iterate over each table row
            tableRows.each(function () {
                let cells = $(this).find('td.table_detail');
                // Create an object for the row
                let row = {};
                // Iterate over each cell in the row
                cells.each(function (cellIndex, cell) {
                    let cellText = $(cell).text().replace(/\n|\t/g, '').trim();
                    if (cellText === ' ') {
                        return; // Skip empty columns
                    }
                    switch (cellIndex) {
                        case 0:
                            row.ID = cellText;
                            break;
                        case 1:
                            row.Name = cellText;
                            break;
                        case 4:
                            row.Status = cellText;
                            break;
                        case 5:
                            row.Currency = cellText;
                            break;
                        default:
                            // Ignore other columns
                            break;
                    }
                });
                // Add the row object to the result array
                if (Object.prototype.hasOwnProperty.call(row, 'Name') && !seenIds.has(row.ID)) {
                    seenIds.add(row.ID); // To avoid duplicate entries
                    result.push(row);
                }
            });
            let reportJSON = JSON.parse($('.json-txt-lg').text());
            reportJSON[1].GlobalConfigs.ShippingMethods = result;
            $('.json-txt-lg').text(JSON.stringify(reportJSON, null, 2));
        },
        complete: function () {
            $.ajax({
                url: $('#orderPreferences').attr('href'),
                type: 'GET',
                dataType: 'html',
                success: function (data, textStatus, jqXHR) {
                    let GlobalConfig = {
                        failedOrderRetention: $(data).find('input[name="FailedOrderRetention"]').val(),
                        AutoFailOrders: $(data).find('input[name="FailNonPlacedOrdersAfter"]').val(),
                        LimitStoreFrontOrderAccess: $(data).find('select[name="StorefrontOrderAccess"]').val(),
                        FilterStorefrontOrdersByCustomerSession: $(data).find('select[name="StorefrontOrderFiltering"]').val()
                    };
                    let pimJSON = JSON.parse($('.json-txt-lg').text());
                    pimJSON[1].GlobalConfigs.OrderConfigs = GlobalConfig;
                    $('.json-txt-lg').text((JSON.stringify(pimJSON, null, 2)));
                },
                complete: function () {
                    // Export file
                    let jsonData = $('.json-txt-lg').text().trim();
                    if (isValidJSON(jsonData)) {
                        let encodedData = encodeURIComponent(jsonData);
                        let lastModified = $('.input-container').data('lastmodified');
                        let encDataType = "data:text/json;charset=utf-8," + encodedData;
                        $('<a href="' + encDataType + '" id="downloadReport" class="button input-container" download="PIM-Report-' + lastModified + '.json">Export</a>').appendTo(".esw-report-header");
                    }
                    $('#downloadReport').css({
                        position: 'sticky',
                        float: 'right'
                    });
                }
            });
        }

    });
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
