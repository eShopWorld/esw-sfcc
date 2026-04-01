
'use strict';


/* API includes */
let eswCoreApiHelper = require('*/cartridge/scripts/helper/eswCoreApiHelper');
const RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getAbandonmentCart = function () {
    let responseJSON;
    responseJSON = eswCoreApiHelper.rebuildBasket();

    RESTResponseMgr
        .createSuccess(responseJSON)
        .render();
};

exports.getAbandonmentCart.public = true;
