'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const URLUtils = require('dw/web/URLUtils');
const Site = require('dw/system/Site').getCurrent();
const Constants = require('*/cartridge/scripts/util/Constants');

/**
 * Retrieves the ESW tenant from the client ID.
 * @returns {string} tenant extracted from clientID
 */
function getEswTenant() {
    let eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

    let clientId = eswCoreHelper.getClientID();
    let dotIndex = clientId.indexOf('.');
    if (dotIndex !== -1) {
        return clientId.substring(0, dotIndex);
    } else {
        return clientId;
    }
}
/**
 * Retrieves the domain suffix based on the current environment.
 * @returns {string} domain suffix based on environment
 */
function getDomainSuffix() {
    let eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let environment = eswCoreHelper.getSelectedInstance();
    let domainSuffix = 'com';
    switch (environment) {
        case 'production':
            domainSuffix = 'com';
            break;
        case 'test':
            domainSuffix = 'net';
            break;
        default:
            domainSuffix = 'com';
            break;
    }
    return domainSuffix;
}
/**
 * Retrieves the API version for the given service name.
 * @param {string} serviceName - The name of the ESW service.
 * @returns {string} The API version for the ESW service.
 */
function getApiVersion(serviceName) {
    let eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let apiVersion;
    switch (serviceName) {
        case 'EswPriceFeedService': {
            let paVersionInUse = eswCoreHelper.getPaVersion().toLowerCase();
            apiVersion = paVersionInUse.indexOf('v3') !== -1 ? 'v3' : '4.0';
            break;
        }
        case 'EswPackageV4Service':
            apiVersion = 'v4';
            break;
        case 'ESWOrderReturnService':
            apiVersion = 'v2.1';
            break;
        case 'ESWCatalogService':
            apiVersion = 'v2';
            break;
        case 'EswGetAsnPackage':
            apiVersion = 'v4';
            break;
        default:
            if (serviceName.indexOf('EswCheckoutV3Service') !== -1) {
                apiVersion = 'v3';
            } else if (serviceName.indexOf('EswCheckoutV2Service') !== -1) {
                apiVersion = 'v2';
            } else {
                apiVersion = 'N-A';
            }
            break;
    }
    return apiVersion;
}
/**
 * Retrieves the service URL from Business Manager for the given service name.
 * @param {string} serviceName - Service named defined in Business Manager.
 * @returns {string} The service URL.
 */
function getServiceUrlFromTheBm(serviceName) {
    try {
        let serviceCreds = LocalServiceRegistry.createService(serviceName, {
            parseResponse: function (service) {
                return service;
            }
        });
        return serviceCreds.getURL();
    } catch (e) {
        return `No service ${serviceName} found in BM`;
    }
}

/**
 * Extracts the instance ID from a SFCC hostname.
 * @returns {string} The instance ID, or empty string if not found.
 */
function getInstanceHostname() {
    return URLUtils.https('Home-Show').toString().split('//')[1].split('/')[0];
}
/**
 * Returns the OCAPI version for SFCC. Default is 'v21_3'.
 * @returns {string} The OCAPI version string.
 */
function getOcapiVersion() {
    return 'v23_1';
}

/**
 * return v3 serive advisor URL
 * @param {string} serviceName - The name of the ESW service.
 * @param {string} apiVersion - The apiVersion.
 * @returns {string|null} service advisor service URL, or null if not found.
 */
function getServiceVersionAdvisor(serviceName, apiVersion) {
    if (serviceName && serviceName === 'EswPriceFeedService' && apiVersion && apiVersion === 'v3') {
        return Constants.ESW_V3_PRICING_ADVISOR_SERVICE;
    }
    return null;
}

/**
 * Returns the ESW service URL for the given service name.
 * @param {string} serviceName - The name of the ESW service.
 * @returns {string} The URL of the ESW service.
 */
function getEswServiceUrl(serviceName) {
    let eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let serviceUrl = null;
    let eswServices = Constants.ESW_SERVICES_URLS;
    let tenant = getEswTenant();
    let domainSuffix = getDomainSuffix();
    let apiVersion = getApiVersion(serviceName);
    let bmServiceUrl = getServiceUrlFromTheBm(serviceName);
    let serviceVersionAdvisor = getServiceVersionAdvisor(serviceName, apiVersion);
    let unmappedServiceUrl = eswServices[serviceName];
    let bmHostname = getInstanceHostname();
    let ocapiVersion = getOcapiVersion();
    let siteId = Site.getID();
    if (empty(bmServiceUrl)) {
        serviceUrl = unmappedServiceUrl
                .replace('{tenant}', tenant)
                .replace('{environment}', eswCoreHelper.getSelectedInstance())
                .replace('{domainSuffix}', domainSuffix)
                .replace('{version}', apiVersion)
                .replace('{bmHostname}', bmHostname)
                .replace('{siteId}', siteId)
                .replace('{ocapiVersion}', ocapiVersion)
                .replace(Constants.ESW_V4_PRICING_ADVISOR_SERVICE, !empty(serviceVersionAdvisor) ? serviceVersionAdvisor : Constants.ESW_V4_PRICING_ADVISOR_SERVICE);
    } else {
        serviceUrl = bmServiceUrl;
    }

    return serviceUrl;
}

// TODO: Remove this function after testing
/**
 * Logs all ESW service URLs for debugging purposes.
 */
function logAllServicesUrls() {
    let eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let eswServices = Constants.ESW_SERVICES_URLS;
    let servicesUrls = [];
    Object.keys(eswServices).forEach(function (serviceName) {
        let url = getEswServiceUrl(serviceName);
        servicesUrls.push({
            serviceName: serviceName,
            url: url
        });
    });
    eswCoreHelper.eswInfoLogger('Service URLs: ', eswCoreHelper.beautifyJsonAsString(servicesUrls));
}

/**
 * Retrieves the service URL from BM plus dynamic service URL builder.
 * @param {string} serviceName - Service named defined in Business Manager.
 * @returns {string} The service URL.
 */
function getLastExecutedServiceUrl(serviceName) {
    try {
        let serviceCreds = LocalServiceRegistry.createService(serviceName, {
            createRequest: function (service) {
                service.URL = getEswServiceUrl(serviceName);
            },
            parseResponse: function (service) {
                return service;
            }
        });
        serviceCreds.call();
        return serviceCreds.getURL();
    } catch (e) {
        return `No service ${serviceName} found in BM`;
    }
}

exports.getEswServiceUrl = getEswServiceUrl;
exports.logAllServicesUrls = logAllServicesUrls;
exports.getOcapiVersion = getOcapiVersion;
exports.getServiceUrlFromTheBm = getServiceUrlFromTheBm;
exports.getLastExecutedServiceUrl = getLastExecutedServiceUrl;
