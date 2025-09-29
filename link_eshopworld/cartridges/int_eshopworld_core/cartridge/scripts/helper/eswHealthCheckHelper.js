'use strict';
const System = require('dw/system/System');
const Logger = require('dw/system/Logger').getLogger('ESWHealthCheckJobLog', 'ESWHealthCheckJobLog');

const eswHealthCheckHelper = {
/**
 * Chceck if service is down or has 500 error
 * @param {number} serviceErrorCode - error code from service
 * @returns {boolean} - true if service has error
 */
    serviceHasError: function (serviceErrorCode) {
        let errorCodes = [408, 500, 502];
        return errorCodes.indexOf(serviceErrorCode) !== -1;
    },
/**
 * Check if service is in use
 * @param {string} serviceName - servie name
 * @returns {Object} - if in use then true else false, also serviceInfo
 */
    isServiceInUse: function (serviceName) {
        let LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
        try {
            /* eslint no-param-reassign: off */
            let serviceNameRegex = serviceName.match(/EswCheckout(.*?)/gi);
            if (serviceNameRegex && !empty(serviceNameRegex) && serviceNameRegex.length > 0) {
                serviceName = eswHelper.getCheckoutServiceName();
            }
            let serviceCreds = LocalServiceRegistry.createService(serviceName, {
                parseResponse: function (service) {
                    return service;
                }
            });
            let serviceUrl = serviceCreds.getURL();
            return {
                inUse: (
                    (System.getInstanceType() === System.PRODUCTION_SYSTEM && serviceUrl.indexOf('sandbox.eshopworld.com') === -1)
                    || (System.getInstanceType() !== System.PRODUCTION_SYSTEM)
                ) && !empty(serviceUrl),
                serviceName: serviceCreds.configuration.ID
            };
        } catch (e) {
            Logger.error('ServiceNotFound: ' + JSON.stringify(e));
            return false;
        }
    },
    /**
 * Generate service payload to send
 * @param {string} serviceName - Service name
 * @param {Object} serviceTestJson - Service payload
 * @returns {Object} - Service object
 */
    getServiceRes: function (serviceName, serviceTestJson) {
        let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
        let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
        let serviceResponse = {};
        try {
            switch (serviceName) {
                case 'ESWOrderReturnService':
                    serviceResponse = eswCoreService.getEswOrderReturnService().call(serviceTestJson.payload);
                    break;
                case 'EswOAuthService':
                    serviceResponse = eswCoreService.getOAuthService().call(serviceTestJson.payload);
                    break;
                case 'EswCheckoutV2Service.SFRA':
                case 'EswCheckoutV3Service.SFRA':
                case 'EswCheckoutV2Service.SG':
                    eswHelper.setOAuthToken();
                    serviceResponse = eswCoreService.getPreorderServiceV2().call(serviceTestJson.payload);
                    break;
                case 'EswPackageV4Service':
                    serviceResponse = eswCoreService.getPackageServiceV4().call(serviceTestJson.payload);
                    break;
                case 'EswOrderAPIV2Service':
                    serviceResponse = eswCoreService.getOrderAPIServiceV2().call(serviceTestJson.payload);
                    break;
                case 'EswPriceFeedV3Service':
                    serviceResponse = eswCoreService.getPricingV3Service().call(serviceTestJson.payload);
                    break;
                case 'EswPriceFeedV4Service':
                case 'EswPriceFeedService':
                    serviceResponse = eswCoreService.getPricingAdvisorService().call(serviceTestJson.payload.eswOAuthToken);
                    break;
                case 'EswGetJwksService':
                    serviceResponse = eswCoreService.getJwksFromEswService().call(serviceTestJson.payload);
                    break;
                case 'EswGetAsnPackage':
                    serviceResponse = eswCoreService.getAsnServiceForEswToSfcc().call(serviceTestJson.payload);
                    break;
                case 'ESWCatalogService':
                    serviceResponse = eswCoreService.getCatalogService().call(serviceTestJson.payload);
                    break;
                case 'EswAzureInsightService':
                    serviceResponse = eswCoreService.getEswAzureInsightService().call(serviceTestJson.payload);
                    break;
                case 'EswOcapiDataAuthService':
                    serviceResponse = eswCoreService.getDataOcapiAuthToken().call(serviceTestJson.payload);
                    break;
                default:
                // Do nothing
            }
        } catch (e) {
            serviceResponse = null;
        }
        return serviceResponse;
    },
    /**
 * Call http service
 * @param {string} httpMethod - POST, GET, PUT, PATCH, DELETE etc
 * @param {string} url - Controller path only
 * @returns {Object} - Http method result
 */

    callHttp: function (httpMethod, url) {
        let URLUtils = require('dw/web/URLUtils');
        let HTTPClient = require('dw/net/HTTPClient');
        let httpClient = new HTTPClient();
        httpClient.open(httpMethod, URLUtils.https(url));
        httpClient.setTimeout(5000);
        httpClient.send();
        return {
            statusCode: httpClient.statusCode,
            message: !empty(httpClient.statusMessage) ? httpClient.statusMessage : 'An error occured while calling http client'
        };
    }
};


module.exports = {
    eswHealthCheckHelper: eswHealthCheckHelper
};
