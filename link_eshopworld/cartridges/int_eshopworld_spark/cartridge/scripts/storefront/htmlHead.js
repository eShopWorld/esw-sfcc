/* eslint-disable no-unused-vars */
'use strict';

const ISML = require('dw/template/ISML');
const Status = require('dw/system/Status');

// const URLUtils = require('dw/web/URLUtils');

exports.htmlHead = function (pdict) {
    // var requestURL = URLUtils.https('Home-Show').toString();
    // var currentURL = requestURL.split('?')[0]; // Remove query parameters

    ISML.renderTemplate('custom/htmlHead');
};
