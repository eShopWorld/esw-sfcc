
'use strict';

const Site = require('dw/system/Site');
const eswCoreBmHelper = require('*/cartridge/scripts/helper/eswBmHelper');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

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
 * Return the countries configs
 * @returns {Array} - array of countries
 */
function getCountriesConfigurations() {
    let allCountriesCO = eswHelper.queryAllCustomObjects('ESW_COUNTRIES', '', 'custom.name asc'),
        countriesArr = [];
    if (allCountriesCO.count > 0) {
        while (allCountriesCO.hasNext()) {
            let countryDetail = allCountriesCO.next();
            let countryCode = countryDetail.getCustom().countryCode;
            if (!empty(countryCode)) {
                countriesArr.push({
                    countryCode: countryCode,
                    isFixedPriceModel: countryDetail.getCustom().isFixedPriceModel || false,
                    name: countryDetail.getCustom().name,
                    defaultCurrencyCode: countryDetail.getCustom().defaultCurrencyCode,
                    eswCountrylocale: countryDetail.getCustom().eswCountrylocale,
                    baseCurrencyCode: countryDetail.getCustom().baseCurrencyCode,
                    isSupportedByESW: countryDetail.getCustom().isSupportedByESW,
                    isLocalizedShoppingFeedSupported: countryDetail.getCustom().isLocalizedShoppingFeedSupported,
                    ESW_HUB_Address: {
                        hubAddress: countryDetail.getCustom().hubAddress,
                        hubAddressState: countryDetail.getCustom().hubAddressState,
                        hubAddressCity: countryDetail.getCustom().hubAddressCity,
                        hubAddressPostalCode: countryDetail.getCustom().hubAddressPostalCode
                    }
                });
            }
        }
    }
    return countriesArr;
}
/**
 * Return the currencies configs
 * @returns {Array} - array of currencies
 */
function getAllowedCurrencies() {
    let allowedCurrencies = [],
        allowedCurrenciesCO = eswHelper.queryAllCustomObjects('ESW_CURRENCIES', 'custom.isSupportedByESW = true', 'custom.name asc');
    if (allowedCurrenciesCO.count > 0) {
        while (allowedCurrenciesCO.hasNext()) {
            let EswAllowedCurrency = allowedCurrenciesCO.next();
            allowedCurrencies.push({
                currencyCode: EswAllowedCurrency.getCustom().currencyCode,
                displayValue: EswAllowedCurrency.getCustom().name,
                isSupportedByESW: EswAllowedCurrency.getCustom().isSupportedByESW
            });
        }
    }
    return allowedCurrencies;
}
/**
 * Return the type of the field
 * @param {number} fieldTypeDwId - fieldTypeDwId (Class ObjectAttributeDefinition)
 * @returns {string} - string of type input
 */
function getFieldType(fieldTypeDwId) {
    return eswCoreBmHelper.getFieldType(fieldTypeDwId);
}
/**
 * Map the given attribute definition to a simple object
 * @param {dw/value/ObjectAttributeDefinition} attributeDefinition The attribute definition to map as simple object
 * @returns {Object} The mapping object
 */
function mapAttribute(attributeDefinition) {
    return eswCoreBmHelper.mapAttribute(attributeDefinition);
}

/**
 * Map the given attribute group to a simple object
 *
 * @param {dw/value/ObjectAttributeGroup} groupDefinition The attribute group to map as simple object
 * @param {string} groupURL The URL of the group from the BM
 * @param {string} appendedParameter The parameter to append to the groupURL that will contain the group ID
 *
 * @returns {Object} The attribute group
 */
function mapGroup(groupDefinition, groupURL, appendedParameter) {
    return eswCoreBmHelper.mapGroup(groupDefinition, groupURL, appendedParameter);
}
/**
 * Loads the groups & attributes from the given preferences instance
 *
 * @param {dw/object/ExtensibleObject} preferences The preferences from which to load the groups & attributes
 * @param {string} groupURL The URL of the group from the BM
 * @param {string} appendedParameter The parameter to append to the groupURL that will contain the group ID
 * @param {string} groupId The parameter to filter the group ID
 *
 * @returns {Array} The result array
 */
