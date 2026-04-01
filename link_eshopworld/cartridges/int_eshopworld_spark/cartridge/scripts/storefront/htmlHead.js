/* eslint-disable no-unused-vars */
'use strict';

const ISML = require('dw/template/ISML');
const Status = require('dw/system/Status');

exports.htmlHead = function (pdict) {
    ISML.renderTemplate('custom/htmlHead');
};
