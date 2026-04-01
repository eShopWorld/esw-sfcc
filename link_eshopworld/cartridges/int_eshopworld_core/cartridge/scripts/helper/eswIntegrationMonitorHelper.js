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
 * Removes requestMethod and responses fields from each service object in the array to save it properly in custom object.
 * @param {Array} services - Array of service objects
 * @returns {Array} - Cleaned array
 */
function deleteUnwantedServiceFields(services) {
    if (!services || typeof services !== 'object') return services;
    let cleanedServices = {};
    Object.keys(services).forEach(function (serviceName) {
        let service = services[serviceName];
        if (service && typeof service === 'object') {
            let cleaned = {};
            Object.keys(service).forEach(function (key) {
                if (key !== 'requestMethod' && key !== 'responses') {
                    cleaned[key] = service[key];
                }
            });
            cleanedServices[serviceName] = cleaned;
        } else {
            cleanedServices[serviceName] = service;
        }
    });
    return cleanedServices;
}

/**
 * Updates the monitoring configuration object and saves to custom object.
 * @param {string} configReport - JSON stringified config report object
 * @param {string} serviceReport - JSON stringified array of service objects
 * @returns {string|null} - last modified time or null if not found
 */
function updateIntegrationMonitoring(configReport, serviceReport) {
    const Transaction = require('dw/system/Transaction');
    let CustomObjectMgr = require('dw/object/CustomObjectMgr');
    let eswIntegrationMonitoring = CustomObjectMgr.getCustomObject('ESW_INTEGRATION_MONITORING', 'ESW_INTEGRATION_MONITORING');
    // Clean the serviceReport before saving (remove requestMethod and responses)
    let parsedServices = JSON.parse(serviceReport);
    let cleanedServiceReport = JSON.stringify(deleteUnwantedServiceFields(parsedServices));
    Transaction.wrap(function () {
        if (eswIntegrationMonitoring) {
            CustomObjectMgr.remove(eswIntegrationMonitoring);
        }
        eswIntegrationMonitoring = CustomObjectMgr.createCustomObject('ESW_INTEGRATION_MONITORING', 'ESW_INTEGRATION_MONITORING');
        eswIntegrationMonitoring.getCustom().configReport = configReport;
        eswIntegrationMonitoring.getCustom().eswServices = cleanedServiceReport;
    });
    return !empty(eswIntegrationMonitoring) ? eswHelper.formatTimeStamp(eswIntegrationMonitoring.lastModified) : null;
}
/**
 * Updates inUse and lastExecuted time for a non-job service.
 * @param {string} serviceName - The name of the service.
 * @param {Array} filteredResponses - Array of responses for this service.
 * @param {Object} serviceExecutionStatus - The status map for this request.
 * @returns {Object} Object with inUse and lastExecuted fields
 */
function updateNonJobServiceStatusAndTime(serviceName, filteredResponses, serviceExecutionStatus) {
    let inUse = false;
    let lastExecuted = null;
    try {
        let isNonJob = !eswHelper.isJobRelatedService(serviceName);
        let isEnabled = eswHelper.isNonJobServiceEnabled(serviceName);
        if (isNonJob && isEnabled && Array.isArray(filteredResponses) && filteredResponses.length > 0) {
            let hasSuccessResponse = filteredResponses.some(function (resp) {
                return resp.statusCode && resp.statusCode === 200;
            });
            if (hasSuccessResponse) {
                inUse = true;
                lastExecuted = eswHelper.getCurrentFormattedDate();
            }
        } else if (isNonJob && !isEnabled && Array.isArray(filteredResponses) && filteredResponses.length > 0) {
            let hasSuccessResponse = filteredResponses.some(function (resp) {
                return resp.statusCode && resp.statusCode === 200;
            });
            if (hasSuccessResponse || eswHelper.isMockServiceCallled(serviceName)) {
                inUse = true;
                lastExecuted = eswHelper.getCurrentFormattedDate();
            }
        }
        // If not in use, keep previous lastExecuted if present
        if (!inUse && serviceExecutionStatus[serviceName] && serviceExecutionStatus[serviceName].lastExecuted) {
            lastExecuted = serviceExecutionStatus[serviceName].lastExecuted;
        }
    } catch (err) {
        require('dw/system/Logger').warn('updateServiceLastExecuted error for {0}: {1}', serviceName, err && err.toString ? err.toString() : err);
    }
    serviceExecutionStatus[serviceName] = { inUse: inUse, lastExecuted: lastExecuted };
    return { inUse: inUse, lastExecuted: lastExecuted };
}
/**
 * Collects all shipping methods as an array of objects.
 * @returns {Array} Array of shipping method objects.
 */
