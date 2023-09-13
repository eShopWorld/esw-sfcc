/**
 * Job to check health for all services and webhooks
 */
'use strict';

const Status = require('dw/system/Status');
const System = require('dw/system/System');
const Logger = require('dw/system/Logger').getLogger('ESWHealthCheckJobLog', 'ESWHealthCheckJobLog');
/**
 * Returns checkout payload
 * @returns {Object} - Payload
 */
function getCheckoutSamplePayload() {
    return {
        'contactDetails': [],
        'retailerPromoCodes': [],
        'lineItems': [
            {
                'quantity': 'number',
                'estimatedDeliveryDateFromRetailer': null,
                "lineItemId": 'number',
                "product": {
                    "productCode": "string",
                    "upc": null,
                    "title": "string",
                    "description": "string",
                    "productUnitPriceInfo": {
                        "price": {
                            "currency": "string",
                            "amount": "number"
                        },
                        "discounts": []
                    },
                    "imageUrl": "https://path/to/url.com",
                    "color": "string",
                    "size": "string",
                    "isNonStandardCatalogItem": 'boolean',
                    "metadataItems": null,
                    "isReturnProhibited": 'boolean'
                },
                "cartGrouping": "string",
                "metadataItems": null
            }
        ],
        "shopperCurrencyIso": "string",
        "pricingSynchronizationId": null,
        "deliveryCountryIso": "string",
        "retailerCheckoutExperience": {
            "BaseUrl": "https://site_url",
            "ContinueShoppingUrl": "https://continue/shopping/url",
            "BackToCartUrl": "https://back/to/cart/url",
            "InventoryCheckFailurePageUrl": "https://inventory/check/url",
            "metadataItems": [
                {
                    "Name": "OrderConfirmationUri_TestOnly",
                    "Value": "https://order/confirmation.url"
                },
                {
                    "Name": "OrderConfirmationBase64EncodedAuth_TestOnly",
                    "Value": "string"
                }
            ]
        },
        "shopperCheckoutExperience": {
            "useDeliveryContactDetailsForPaymentContactDetails": false,
            "emailMarketingOptIn": false,
            "registeredProfileId": null,
            "shopperCultureLanguageIso": "en-US",
            "expressPaymentMethod": null,
            "metadataItems": null,
            "sessionTimeout": 'number'
        },
        "deliveryOptions": [
            {
                "deliveryOption": "POST",
                "deliveryOptionOverridePriceInfo": {
                    "price": {
                        "currency": "string",
                        "amount": "number"
                    },
                    "discounts": []
                },
                "metadataItems": null
            },
            {
                "deliveryOption": "EXP2",
                "deliveryOptionOverridePriceInfo": {
                    "price": {
                        "currency": "string",
                        "amount": "number"
                    },
                    "discounts": []
                },
                "metadataItems": null
            }
        ],
        "retailerCartId": "string"
    };
}
/**
 * Return a catalog service payload
 * @returns {Object} - Service payload example
 */
function getCatalogServicePayload() {
    return {
        "productCode": "2xi9orvams8",
        "name": "8bgdmt42v5t",
        "description": "qk6hdfti0s",
        "material": "FABRIC 53% cotton, 21% polyester, 21% acrylic, 4% viscose, 1% polyester, lining 100% polyester",
        "countryOfOrigin": "IT",
        "hsCode": "62043290",
        "hsCodeRegion": "EU",
        "category": null,
        "gender": null,
        "ageGroup": null,
        "size": null,
        "weight": null,
        "weightUnit": null,
        "url": null,
        "imageUrl": null,
        "unitPrice": null,
        "dangerousGoods": null,
        "additionalProductCode": null,
        "variantProductCode": null
    };
}


/**
 * Return a service payload
 * @returns {Object} - Service payload example
 */
function getServicesMock() {
    let eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    /* eslint quote-props: off */
    /* eslint quotes: off */
    return {
        EswOAuthService: {
            payload: {
                grant_type: 'client_credentials',
                scope: 'checkout.preorder.api.all',
                client_id: eswCoreHelper.getClientID(),
                client_secret: eswCoreHelper.getClientSecret()
            },
            type: 'service'
        },
        'EswCheckoutV2Service.SFRA': {
            payload: getCheckoutSamplePayload(),
            type: 'service'
        },
        ESWOrderReturnService: {
            payload: {
                bearerToken: 'fake_bearer_token',
                requestBody: {}
            },
            type: 'service'
        },
        'EswCheckoutV3Service.SFRA': {
            payload: getCheckoutSamplePayload(),
            type: 'service'
        },
        'EswCheckoutV2Service.SG': {
            payload: getCheckoutSamplePayload(),
            type: 'service'
        },
        EswPackageV4Service: {
            payload: {
                eswOAuthToken: 'fake_bearer_token',
                requestBody: {}
            },
            type: 'service'
        },
        'EswOrderAPIV2Service': {
            payload: {
                requestBody: JSON.stringify({
                    activityStatus: 'string',
                    reasonCode: 'string',
                    settlementReference: 'number',
                    transactionReference: 'number',
                    transactionDateTime: new Date(),
                    actionedBy: 'string',
                    actionedByUser: 'email@email.com'
                }),
                eswOAuthToken: 'fake_bearer_token',
                orderID: 'number'
            },
            type: 'service'
        },
        EswPriceFeedV3Service: {
            payload: 'fake_bearer_token',
            type: 'service'
        },
        EswPriceFeedV4Service: {
            payload: 'fake_bearer_token',
            type: 'service'
        },
        CancelOrder: {
            payload: {},
            url: 'EShopWorld-CancelOrder',
            type: 'webhook',
            httpMethod: 'POST'
        },
        ReturnOrder: {
            payload: {},
            url: 'EShopWorld-ProcessWebHooks',
            type: 'webhook',
            httpMethod: 'POST'
        },
        ESWCatalogService: {
            payload: {
                bearerToken: 'fake_bearer_token',
                requestBody: getCatalogServicePayload()
            },
            type: 'service'
        }
    };
}
/**
 * execute the job
 * @param {Object} args - Job params
 * @returns {dw.system.Status} - Status of job
 */