function loadGroups(preferences, groupURL, appendedParameter, groupId) {
    return eswCoreBmHelper.loadGroups(preferences, groupURL, appendedParameter, groupId);
}
/**
 * Function to create new Array which will replace the preferences based on the API/SFTP upload method
 * @param {Array} sitePrefFieldsAttributes - Site Preferences for Catalog
 * @param {Object} relatedMethodFields - Fields for API and SFTP upload
 * @returns {Array} sitePrefs - New Array with fields specific to API/SFTP
 */
function removeElements(sitePrefFieldsAttributes, relatedMethodFields) {
    let uploadMethod = eswHelper.getCatalogUploadMethod(),
        sitePrefs = [];
    for (let i = 0; i < sitePrefFieldsAttributes.length; i++) {
        if (sitePrefFieldsAttributes[i].id === 'isEswCatalogFeatureEnabled') {
            sitePrefs.push(sitePrefFieldsAttributes[i]);
        } else if (uploadMethod === 'sftp' && relatedMethodFields.sftpFields.indexOf(sitePrefFieldsAttributes[i].id) !== -1) {
            sitePrefs.push(sitePrefFieldsAttributes[i]);
        } else if (uploadMethod === 'api' && relatedMethodFields.apiFields.indexOf(sitePrefFieldsAttributes[i].id) !== -1) {
            sitePrefs.push(sitePrefFieldsAttributes[i]);
        }
    }
    return !empty(sitePrefs) ? sitePrefs : sitePrefFieldsAttributes;
}
/**
 * Function to return masked data
 * @param {string} passwordInput - passwordInput
 * @returns {string} maskedPassword - maskedPassword
 */
function maskPassword(passwordInput) {
    let maskedPassword = '';
    for (let i = 0; i < passwordInput.length; i++) {
        maskedPassword += '*'; // Replace each character with an asterisk
    }
    return maskedPassword;
}
/**
 * Function to return service Url
 * @param {string} serviceID - serviceID
 * @returns {string} serviceUrl - serviceurl
 */
function getServiceUrl(serviceID) {
    let logger = require('dw/system/Logger');
    let eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
    let serviceUrl = null;
    try {
        switch (serviceID) {
            case 'EswPriceFeedService':
                serviceUrl = eswCoreService.getPricingAdvisorService().getURL();
                break;
            case 'ESWCatalogService':
                serviceUrl = eswCoreService.getCatalogService().getURL();
                break;
            case 'EswOrderAPIV2Service':
                serviceUrl = eswCoreService.getOrderAPIServiceV2().getURL();
                break;
            case 'EswPackageV4Service':
                serviceUrl = eswCoreService.getPackageServiceV4().getURL();
                break;
            case 'EswOAuthService':
                serviceUrl = eswCoreService.getOAuthService().getURL();
                break;
            case 'eswCheckoutService':
                serviceUrl = eswCoreService.getPreorderServiceV2().getURL();
                break;
            case 'ESWSFTP':
                serviceUrl = eswCoreService.getESWSFTPService().getURL();
                break;
            default:
                break;
        }
    } catch (error) {
        logger.error('Error while fetching service URL {0} ', error);
    }
    return serviceUrl;
}
/**
 * Return the refactored all prefrences in array JSON format
 * @param {Object} customObject - Site Preferences group
 * @returns {Array} - array of object
 */
