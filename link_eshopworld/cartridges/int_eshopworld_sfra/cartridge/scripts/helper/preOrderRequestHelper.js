/**
 * Helper script support ESW Pre Order Request.
 **/


/* API includes */
const URLUtils = require('dw/web/URLUtils');
const logger = require('dw/system/Logger');

/* Script Modules */
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const selfHostedOcHelper = require('*/cartridge/scripts/helper/eswSelfHostedOcHelper');

/**
 * Handle Pre-Order V2. It prepares Pre-Order service request and calls it.
 * @returns {string} - if cookies not found then return blank string
 * otherwise, renders the landing page.
 */
function handlePreOrderRequestV2() {
    let result;
    try {
        let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
            preorderServiceObj = eswCoreService.getPreorderServiceV2(),
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
        eswHelper.setOAuthToken();

        let requestObj = eswServiceHelper.preparePreOrder();
        requestObj.retailerCartId = eswServiceHelper.createOrder();
        if (eswHelper.isEswSelfHostedOcEnabled()) {
            let selfHostedOcMetadata = selfHostedOcHelper.getEswSelfhostedPreOrderMetadata(requestObj.retailerCartId);
            if (!empty(selfHostedOcMetadata)) {
                requestObj.retailerCheckoutExperience.metadataItems.push({
                    Name: selfHostedOcMetadata.metadataName,
                    Value: selfHostedOcMetadata.metadataValue
                });
            }
        }
        eswHelper.validatePreOrder(requestObj, true);
        session.privacy.confirmedOrderID = requestObj.retailerCartId;
        result = preorderServiceObj.call(JSON.stringify(requestObj));
    } catch (error) {
        eswHelper.eswInfoLogger('handlePreOrderRequestV2 Error', error, error.message, error.stack);
    }
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
        delete session.privacy.guestCheckout;
        return redirectURL;
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
        eswHelper.eswInfoLogger('preOrderRequest Error', e, e.message, e.stack);
        session.privacy.eswfail = true;
        delete session.privacy.guestCheckout;
        return URLUtils.https('Cart-Show').toString();
    }
}

module.exports = {
    preOrderRequest: preOrderRequest,
    handlePreOrderRequestV2: handlePreOrderRequestV2
};
