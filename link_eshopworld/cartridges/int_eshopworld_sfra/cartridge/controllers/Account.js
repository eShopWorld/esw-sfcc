'use strict';

/**
 * @namespace Account
 */

const page = module.superModule;
const server = require('server');

server.extend(page);

/* API includes */
const logger = require('dw/system/Logger');

/**
 * Account-Show : The Account-Show endpoint will render the shopper's account page. Once a shopper logs in they will see is a dashboard that displays profile, address, payment and order information.
 * @name Base/Account-Show
 * @function
 * @memberof Account
 * @param {middleware} - server.middleware.https
 * @param {middleware} - userLoggedIn.validateLoggedIn
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - registration - A flag determining whether or not this is a newly registered account
 * @param {category} - senstive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append(
    'Show',
    function (req, res, next) {
        try {
            if (!empty(session.privacy.confirmedOrderID)) {
                delete session.privacy.confirmedOrderID;
            }
        } catch (e) {
            logger.error('ESW Delete Session Attribute Error: {0} {1}', e.message, e.stack);
        }
        return next();
    }
);

/**
 * Account-Header : The prepend Account-Header endpoint is used to call custom functionalty on each page
 * @name Base/Account-Header
 * @function
 * @memberof Account
 */
server.prepend('Header', function (req, res, next) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    eswHelper.rebuildCartUponBackFromESW();
    return next();
});

module.exports = server.exports();
