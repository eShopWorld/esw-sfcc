const Resource = require('dw/web/Resource');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
/**
 * Extracts the impact message based on the service ID and URL status.
 *
 * @param {string} serviceId - The ID of the service.
 * @param {boolean} isUrlSet - Whether the service URL is set.
 * @returns {string} - The impact message.
 */
function getImpactMessage(serviceId, isUrlSet) {
    switch (serviceId) {
        case 'EswOAuthService':
            return isUrlSet
                ? Resource.msg('label.sts.should.work', 'eswbm', null)
                : Resource.msg('label.sts.will.fail', 'eswbm', null);

        case 'EswCheckoutV3Service.SFRA':
            return isUrlSet
                ? Resource.msg('label.checkout.v3.should.work', 'eswbm', null)
                : Resource.msg('label.checkout.v3.will.fail', 'eswbm', null);

        case 'EswPriceFeedService':
            return isUrlSet
                ? Resource.msg('label.pa.data.updated', 'eswbm', null)
                : Resource.msg('label.pa.data.not.updated', 'eswbm', null);

        case 'ESWSFTP':
            return isUrlSet
                ? Resource.msg('label.sftp.sync.should.work', 'eswbm', null)
                : Resource.msg('label.sftp.sync.fail', 'eswbm', null);

        case 'EswPackageV4Service':
            return isUrlSet
                ? Resource.msg('label.package.v4.should.work', 'eswbm', null)
                : Resource.msg('label.package.v4.fail', 'eswbm', null);

        case 'ESWCatalogService':
            return isUrlSet
                ? Resource.msg('label.catalog.api.should.work', 'eswbm', null)
                : Resource.msg('label.catalog.api.fail', 'eswbm', null);

        case 'EswGetAsnPackage':
            return isUrlSet
                ? Resource.msg('label.asn.should.work', 'eswbm', null)
                : Resource.msg('label.asn.fail', 'eswbm', null);

        case 'EswAzureInsightService':
            return isUrlSet
                ? Resource.msg('label.azure.insight.should.work', 'eswbm', null).replace(/''/g, "'")
                : Resource.msg('label.azure.insight.fail', 'eswbm', null).replace(/''/g, "'");

        case 'EswOcapiDataAuthService':
            return isUrlSet
                ? Resource.msg('label.ocapi.data.should.work', 'eswbm', null).replace(/''/g, "'")
                : Resource.msg('label.ocapi.data.fail', 'eswbm', null).replace(/''/g, "'");

        default:
            return Resource.msg('label.service.not.operational', 'eswbm', null);
    }
}
/**
 * Transforms the given JSON object into a structured format for table rendering.
 *
 * @param {Object} sampleJson - The JSON object containing service data.
 * @returns {Array} - An array of transformed service objects with three columns: Service ID, URL, and Impact.
 */
function transformServiceDataForTable(sampleJson) {
    if (!sampleJson || !Array.isArray(sampleJson.services)) {
        throw new Error('Invalid input: sampleJson must contain a "services" array');
    }

    // Transform the services array
    return sampleJson.services.map(function (service) {
        const isUrlSet = !!service.serviceUrl;

        const statusCode = service.responses && Array.isArray(service.responses) && service.responses[0]
            ? parseInt(service.responses[0].statusCode, 10)
            : null;

        let className = 'red';
        if (isUrlSet) {
            if (statusCode === 200) {
                className = 'green';
            } else if (statusCode >= 400 && statusCode < 500) {
                className = 'yellow';
            }
        }

        return {
            serviceId: service.serviceId,
            url: service.serviceUrl || Resource.msg('label.service.url.not.set', 'eswbm', null),
            impact: getImpactMessage(service.serviceId, isUrlSet),
            statusCode: statusCode !== null ? String(statusCode) : '',
            class: className
        };
    });
}
/**
 * Transforms a given data object into a readable table format with 3 columns and class names.
 * @param {Object} data - The data object to transform (e.g., sitePreferences, siteInformation, customObjects).
 * @param {string} sectionKey - The key used to determine the section name for translations.
 * @returns {Array} - An array of objects representing the table rows.
 */
function transformDataForTable(data, sectionKey) {
    const sectionName = Resource.msg(`label.${sectionKey}.configuration`, 'eswbm', sectionKey);

    return Object.entries(data).map(function (entry) {
        const key = entry[0];
        const value = entry[1];

        const isDisabled = value === false;
        const isEmpty = value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0);

        let displayValue;
        if (isDisabled) {
            displayValue = Resource.msgf('label.preference.disabled', 'eswbm', null, key);
        } else if (isEmpty) {
            displayValue = Resource.msgf('label.preference.not.set', 'eswbm', null, key);
        } else if (Array.isArray(value) || typeof value === 'object') {
            displayValue = JSON.stringify(value, null, 2);
        } else {
            displayValue = value;
        }

        const className = isDisabled || isEmpty ? 'red' : 'green';

        return {
            sectionName,
            class: className,
            key: key,
            value: displayValue
        };
    });
}
/**
 * Generates mock payloads for various ESW services.
 *
 * @param {string} fakeBearerToken - A fake bearer token used for authentication in service payloads.
 * @returns {Object} - An object containing mock configurations for ESW services, including payloads and service types.
 */
