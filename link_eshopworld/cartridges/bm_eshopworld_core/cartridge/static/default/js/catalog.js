'use strict';

$(document).ready(function () {
    let enableCatalogMethodField = 'select#isEswCatalogFeatureEnabled';
    let relventFields = { sftpFields: [], apiFields: [] };
    if (typeof $('#eswCatalogReleventFields').val() !== 'undefined') {
        relventFields = JSON.parse($('#eswCatalogReleventFields').val());
    }
    let sftpFields = relventFields.sftpFields.map(function (el) {
        return 'tr.esw-field-' + el;
    });
    let apiFields = relventFields.apiFields.map(function (el) {
        return 'tr.esw-field-' + el;
    });
    let allFields = apiFields.concat(sftpFields);

    // Export button should be enable when atleast one order is selected
    $('input.select-Product, a.selectAllCheckbox').on('click', function () {
        if ($('input.select-Product:checked').length === 0) {
            $('button.SyncSlected').attr('disabled', true);
        } else {
            $('button.SyncSlected').attr('disabled', false);
        }
    });

    /**
     * Show/hide catalog method
     */
    function showOrHideCatalogMethod() {
        if ($(enableCatalogMethodField).val() === 'false') {
            $(allFields.join(',')).hide();
        } else {
            $(allFields.join(',')).show();
        }
    }
    /**
     * Run functions on all page load
     */
    function onPageLoad() {
        showOrHideCatalogMethod();
    }

    /**
     * Events and actions on the page
     */
    onPageLoad();
    $(enableCatalogMethodField).change(function () {
        showOrHideCatalogMethod();
    });
});
