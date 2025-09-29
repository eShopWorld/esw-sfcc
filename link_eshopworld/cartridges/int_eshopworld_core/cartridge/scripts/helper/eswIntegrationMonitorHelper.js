'use strict';

const Site = require('dw/system/Site');
const Logger = require('dw/system/Logger').getLogger('SitePrefsUtil', 'getCustomSitePrefsJsonString');
const EnumValue = require('dw/value/EnumValue');
const system = require('dw/system/System');
const Resource = require('dw/web/Resource');
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const eswHCTableHelper = require('*/cartridge/scripts/helpers/eswHealthCheckTableHelper');

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

/**
 * Checks if a string starts with the prefix "esw" (case-insensitive)
 * AND is NOT one of the specific excluded attribute IDs.
 * Compatible with older JavaScript engines like ES4/Rhino used in SFCC.
 *
 * @param {string} attributeID The string to check.
 * @returns {boolean} True if the string starts with "esw" (case-insensitive)
 *                    AND is not in the exclusion list, false otherwise.
 */
function isContainEswAndNonExcludedFields(attributeID) {
    // Ensure input is a string
    if (typeof attributeID !== 'string') {
        return false;
    }

    // Define the exclusion list
    let exclusionList = [
        'eswProductionClientSecret',
        'eswClientSecret',
        'eswBasicAuthPassword'
    ];

    // 1. Check if the string is in the exclusion list
    if (exclusionList.indexOf(attributeID) !== -1) {
        return false; // If it's excluded, immediately return false
    }

    // 2. Check if the string is long enough for the prefix
    if (attributeID.length < 3) {
        return false; // Too short to have the "esw" prefix
    }

    // 3. Check for the "esw" prefix case-insensitively
    let prefix = attributeID.substring(0, 3);
    let hasPrefix = prefix.toLowerCase() === 'esw';

    // Return true only if it has the prefix AND was not excluded
    return hasPrefix;
}

/**
 * Retrieves all custom attributes and their values from the current site's preferences.
 *
 * @returns {Object} A key-value map where keys are the custom attribute IDs
 *                   and values are the corresponding values from the current site's preferences.
 *                   Returns an empty object if no site context is available, if the
 *                   SitePreferences definition cannot be found, or if an error occurs.
 */
function getSitePreferencesCustomObjects() {
    let currentSite = Site.getCurrent();
    let prefsJsonString = '{}'; // Default to empty JSON object string

    if (!currentSite) {
        Logger.error('Cannot stringify site preferences: No current site context available.');
        return prefsJsonString;
    }

    let sitePrefs = currentSite.getPreferences();
    if (!sitePrefs) {
        Logger.error("Cannot stringify site preferences: Could not retrieve preferences for site '{0}'.", currentSite.getID());
        return prefsJsonString;
    }

    let customAttributes = sitePrefs.getCustom();
    if (!customAttributes) {
        Logger.warn("Site '{0}' preferences object has no 'custom' attributes property or it's null.", currentSite.getID());
        return prefsJsonString;
    }

    let plainJavaScriptObject = {};

    // Iterate over the keys of the custom object
    Object.keys(customAttributes).forEach(function (attributeID) {
        if (isContainEswAndNonExcludedFields(attributeID)) {
            try {
                var attrVal = customAttributes[attributeID];
                if (attrVal instanceof EnumValue) {
                    attrVal = attrVal.value;
                }
                if (!empty(attrVal) && attrVal.length && typeof attrVal === 'object') {
                    attrVal = '';
                    for (let i = 0; i < customAttributes[attributeID].length; i++) {
                        attrVal = attrVal + ',' + customAttributes[attributeID][i];
                    }
                    attrVal = attrVal.trim();
                }
                plainJavaScriptObject[attributeID] = attrVal;
            } catch (e) {
                plainJavaScriptObject[attributeID] = null;
            }
        }
    });

    return plainJavaScriptObject;
}

/**
 * Retrieves the URL of a given service by its ID.
 *
 * @param {string} serviceID - The ID of the service to retrieve the URL for.
 * @returns {string|null} The URL of the service if found, or null if not found or an error occurs.
 */
function getServiceUrl(serviceID) {
    var service;
    var url = null;

    if (!serviceID) {
        Logger.warn('Service ID parameter is required for getServiceUrl.');
        return null;
    }

    try {
        service = LocalServiceRegistry.createService(serviceID, {});

        if (service) {
            var configuration = service.getConfiguration();
            if (configuration) {
                var credential = configuration.getCredential();
                if (credential) {
                    var rawUrl = credential.getURL();
                    if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') {
                        url = rawUrl;
                    } else {
                        Logger.warn("URL is not configured or is empty for credential of service '{0}'.", serviceID);
                    }
                } else {
                    Logger.warn("Could not retrieve credential for service '{0}'.", serviceID);
                }
            } else {
                Logger.warn("Could not retrieve configuration for service '{0}'.", serviceID);
            }
        }
    } catch (e) {
        Logger.error("Error retrieving service '{0}' or its URL: {1}", serviceID, e.toString());
        url = null;
    }

    return url;
}
/**
 * Retrieves the HTTP request method for a given service by its ID.
 *
 * @param {string} serviceID - The ID of the service to retrieve the request method for.
 * @returns {string|null} The HTTP request method (e.g., 'GET', 'POST') if found, or null if not found or an error occurs.
 */
