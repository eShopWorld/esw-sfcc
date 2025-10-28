/* eslint-disable no-unused-vars */
'use strict';

const ISML = require('dw/template/ISML');

exports.afterFooter = function (pdict) {
    let skippedEndpoints = ['Order-History', 'Order-Details'];
    if (skippedEndpoints.includes(pdict.action)) {
        return null;
    }
    ISML.renderTemplate('custom/afterFooter');
};