function refactorCustomObjectResponse(customObject) {
    let collections = require('*/cartridge/scripts/util/collections');
    let jsonPrefrencesArray = [];
    let prefrences = customObject.attributes;

    if (!empty(prefrences)) {
        // Iterate over the array using a for loop
        for (let i = 0; i < prefrences.length; i++) {
            let obj = prefrences[i];
            if (['eswBaseCurrency', 'eswInstance', 'eswPriceFeedInstance', 'eswRedirect', 'eswCatalogFeedDelimiter'].indexOf(obj.id) !== -1) {
                jsonPrefrencesArray.push({
                    displayName: obj.id,
                    value: obj.currentValue.value
                });
            } else if (['eswClientSecret', 'eswBasicAuthPassword', 'eswProductionClientSecret'].indexOf(obj.id) !== -1) {
                jsonPrefrencesArray.push({
                    displayName: obj.id,
                    value: maskPassword(obj.currentValue)
                });
            } else if (obj.id === 'eswReturnOrderType') {
                jsonPrefrencesArray.push({
                    displayName: obj.id,
                    value: obj.currentValue.displayValue
                });
            } else if (obj.id === 'eswLocalizedPricingCountries' || obj.id === 'eswLocalizedPromotions' || obj.id === 'eswOverrideShipping' || obj.id === 'eswCatalogFeedProductCustomAttrFieldMapping') {
                jsonPrefrencesArray.push({
                    displayName: obj.id,
                    value: !empty(obj.currentValue) ? JSON.parse(obj.currentValue) : ''
                });
            } else if (obj.type.type === 'Set of String') {
                let listArray = [];
                collections.forEach(obj.enumValues, function (enumValue) {
                    listArray.push(enumValue.value);
                });
                jsonPrefrencesArray.push({
                    displayName: obj.id,
                    value: listArray
                });
            } else {
                jsonPrefrencesArray.push({
                    displayName: obj.id,
                    value: obj.currentValue
                });
            }
        }
    }
    return jsonPrefrencesArray;
}
/**
 * Function to create Config Report
 * @param {string} csrf - csrf
 * @returns {Array} sitePrefs - New Array with fields specific to API/SFTP
 */
