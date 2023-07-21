/**
 * Helper script support ESW Pre Order Request.
 **/


/* API includes */
const URLUtils = require('dw/web/URLUtils');
const logger = require('dw/system/Logger');

/* Script Modules */
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * Handle Pre-Order V2. It prepares Pre-Order service request and calls it.
 * @returns {string} - if cookies not found then return blank string
 * otherwise, renders the landing page.
 */
function handlePreOrderRequestV2() {
    let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
        preorderServiceObj = eswCoreService.getPreorderServiceV2(),
        oAuthObj = eswCoreService.getOAuthService(),
        eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper'),
        redirectPreference = eswHelper.getRedirect();
    if (redirectPreference.value !== 'Cart' && session.privacy.guestCheckout == null) {
        if (!customer.authenticated) {
            session.privacy.TargetLocation = URLUtils.https('EShopWorld-PreOrderRequest').toString();

            return {
                status: 'REDIRECT'
            };
        }
    }
    let formData = {
        grant_type: 'client_credentials',
        scope: 'checkout.preorder.api.all'
    };
    formData.client_id = eswHelper.getClientID();
    formData.client_secret = eswHelper.getClientSecret();
    let oAuthResult = oAuthObj.call(formData);
    if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
        logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
    }
    session.privacy.eswOAuthToken = JSON.parse(oAuthResult.object).access_token;

    let requestObj = eswServiceHelper.preparePreOrder();
    requestObj.retailerCartId = eswServiceHelper.createOrder();
    let eswCheckoutRegisterationEnabled = eswHelper.isCheckoutRegisterationEnabled();
    if (eswCheckoutRegisterationEnabled && !customer.authenticated && !empty(requestObj.shopperCheckoutExperience.registration) && requestObj.shopperCheckoutExperience.registration.showRegistration) {
        session.privacy.confirmedOrderID = requestObj.retailerCartId;
    }
    let result = preorderServiceObj.call(JSON.stringify(requestObj));
    return result;
}

/**
 * @param {Object} req - current req object
 * @param {Object} res - current res object
 * @returns {string} - Redirect URL
 */
function preOrderRequest(req, res) { // eslint-disable-line consistent-return
    try {
        let result = handlePreOrderRequestV2();

        if (result.status === 'REDIRECT') {
            res.json({
                redirectURL: URLUtils.https('Checkout-Begin').toString()
            });
        }
        if (result.status === 'ERROR' || empty(result.object)) {
            logger.error('ESW Service Error: {0}', result.errorMessage);
            session.privacy.eswfail = true;
            delete session.privacy.guestCheckout;
            return URLUtils.https('Cart-Show').toString();
        }
        let redirectURL = JSON.parse(result.object).redirectUrl;
        if ('shopperAccessToken' in JSON.parse(result.object)) {
            eswHelper.createCookie('esw-shopper-access-token', JSON.parse(result.object).shopperAccessToken, '/', 3600, eswHelper.getTopLevelDomain());
        } else {
            eswHelper.createCookie('esw-shopper-access-token', '', '/', 'expired', eswHelper.getTopLevelDomain());
        }
        delete session.privacy.guestCheckout;
        return redirectURL;
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
        session.privacy.eswfail = true;
        delete session.privacy.guestCheckout;
        return URLUtils.https('Cart-Show').toString();
    }
}

module.exports = {
    preOrderRequest: preOrderRequest,
    handlePreOrderRequestV2: handlePreOrderRequestV2
};