function getShippingMethodsArray() {
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
    return shippingMethodArr;
}
/**
 * Loads previous eswServices from the custom object for job-related preservation.
 * @returns {Object} Returns an object containing previous eswServices state for job-related preservation.
 */
function getPreviousEswServices() {
    let CustomObjectMgr = require('dw/object/CustomObjectMgr');
    let eswIntegrationMonitoring = CustomObjectMgr.getCustomObject('ESW_INTEGRATION_MONITORING', 'ESW_INTEGRATION_MONITORING');
    let previousEswServices = {};
    if (eswIntegrationMonitoring && eswIntegrationMonitoring.getCustom().eswServices) {
        try {
            previousEswServices = JSON.parse(eswIntegrationMonitoring.getCustom().eswServices);
        } catch (e) {
            previousEswServices = {};
        }
    }
    return previousEswServices;
}


/**
 * Builds the serviceConfigs object for all ESW services, handling job/non-job logic internally.
 * @returns {Object} Returns an object containing service configuration for all ESW services.
 */
function buildServiceConfigs() {
    let eswServicesHelper = require('*/cartridge/scripts/helper/eswServices');
    let Constants = require('*/cartridge/scripts/util/Constants');
    let serviceNames = Object.keys(Constants.ESW_SERVICES_URLS);
    let serviceResponses = eswHCTableHelper.getResponses(serviceNames);
    let previousEswServices = getPreviousEswServices();
    let serviceExecutionStatus = {};
    let serviceConfigs = {};

    serviceNames.forEach(serviceName => {
        let url = eswServicesHelper.getEswServiceUrl(serviceName);
        let requestMethod = url ? getRequestMethod(serviceName) : null;
        let filteredResponses = url
            ? serviceResponses.filter(response => response.serviceName === serviceName)
            : null;
        let isJob = eswHelper.isJobRelatedService(serviceName);
        let statusObj;
        if (!isJob) {
            statusObj = updateNonJobServiceStatusAndTime(serviceName, filteredResponses, serviceExecutionStatus);
        } else {
            statusObj = previousEswServices[serviceName] || { inUse: false, lastExecuted: null };
            serviceExecutionStatus[serviceName] = statusObj;
        }
        serviceConfigs[serviceName] = {
            serviceUrl: url || null,
            inUse: statusObj.inUse,
            isJobRelated: isJob,
            lastExecuted: statusObj.lastExecuted,
            requestMethod,
            responses: filteredResponses || null
        };
    });
    return serviceConfigs;
}
/**
 * Retrieves the logs JSON object containing site configuration and integration monitoring data.
 * @returns {Object} A JSON object with site configuration and integration monitoring details.
 */
function getLogsJson() {
    let config = {
        siteInformation: {
            site: Site.getCurrent().getID(),
            eswCartridgeVersion: Resource.msg('esw.cartridges.version.label', 'esw', null) + Resource.msg('esw.cartridges.version.number', 'esw', null),
            sfccArchitectVersion: Resource.msg('global.version.number', 'version', null),
            sfccCompatibilityMode: system.getCompatibilityMode()
        },
        sitePreferences: getSitePreferencesCustomObjects(),
        customObjects: {
            EswCountries: eswHelper.getCountriesConfigurations(),
            EswCurrencies: eswHelper.getAllowedCurrencies(),
            EswPaData: eswHelper.getPricingAdvisorData(),
            EswIntegrationMonitoringReport: eswHelper.getEswMonitoringReport()
        },
        services: buildServiceConfigs(),
        globalConfigs: {
            allowedLocales: Site.getCurrent().getAllowedLocales().toArray(),
            allowedCurrencies: Site.getCurrent().getAllowedCurrencies().toArray(),
            ShippingMethods: getShippingMethodsArray(),
            OrderConfigs: {}
        }
    };
    config.lastModifed = updateIntegrationMonitoring(JSON.stringify(config), JSON.stringify(config.services));
    return config;
}


module.exports = {
    getLogsJson,
    getRequestMethod,
    updateIntegrationMonitoring,
    updateNonJobServiceStatusAndTime,
    deleteUnwantedServiceFields
};
