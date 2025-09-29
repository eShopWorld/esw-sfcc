'use strict';
/**
 * Helper script to get all ESW services
 **/
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Constants = require('*/cartridge/scripts/util/Constants');

const eShopWorldOcapiServices = {
    ocapiBasketService: function () {
        let basketPatchService = LocalServiceRegistry.createService('EswOcapiBasketService', {
            createRequest: function (service, args) {
                let serviceUrl = service.URL;
                var bearerToken = !args.authToken || empty(args.authToken) ? request.httpHeaders.authorization : args.authToken;
                if (service.URL.indexOf('{basket_id}') === -1) {
                    if (args.basketId) {
                        serviceUrl += args.basketId;
                    }
                    service.URL = serviceUrl;
                    if (args.countryCode) {
                        service.URL += Constants.COUNTRY_CODE + args.countryCode;
                    }
                }

                if (args.basketId) {
                    service.URL = service.URL.replace(/{basket_id}+/g, args.basketId);
                }

                service.URL = service.URL.replace(/{siteId}+/g, args.siteID);
                service.addHeader('Authorization', bearerToken);
                service.addHeader('Content-Type', 'application/json');
                service.setRequestMethod(args.httpMethod);
                return JSON.stringify(args.payload);
            },
            parseResponse: function (service, svcResponse) {
                eswHelper.eswInfoLogger('Esw ocapiBasketService Response: ', JSON.stringify(svcResponse));
                return svcResponse;
            }
        });
        return basketPatchService;
    },
    ocapiOrderService: function () {
        let basketPatchService = LocalServiceRegistry.createService('EswOcapiOrderService', {
            createRequest: function (service, args) {
                let bearerToken = !args.authToken || empty(args.authToken) ? request.httpHeaders.authorization : args.authToken;
                service.addHeader('Authorization', bearerToken);
                let requestBody = { basket_id: args.basketId };
                if (args.countryCode && service.URL.indexOf('{siteId}') === -1) {
                    let svcUrl = service.URL + '?country-code=' + args.countryCode;
                    service.setURL(svcUrl);
                } else {
                    requestBody.c_countryCode = args.countryCode;
                }
                service.URL = service.URL.replace(/{siteId}+/g, args.siteID);
                service.addHeader('Content-Type', 'application/json');
                service.setRequestMethod(args.httpMethod);
                return JSON.stringify(requestBody);
            },
            parseResponse: function (service, svcResponse) {
                eswHelper.eswInfoLogger('Esw ocapiOrderService Response: ', JSON.stringify(svcResponse));
                return svcResponse;
            }
        });
        return basketPatchService;
    }
};
module.exports = {
    getEswOcapiServices: eShopWorldOcapiServices
};
