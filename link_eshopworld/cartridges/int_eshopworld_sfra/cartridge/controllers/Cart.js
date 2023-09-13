'use strict';

/**
 * @namespace Cart
 */

const server = require('server');
server.extend(module.superModule);

/**
 * Cart-Show : The Cart-Show endpoint renders the cart page with the current basket
 * @name esw/Cart-Show
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend(
    'Show',
    function (req, res, next) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        eswHelper.rebuildCartUponBackFromESW();
        return next();
    }
);
module.exports = server.exports();