function loadReport(csrf) {
    let logger = require('dw/system/Logger');
    let URLUtils = require('dw/web/URLUtils');
    let Resource = require('dw/web/Resource');
    let configReport = [];
    let lastModified;
    let checkoutServiceName = eswHelper.getCheckoutServiceName();
    let system = require('dw/system/System');

    try {
        let retailerSitePrefFields = loadGroups(
            Site.getCurrent().getPreferences(),
            URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
            '#/?preference#site_preference_group_attributes!id!{0}',
            'ESW Retailer Display Configuration'
        );
        let generalSitePrefFields = loadGroups(
            Site.getCurrent().getPreferences(),
            URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
            '#/?preference#site_preference_group_attributes!id!{0}',
            'ESW General Configuration'
        );
        let pricingSitePrefFields = loadGroups(
            Site.getCurrent().getPreferences(),
            URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
            '#/?preference#site_preference_group_attributes!id!{0}',
            'ESW Pricing Configuration'
        );
        let catalogSitePrefFields = loadGroups(
            Site.getCurrent().getPreferences(),
            URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
            '#/?preference#site_preference_group_attributes!id!{0}',
            'ESW Catalog Integration Configuration'
        );
        let checkoutSitePrefFields = loadGroups(
            Site.getCurrent().getPreferences(),
            URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
            '#/?preference#site_preference_group_attributes!id!{0}',
            'ESW Checkout Configuration'
        );
        let packageSitePrefFields = loadGroups(
            Site.getCurrent().getPreferences(),
            URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
            '#/?preference#site_preference_group_attributes!id!{0}',
            'ESW Package Integration Configuration'
        );
        let allowedLocales = Site.getCurrent().getAllowedLocales().toArray();
        let allowedCurrencies = Site.getCurrent().getAllowedCurrencies().toArray();
        configReport.push(
            {
                SiteConfigs: {
                    site: Site.getCurrent().getID(),
                    eswCartridgeVersion: Resource.msg('esw.cartridges.version.label', 'esw', null) + Resource.msg('esw.cartridges.version.number', 'esw', null),
                    sfccArchitectVersion: Resource.msg('global.version.number', 'version', null),
                    sfccCompatibilityMode: system.getCompatibilityMode()
                }
            },
            {
                ESWConfigs: {
                    storefront: {
                        customPrefrences: {
                            ESWGeneralConfiguration: refactorCustomObjectResponse(generalSitePrefFields),
                            ESWRetailerDisplayConfiguration: refactorCustomObjectResponse(retailerSitePrefFields)
                        }
                    },
                    pricing: {
                        customPrefrences: {
                            ESWPricingConfiguration: refactorCustomObjectResponse(pricingSitePrefFields)
                        },
                        'Service URL:': {
                            EswPriceFeedService: getServiceUrl('EswPriceFeedService')
                        }
                    },
                    Catalog: {
                        'Custom Preference Groups:': {
                            'ESW Catalog Configuration': refactorCustomObjectResponse(catalogSitePrefFields)
                        },
                        'Service URL:': {
                            ESWCatalogService: getServiceUrl('ESWCatalogService'),
                            ESWSFTP: getServiceUrl('ESWSFTP')

                        }
                    },
                    Package: {
                        'Custom Preference Groups:': {
                            'ESW Package Integration Configuration': !empty(packageSitePrefFields) ? refactorCustomObjectResponse(packageSitePrefFields) : {}
                        },
                        'Service URL:': {
                            EswPackageV4Service: getServiceUrl('EswPackageV4Service')
                        }
                    },
                    Checkout: {
                        'Custom Preference Groups:': {
                            'ESW Checkout Configuration': refactorCustomObjectResponse(checkoutSitePrefFields)
                        },
                        'Service URL:': {
                            EswOrderAPIV2Service: getServiceUrl('EswOrderAPIV2Service')
                        }
                    },
                    services: {
                        EswOAuthService: getServiceUrl('EswOAuthService')
                    },
                    customObjects: {
                        ESWCountries: getCountriesConfigurations(),
                        ESWCurrencies: getAllowedCurrencies(),
                        ESWPAData: eswHelper.getPricingAdvisorData()
                    }
                },
                GlobalConfigs: {
                    allowedLocales: allowedLocales,
                    allowedCurrencies: allowedCurrencies,
                    ShippingMethods: {},
                    OrderConfigs: {}
                }
            }
        );
        if (configReport && Array.isArray(configReport)) {
            // Check if configReport has at least three elements
            if (configReport.length > 1) {
                let nestedObject = configReport[1].ESWConfigs.Checkout['Service URL:'];
                nestedObject[checkoutServiceName] = getServiceUrl('eswCheckoutService');
            }
        }
        lastModified = updateIntegrationMonitoring(JSON.stringify(configReport));
    } catch (error) {
        logger.error('Error while updating config object {0} ', error);
        let eswIntegrationMonitoringObject = eswHelper.getCustomObjectDetails('ESW_INTEGRATION_MONITORING', 'ESW_INTEGRATION_MONITORING');
        if (!empty(eswIntegrationMonitoringObject)) {
            configReport = !empty(eswIntegrationMonitoringObject.custom.configReport) ? JSON.parse(eswIntegrationMonitoringObject.custom.configReport) : configReport;
            lastModified = !empty(eswIntegrationMonitoringObject) ? eswHelper.formatTimeStamp(eswIntegrationMonitoringObject.lastModified) : null;
        }
    }
    configReport.push(lastModified);
    return configReport;
}

exports.loadGroups = loadGroups;
exports.removeElements = removeElements;
exports.getFieldType = getFieldType;
exports.mapGroup = mapGroup;
exports.mapAttribute = mapAttribute;
exports.loadReport = loadReport;
exports.updateIntegrationMonitoring = updateIntegrationMonitoring;