function getServicesMock(fakeBearerToken) {
    const checkoutPayload = JSON.stringify(eswHelper.getCheckoutSamplePayload());
    const packagePayload = JSON.stringify(eswHelper.getPackageFeedPayload());
    const catalogPayload = JSON.stringify(eswHelper.getCatalogServicePayload());
    const azInsightPayload = eswHelper.getAZInsightRequestPayload('EswSfccError', 'Custom error message for testing service', 'Sample stack trace');

    return {
        EswOAuthService: {
            payload: {
                grant_type: 'client_credentials',
                scope: 'checkout.preorder.api.all',
                client_id: eswHelper.getClientID(),
                client_secret: eswHelper.getClientSecret()
            },
            type: 'service'
        },
        EswPriceFeedService: {
            payload: {
                eswOAuthToken: fakeBearerToken,
                requestBody: {}
            },
            type: 'service'
        },
        EswPackageV4Service: {
            payload: {
                eswOAuthToken: fakeBearerToken,
                requestBody: packagePayload
            },
            type: 'service'
        },
        EswGetAsnPackage: {
            payload: {
                eswOAuthToken: fakeBearerToken,
                requestBody: {
                    FromDate: '2025-04-01T00%3A00%3A00Z',
                    ToDate: '2025-04-30T23%3A59%3A59Z'
                }
            },
            type: 'service'
        },
        'EswCheckoutV3Service.SFRA': {
            payload: checkoutPayload,
            type: 'service'
        },
        ESWCatalogService: {
            payload: {
                eswOAuthToken: fakeBearerToken,
                requestBody: catalogPayload
            },
            type: 'service'
        },
        EswAzureInsightService: {
            payload: azInsightPayload,
            type: 'service'
        },
        EswOcapiBasketService: {
            payload: {
                bearerToken: fakeBearerToken,
                requestBody: []
            },
            type: 'service'
        },
        EswOcapiDataAuthService: {
            payload: {
                grant_type: 'client_credentials',
                scope: 'data_api',
                client_id: eswHelper.getClientID(),
                client_secret: eswHelper.getClientSecret()
            },
            type: 'service'
        }
    };
}

/**
 * Retrieves responses for valid services using eswHealthCheckHelper or servicesMock.
 *
 * @param {Array} validServices - List of valid service IDs with URLs.
 * @returns {Array} - Array of service responses with status and details.
 */
function getResponses(validServices) {
    const eswHealthCheckHelper = require('*/cartridge/scripts/helper/eswHealthCheckHelper').eswHealthCheckHelper;
    const bearerToken = this.generateStsToken();


    const servicesMock = this.getServicesMock(bearerToken); // Retrieve all service payloads
    const serviceResponses = [];

    validServices.forEach(function (serviceID) {
        const serviceData = servicesMock[serviceID];
        let serviceResponse = null;
        let status = null;
        let statusCode = null;
        let errorMessage = null;

        try {
            if (serviceData && serviceData.type === 'service') {
                const isServiceEnabled = eswHealthCheckHelper.isServiceInUse(serviceID);
                const isUsingService = isServiceEnabled.inUse;

                serviceResponse = isUsingService ? eswHealthCheckHelper.getServiceRes(serviceID, serviceData) : null;

                if (serviceResponse && serviceResponse.status === 'OK') {
                    status = 'SUCCESS';
                    statusCode = 200; // HTTP 200 for successful responses
                } else if (serviceResponse && serviceResponse.status === 'ERROR') {
                    if (serviceID.toLowerCase().indexOf('ocapi') === -1) {
                        // Non-OCAPI services
                        status = 'ERROR';
                        statusCode = serviceResponse.getError();
                        errorMessage = serviceResponse.getErrorMessage();
                    } else {
                        // OCAPI services
                        status = empty(serviceResponse.errorMessage) ? 'SUCCESS' : 'ERROR';
                        statusCode = empty(serviceResponse.errorMessage) ? 200 : serviceResponse.error;
                        errorMessage = serviceResponse.errorMessage || null;
                    }
                }
            }
        } catch (error) {
            status = 'ERROR';
            errorMessage = error.message;
        }

        // For services where we insert data into ESW, such as catalog and checkout,
        // a 400 (bad data) response should be treated as a 200 response,
        // since no data will be created in ESW.

        if (statusCode === 400) {
            statusCode = 200;
        }

        serviceResponses.push({
            serviceName: serviceID,
            status: status,
            statusCode: statusCode,
            response: serviceResponse ? serviceResponse.object : null,
            errorMessage: errorMessage || (serviceResponse ? serviceResponse.errorMessage : null)
        });
    });

    return serviceResponses;
}

/**
 * Generates an STS token using the specified scopes.
 *
 * @returns {string|null} - The generated STS token, or null if the request fails.
 */
function generateStsToken() {
    const eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
    const Logger = require('dw/system/Logger');

    try {
        // Get the OAuth service object
        const oAuthObj = eswCoreService.getOAuthService();

        // Prepare the form data for the OAuth request
        const formData = {
            grant_type: 'client_credentials',
            scope: 'checkout.preorder.api.all logistics.package.api.all logistics.returns.api.all pricing.advisor.api.all logistics.catalog.api.upload',
            client_id: eswHelper.getClientID(),
            client_secret: eswHelper.getClientSecret()
        };

        const oAuthResult = oAuthObj.call(formData);

        if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
            Logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
            return null;
        }

        // Parse and return the access token
        return JSON.parse(oAuthResult.object).access_token;
    } catch (error) {
        Logger.error('Error generating STS token: {0}', error.message);
        return null;
    }
}

exports.transformServiceDataForTable = transformServiceDataForTable;
exports.transformDataForTable = transformDataForTable;
exports.getServicesMock = getServicesMock;
exports.getResponses = getResponses;
exports.generateStsToken = generateStsToken;
