'use strict';

exports.modifyGETResponse = function (doc) {
    // API Includes
    let Status = require('dw/system/Status');

    // Script Includes
    let OCAPIHelper = require('*/cartridge/scripts/helper/eswOCAPIHelperHL');
    OCAPIHelper.eswSearchSuggestionPriceConversions(doc);

    return new Status(Status.OK);
};
