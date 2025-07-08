/* global jQuery */
'use strict';

$(document).ready(function () {
    let enableCatalogMethodField = 'select#isEswCatalogFeatureEnabled';
    let relventFields = { sftpFields: [], apiFields: [] };
    let $relevantFields = $('#eswCatalogReleventFields');
    if ($relevantFields !== null && $relevantFields.length > 0) {
        // Attempt to parse the JSON value
        const parsedValue = JSON.parse($relevantFields.val());
        // Check if parsing was successful and the result is an object with the expected properties
        if (parsedValue !== null && typeof parsedValue === 'object' && parsedValue.sftpFields && parsedValue.apiFields) {
            relventFields = parsedValue;
        }
    }
    let sftpFields = relventFields.sftpFields.map(function (el) {
        return 'tr.esw-field-' + el;
    });
    let apiFields = relventFields.apiFields.map(function (el) {
        return 'tr.esw-field-' + el;
    });
    let allFields = apiFields.concat(sftpFields);

    // Export button should be enable when atleast one order is selected
    jQuery('input.select-Product, a.selectAllCheckbox').on('click', function () {
        if (jQuery('input.select-Product:checked').length === 0) {
            jQuery('button.SyncSlected').attr('disabled', true);
        } else {
            jQuery('button.SyncSlected').attr('disabled', false);
        }
    });

    /**
     * Show/hide catalog method
     */
    function showOrHideCatalogMethod() {
        if (jQuery(enableCatalogMethodField).val() !== 'false') {
            jQuery(allFields.join(',')).show();
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
    jQuery(enableCatalogMethodField).change(function () {
        showOrHideCatalogMethod();
    });
});
