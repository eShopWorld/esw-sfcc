'use strict';

/**
 * Helper script to get all ESW services
 * */
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Constants = require('*/cartridge/scripts/util/Constants');
const eswServices = require('*/cartridge/scripts/helper/eswServices');

function createOcapiService(endpoint, buildRequestBody, logServiceName, serviceName) {
    let ocapiService = LocalServiceRegistry.createService(serviceName, {
        createRequest: function (service, args) {
            service.URL = eswServices.getEswServiceUrl(serviceName);

            if (serviceName === 'EswOcapiService') {
                if (service.URL.charAt(service.URL.length - 1) !== '/') {
                    service.URL += '/';
                }
                service.URL += endpoint;
            }

            let bearerToken = !args.authToken || empty(args.authToken)
                ? request.httpHeaders.authorization
                : args.authToken;

            let requestBody = buildRequestBody(service, args);

            service.addHeader('Authorization', bearerToken);
            service.addHeader('Content-Type', 'application/json');
            service.setRequestMethod(args.httpMethod);

            return JSON.stringify(requestBody);
        },

        parseResponse: function (service, svcResponse) {
            eswHelper.eswInfoLogger(logServiceName, JSON.stringify(svcResponse));
            return svcResponse;
        }
    });

    return ocapiService;
}


const eShopWorldOcapiServices = {
    ocapiBasketService: function (isScapi) {
        return createOcapiService(
            'baskets',
            function (service, args) {

                if (isScapi) {
                    if (service.URL.indexOf('{basket_id}') === -1) {
                        if (service.URL.charAt(service.URL.length - 1) !== '/') {
                            service.URL += '/';
                        }

                        service.URL += args.basketId;

                        if (args.countryCode) {
                            service.URL += Constants.COUNTRY_CODE + args.countryCode;
                        }
                    }

                    service.URL = service.URL.replace(/{siteId}+/g, args.siteID);
                } else {
                    if (service.URL.indexOf('{basket_id}') === -1) {
                        if (service.URL.charAt(service.URL.length - 1) !== '/') {
                            service.URL += '/';
                        }

                        service.URL += args.basketId;

                        if (args.countryCode) {
                            service.URL += Constants.COUNTRY_CODE + args.countryCode;
                        }
                    }
                }

                if (args.basketId) {
                    service.URL = service.URL.replace(/{basket_id}+/g, args.basketId);
                }

                return args.payload;
            },
            'Esw ocapiBasketService Response: ',
            isScapi ? 'EswOcapiBasketService' : 'EswOcapiService'
        );
    },
    ocapiOrderService: function (isScapi) {
        return createOcapiService(
            'orders',
            function (service, args) {

                let requestBody = {
                    basket_id: args.basketId
                };

                if (args.countryCode && service.URL.indexOf('{siteId}') === -1) {
                    let svcUrl = service.URL + '?country-code=' + args.countryCode;
                    service.setURL(svcUrl);
                } else {
                    requestBody.c_countryCode = args.countryCode;
                }

                if (isScapi) {
                    service.URL = service.URL.replace(/{siteId}+/g, args.siteID);
                }

                return requestBody;
            },
            'Esw ocapiOrderService Response: ',
            isScapi ? 'EswOcapiOrderService' : 'EswOcapiService'
        );
    }
};
module.exports = {
    getEswOcapiServices: eShopWorldOcapiServices
};