function getRequestMethod(serviceID) {
    try {
        const service = LocalServiceRegistry.createService(serviceID, {});
        if (service) {
            return service.requestMethod;
        }
    } catch (e) {
        Logger.error("Error retrieving request method for service '{0}': {1}", serviceID, e.toString());
    }
    return null;
}

/**
 * update monitoring configuration object
 * @param {Object} configReport - configReport object
 * @returns {Time | null} - last modified time or null if not found
 */
function updateIntegrationMonitoring(configReport) {
    const Transaction = require('dw/system/Transaction');
    let CustomObjectMgr = require('dw/object/CustomObjectMgr');
    let eswIntegrationMonitoring = CustomObjectMgr.getCustomObject('ESW_INTEGRATION_MONITORING', 'ESW_INTEGRATION_MONITORING');
    Transaction.wrap(function () {
        if (eswIntegrationMonitoring) {
            CustomObjectMgr.remove(eswIntegrationMonitoring);
        }
        eswIntegrationMonitoring = CustomObjectMgr.createCustomObject('ESW_INTEGRATION_MONITORING', 'ESW_INTEGRATION_MONITORING');
        eswIntegrationMonitoring.getCustom().configReport = configReport;
    });
    return !empty(eswIntegrationMonitoring) ? eswHelper.formatTimeStamp(eswIntegrationMonitoring.lastModified) : null;
}

/**
 * Retrieves the logs JSON object containing site configuration and integration monitoring data.
 *
 * @returns {Object} A JSON object with site configuration and integration monitoring details.
 */
function getLogsJson() {
    // Getting Shipping methods
    let shippingMethodArr = [];
    let shipMethodsItr = dw.order.ShippingMgr.getAllShippingMethods().iterator();
    while (shipMethodsItr.hasNext()) {
        let shippingMethod = shipMethodsItr.next();
        shippingMethodArr.push({
            name: shippingMethod.getDisplayName(),
            active: shippingMethod.isOnline(),
            id: shippingMethod.getID(),
            currency: shippingMethod.getCurrencyCode()
        });
    }

    // Getting services configs
    let eswServices = [
        'EswOAuthService',
        'EswPriceFeedService',
        'ESWSFTP',
        'EswPackageV4Service',
        'EswCheckoutV3Service.SFRA',
        'ESWCatalogService',
        'EswGetAsnPackage',
        'EswAzureInsightService',
        'EswOcapiDataAuthService'
    ];

    let serviceConfigs = [];
    let validServices = eswServices.filter(function (serviceID) {
        let serviceUrl = getServiceUrl(serviceID);
        return serviceUrl && serviceUrl.trim() !== '';
    });

    let serviceResponses = eswHCTableHelper.getResponses(validServices);

    eswServices.forEach(function (serviceID) {
        let serviceUrl = getServiceUrl(serviceID);
        serviceUrl = serviceUrl && serviceUrl.includes('{brandID}')
            ? serviceUrl.replace(/{brandID}+/g, eswHelper.getClientID().split('.')[0])
            : serviceUrl;

        let requestMethod = serviceUrl ? getRequestMethod(serviceID) : null;

        let filteredResponses = serviceUrl
            ? serviceResponses.filter(function (response) {
                return response.serviceName === serviceID;
            })
            : null;

        serviceConfigs.push({
            serviceId: serviceID,
            serviceUrl: serviceUrl || null,
            requestMethod: requestMethod,
            responses: filteredResponses || null
        });
    });

    let config = {
        siteInformation: null,
        sitePreferences: null,
        customObjects: null
    };
    config.siteInformation = {
        site: Site.getCurrent().getID(),
        eswCartridgeVersion: Resource.msg('esw.cartridges.version.label', 'esw', null) + Resource.msg('esw.cartridges.version.number', 'esw', null),
        sfccArchitectVersion: Resource.msg('global.version.number', 'version', null),
        sfccCompatibilityMode: system.getCompatibilityMode()
    };
    config.sitePreferences = getSitePreferencesCustomObjects();
    config.customObjects = {
        EswCountries: eswHelper.getCountriesConfigurations(),
        EswCurrencies: eswHelper.getAllowedCurrencies(),
        EswPaData: eswHelper.getPricingAdvisorData()
    };
    config.services = serviceConfigs;
    config.globalConfigs = {
        allowedLocales: Site.getCurrent().getAllowedLocales().toArray(),
        allowedCurrencies: Site.getCurrent().getAllowedCurrencies().toArray(),
        ShippingMethods: shippingMethodArr,
        OrderConfigs: {}
    };
    config.lastModifed = updateIntegrationMonitoring(JSON.stringify(config));
    return config;
}

module.exports = {
    getLogsJson,
    getRequestMethod,
    updateIntegrationMonitoring
};