function execute(args) {
    let Resource = require('dw/web/Resource');
    let eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let eswFileHelper = require('*/cartridge/scripts/helper/eswFileHelper').eswFileHelper;
    let eswHealthCheckHelper = require('*/cartridge/scripts/helper/eswHealthCheckHelper').eswHealthCheckHelper;
    try {
        let eswDiagnosticData = {
            sfccArchitectVersion: Resource.msg('global.version.number', 'version', 'SG'),
            eswCartridgeVersion: Resource.msg('esw.cartridges.version.number', 'int_eshopworld_core', '3.8.2')
        };
        let servicesMockObj = getServicesMock();
        let keys = Object.keys(servicesMockObj);
        let fileName = '/ESWHealthLog-' + eswFileHelper.getCurrnetDateIsoString() + '.json';
        let isCheckoutServiceLoged = false;
        let responseToWrite = [{
            systemInfo: {
                timeStamp: System.getCalendar().getTime().toUTCString(),
                instanceType: System.getInstanceType(),
                compatibilityMode: System.getCompatibilityMode(),
                instanceTimeZone: System.getInstanceTimeZone(),
                checkoutVersion: eswCoreHelper.getCheckoutServiceName(),
                sfccArchitectureVersion: eswDiagnosticData.sfccArchitectVersion,
                eswCartridgeVersion: eswDiagnosticData.eswCartridgeVersion
            }
        }];
        for (let i = 0; i < keys.length; i++) {
            let serviceData = servicesMockObj[keys[i]];
            let serviceName = keys[i];
            let isServiceEnabled = true;
            let isUsingService = true;
            let serviceResponse = null;
            let responseLog = {};
            let checkoutServiceNameRegex = serviceName.match(/EswCheckout(.*?)/gi);
            if (serviceData.type === 'service') {
                isServiceEnabled = eswHealthCheckHelper.isServiceInUse(serviceName);
                isUsingService = isServiceEnabled.inUse;
                if (isCheckoutServiceLoged && (checkoutServiceNameRegex && !empty(checkoutServiceNameRegex) && checkoutServiceNameRegex.length > 0)) {
                    /* eslint no-continue: off */
                    continue;
                }
                serviceResponse = isUsingService ? eswHealthCheckHelper.getServiceRes(serviceName, serviceData) : null;
                if (!empty(serviceResponse)) {
                    responseLog = {
                        serviceName: isServiceEnabled.serviceName,
                        isOk: !eswHealthCheckHelper.serviceHasError(serviceResponse.getError()),
                        errorCode: serviceResponse.getError(),
                        errorMessage: serviceResponse.getErrorMessage(),
                        isServiceInUse: isUsingService
                    };
                }
            } else {
                serviceResponse = eswHealthCheckHelper.callHttp(serviceData.httpMethod, serviceData.url);
                responseLog = {
                    webhook: serviceData.url,
                    webhookName: serviceName,
                    errorCode: serviceResponse.statusCode,
                    errorMessage: serviceResponse.message,
                    isOk: serviceResponse.statusCode !== 404
                };
            }
            if (!empty(responseLog)) {
                let isExistedLog = false;
                // eslint-disable-next-line no-loop-func
                responseToWrite.forEach(function (serviceLog) {
                    if ('serviceName' in serviceLog && serviceLog.serviceName === isServiceEnabled.serviceName) {
                        isExistedLog = true;
                    }
                });
                if (!isExistedLog) {
                    responseToWrite.push(responseLog);
                    if (serviceName.type === 'service' && checkoutServiceNameRegex && !empty(checkoutServiceNameRegex) && checkoutServiceNameRegex.length > 0) {
                        isCheckoutServiceLoged = true;
                    }
                }
            }
        }
        if (!empty(responseToWrite)) {
            let logFile = eswFileHelper.createFile(args.impexDirPath, fileName);
            eswFileHelper.writeFile(logFile, true, JSON.stringify(responseToWrite));
        }
    } catch (e) {
        Logger.error('EswHealthChecJobError' + JSON.stringify(e));
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
