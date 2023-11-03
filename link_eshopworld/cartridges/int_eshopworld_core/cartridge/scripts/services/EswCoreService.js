'use strict';
/**
 * Helper script to get all ESW services
 **/
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

const eShopWorldServices = {
    /*
     * service for getting oAuth Token
     */
    getOAuthService: function () {
        let oAuthService = LocalServiceRegistry.createService('EswOAuthService', {
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw OAuth Response', listOutput.text);
                return listOutput.text;
            }
        });
        return oAuthService;
    },
    /*
     * service for getting oAuth Token for Pricing Advisor
     */
    getPricingOAuthService: function () {
        let priceFeedOAuthServiceName = eswHelper.getSelectedPriceFeedInstance() === 'production' ? 'EswPriceFeedOAuthService.PROD' : 'EswOAuthService';
        let oAuthService = LocalServiceRegistry.createService(priceFeedOAuthServiceName, {
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Price Feed OAuth Response', listOutput.text);
                return listOutput.text;
            }
        });
        return oAuthService;
    },
    /*
     * service for getting version 3 Pricing Advisor data
     */
    getPricingV3Service: function () {
        let priceFeedServiceName = eswHelper.getSelectedPriceFeedInstance() === 'production' ? 'EswPriceFeedV3Service.PROD' : 'EswPriceFeedV3Service';
        let priceFeedV3Service = LocalServiceRegistry.createService(priceFeedServiceName, {
            createRequest: function (service, params) {
                let clientID = eswHelper.getClientID(),
                    bearerToken = 'Bearer ' + params;
                clientID = clientID.substring(0, clientID.indexOf('.'));
                // eslint-disable-next-line no-param-reassign
                service.URL = service.URL + '/' + clientID;
                service.addHeader('Content-type', 'application/json');
                service.addHeader('Authorization', bearerToken);
                service.setRequestMethod('get');
            },
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Price Feed Response', listOutput.text);
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return priceFeedV3Service;
    },
    /*
    * service for getting version 4 Pricing Advisor data
    */
    getPricingAdvisorService: function () {
        let priceFeedServiceName = eswHelper.getSelectedPriceFeedInstance() === 'production' ? 'EswPriceFeedService.PROD' : 'EswPriceFeedService';
        let priceFeedV4Service = LocalServiceRegistry.createService(priceFeedServiceName, {
            createRequest: function (service, params) {
                let clientID = eswHelper.getClientID(),
                    bearerToken = 'Bearer ' + params;
                clientID = clientID.substring(0, clientID.indexOf('.'));
                // eslint-disable-next-line no-param-reassign
                service.URL = service.URL + '/' + clientID;
                service.addHeader('Content-type', 'application/json');
                service.addHeader('Authorization', bearerToken);
                service.setRequestMethod('get');
            },
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Price Feed Response', listOutput.text);
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return priceFeedV4Service;
    },
    /*
     * service pre-order version 2 request definition
     */
    getPreorderServiceV2: function () {
        let preorderCheckoutServiceName = eswHelper.getCheckoutServiceName();
        let preorderServicev2 = LocalServiceRegistry.createService(preorderCheckoutServiceName, {
            createRequest: function (service, params) {
                let bearerToken = 'Bearer ' + session.privacy.eswOAuthToken;
                service.addHeader('Content-Type', 'application/json');
                service.addHeader('Authorization', bearerToken);
                // eslint-disable-next-line no-param-reassign
                service.URL = (!empty(eswHelper.getRussianStorageDataUrl()) && eswHelper.getAvailableCountry() === 'RU') ? eswHelper.getRussianStorageDataUrl() : service.URL;
                service.setRequestMethod('post');
                eswHelper.eswInfoLogger('Esw Pre Order Request : ', params);
                return params;
            },
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Pre Order Response', listOutput.text);
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return preorderServicev2;
    },
    /*
     * service for package version 4 request definition
     */
    getPackageServiceV4: function () {
        let packageServiceV4 = LocalServiceRegistry.createService('EswPackageV4Service', {
            createRequest: function (service, params) {
                let bearerToken = 'Bearer ' + params.eswOAuthToken;
                service.addHeader('Content-Type', 'application/json');
                service.addHeader('Authorization', bearerToken);

                service.setRequestMethod('post');
                eswHelper.eswInfoLogger('Esw Package V4 Request : ', params.requestBody);
                return params.requestBody;
            },
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Package V4 Response', listOutput.text);
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return packageServiceV4;
    },
    /*
     * service for Order API version 2 request definition
     */
    getOrderAPIServiceV2: function () {
        let orderServiceV2 = LocalServiceRegistry.createService('EswOrderAPIV2Service', {
            createRequest: function (service, params) {
                let clientID = eswHelper.getClientID(),
                    bearerToken = 'Bearer ' + params.eswOAuthToken;

                clientID = clientID.substring(0, clientID.indexOf('.'));
                service.URL = service.URL.replace(/{brandID}+/g, clientID); // eslint-disable-line no-param-reassign
                service.URL = service.URL.replace(/{brandOrderReference}+/g, params.orderID); // eslint-disable-line no-param-reassign

                service.addHeader('Content-Type', 'application/json');
                service.addHeader('Authorization', bearerToken);

                service.setRequestMethod('post');
                eswHelper.eswInfoLogger('Esw Order API V2 Request : ', params.requestBody);
                return params.requestBody;
            },
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Order API V2 Response', listOutput.text);
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return orderServiceV2;
    },
    /**
     * Service to call logistics return API
     * @returns {Object} - Service response
     */
    getEswOrderReturnService: function () {
        let eswOrderReturnService = LocalServiceRegistry.createService('ESWOrderReturnService', {
            createRequest: function (service, params) {
                service.addHeader('Content-Type', 'application/json');
                service.addHeader('Authorization', 'BEARER ' + params.bearerToken);
                service.setRequestMethod('post');
                eswHelper.eswInfoLogger('Esw Order Return API Request :', params.requestBody);
                return JSON.stringify(params.requestBody);
            },
            parseResponse: function (service, svcResponse) {
                eswHelper.eswInfoLogger('Esw Order Return API Response :', svcResponse.text);
                return svcResponse.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return eswOrderReturnService;
    },
    /*
     * service for MarketPlace Order API version 2 request definition
     */
    getOrderSubmitAPIServiceV2: function () {
        let orderServiceV2 = LocalServiceRegistry.createService('EswOrderAPIV2Service', {
            createRequest: function (service, params) {
                let clientID = eswHelper.getClientID(),
                    bearerToken = 'Bearer ' + params.bearerToken;

                clientID = clientID.substring(0, clientID.indexOf('.'));
                service.URL = service.URL.replace(/{brandID}+/g, clientID); // eslint-disable-line no-param-reassign
                service.URL = service.URL.replace(/{brandOrderReference}+/g, ''); // eslint-disable-line no-param-reassign
                service.URL = service.URL.replace(/OrderActivity+/g, ''); // eslint-disable-line no-param-reassign
                service.URL = service.URL.replace(/.{0,2}$/, ''); // eslint-disable-line no-param-reassign
                service.addHeader('Content-Type', 'application/json');
                service.addHeader('Authorization', bearerToken);
                service.setRequestMethod('post');
                eswHelper.eswInfoLogger('Esw MarketPlace Order API Request :', params.requestBody);
                return JSON.stringify(params.requestBody);
            },
            parseResponse: function (service, svcResponse) {
                eswHelper.eswInfoLogger('Esw MarketPlace Order API Response :', svcResponse.text);
                return svcResponse.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return orderServiceV2;
    },
    /**
     * Service for Catalog API
     * @returns {Object} - Service response
     */
    getCatalogService: function () {
        let catalogService = LocalServiceRegistry.createService('ESWCatalogService', {
            createRequest: function (service, params) {
                let bearerToken = 'Bearer ' + params.eswOAuthToken;
                service.addHeader('Content-Type', 'application/json');
                service.addHeader('Authorization', bearerToken);
                service.setRequestMethod('POST');
                eswHelper.eswInfoLogger('Esw  Catalog Service Request : ', JSON.stringify(params.requestBody));
                return JSON.stringify(params.requestBody);
            },
            parseResponse: function (service, svcResponse) {
                eswHelper.eswInfoLogger('Esw Catalog Service Response :', svcResponse.text);
                return svcResponse;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return catalogService;
    }
};
/**
 * Helper method to export the helper
 * @returns {Object} - service object.
 */
function getEswServices() {
    return eShopWorldServices;
}

module.exports = {
    getEswServices: getEswServices
};
