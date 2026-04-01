'use strict';

// Import SFCC API classes
const HTTPClient = require('dw/net/HTTPClient');
const Site = require('dw/system/Site');
const Logger = require('dw/system/Logger');

const eswCoreHelpers = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Constants = require('*/cartridge/scripts/util/E2EConstants');
// --- CONFIGURATION ---
const SANDBOX_URL = Constants.SANDBOX_URL;
const AM_URL = Constants.AM_URL;
const CLIENT_ID = Constants.CLIENT_ID;
const CLIENT_SECRET = Constants.CLIENT_SECRET;
const OCAPI_VERSION = Constants.OCAPI_VERSION;

// set to var as it is used in multiple functions
var log = Logger.getLogger('EswE2ELogger', 'EswE2ELogger');

/**
 * Retrieves an OAuth2 access token by making a direct call to the Account Manager.
 * @private
 * @returns {string|null} The access token string, or null if an error occurred.
 */
function getDataAccessToken() {
  let httpClient = new HTTPClient();
  let tokenUrl = AM_URL + '/dw/oauth2/access_token';

  httpClient.open('POST', tokenUrl);
  httpClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

  // Send all parameters in the body
  let body =
    'grant_type=client_credentials&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET;
  httpClient.send(body);

  if (httpClient.statusCode === 200) {
    let response = JSON.parse(httpClient.text);
    return response.access_token;
  }
  log.error(
    'Failed to get access token. Status: {0}, Response: {1}',
    httpClient.statusCode,
    httpClient.errorText
  );
  return null;
}

/**
 * Updates custom site preferences for the current site using dw.net.HTTPClient.
 * @param {Array<Object>} preferenceConfig - An oject containing preference IDs and their new values.
 *   Example: { id: 'c_myCustomPref1', value: 'newValue' }
 * @param {string} preferenceGroup - A string representing the preference group ID.
 *   Example: 'ESW General Configuration'
 * @returns {Object} An object containing the result. On success, it's the parsed OCAPI response.
 *                   On failure, it contains an 'error' flag and 'errorMessage'.
 */
function updateSitePreferences(preferenceConfig, preferenceGroup) {
  let errorResponse = null;
  // Get Authentication Token ---
  let accessToken = getDataAccessToken();
  if (!accessToken) {
    log.error('Could not obtain access token.');
    return { error: true, errorMessage: 'Could not obtain access token.' };
  }

  // Construct the CORRECT API URL
  let encodedGroupId = encodeURIComponent(preferenceGroup);
  let apiUrl =
    SANDBOX_URL +
    '/s/-/dw/data/' +
    OCAPI_VERSION +
    '/sites/' +
    Site.getCurrent().getID() +
    '/site_preferences/preference_groups/' +
    encodedGroupId +
    '/sandbox?mask_passwords=true';

  let payload = preferenceConfig;

  let patchClient = new HTTPClient();
  patchClient.open('PATCH', apiUrl); // Use the same corrected URL
  patchClient.setRequestHeader('Authorization', 'Bearer ' + accessToken);
  patchClient.setRequestHeader('Content-Type', 'application/json');
  patchClient.setRequestHeader('x-dw-client-id', CLIENT_ID);

  patchClient.send(JSON.stringify(payload));

  if (patchClient.statusCode === 200) {
    let customPrefResponse = JSON.parse(patchClient.text);
    // Return only the updated preferences
    let updatedKey = {};
    Object.keys(customPrefResponse).forEach(function (key) {
      if (key.indexOf(Object.keys(preferenceConfig)[0]) !== -1) {
        updatedKey[key] = customPrefResponse[key];
      }
    });
    return { updatedKey };
  } else {
    errorResponse = patchClient.errorText;
    return {
      error: true,
      errorMessage: errorResponse,
      statusCode: patchClient.statusCode
    };
  }
}

/**
 * Finds and combines pricing, adjustment, and rounding data based on the shopper's context.
 * It searches through the provided data sources to find the matching rules for the given country and currency.
 *
 * @param {string} shopperCountry - The two-letter ISO code for the shopper's country (e.g., 'IE').
 * @param {string} shopperCurrency - The three-letter ISO code for the shopper's currency (e.g., 'EUR').
 * @param {string} retailerCurrency - The three-letter ISO code for the retailer's base currency (e.g., 'USD' or 'EUR').
 * @returns {Object|null} A new object containing the combined data, or null if any required part cannot be found.
 */
function getPaData(shopperCountry, shopperCurrency, retailerCurrency) {
  // --- Data Sources (as provided in the prompt) ---
  let paDataResponse = eswCoreHelpers.getPricingAdvisorData();

  // 1. FX Rates Data
  let fxRatesData = paDataResponse.fxRates;

  // 2. Country Adjustments Data
  let countryAdjustmentsData = paDataResponse.countryAdjustment;

  // 3. Rounding Rules Data
  let roundingRulesData = paDataResponse.roundingModels;

  // --- Logic to find and combine data ---

  let foundFxRate = null;
  let foundCountryAdjustment = null;
  let foundRoundingRule = null;

  // Find the correct FX Rate
  for (let i = 0; i < fxRatesData.length; i++) {
    let rateInfo = fxRatesData[i];
    if (
      rateInfo.fromRetailerCurrencyIso === retailerCurrency &&
      rateInfo.toShopperCurrencyIso === shopperCurrency
    ) {
      // Create a new object for the result, converting rate to a string as requested.
      foundFxRate = {
        fromRetailerCurrencyIso: rateInfo.fromRetailerCurrencyIso,
        rate: String(rateInfo.rate),
        toShopperCurrencyIso: rateInfo.toShopperCurrencyIso
      };
      break;
    }
  }

  // Find the correct Country Adjustment
  for (let j = 0; j < countryAdjustmentsData.length; j++) {
    let adjustmentInfo = countryAdjustmentsData[j];
    if (adjustmentInfo.deliveryCountryIso === shopperCountry) {
      foundCountryAdjustment = adjustmentInfo;
      break;
    }
  }

  // Find the correct Rounding Rule
  for (let k = 0; k < roundingRulesData.length; k++) {
    let roundingCountryInfo = roundingRulesData[k];
    if (roundingCountryInfo.deliveryCountryIso === shopperCountry) {
      if (roundingCountryInfo.roundingModels && roundingCountryInfo.roundingModels.length > 0) {
        // Find the specific currency model within the country's rules
        for (let l = 0; l < roundingCountryInfo.roundingModels.length; l++) {
          let model = roundingCountryInfo.roundingModels[l];
          if (model.currencyIso === shopperCurrency) {
            foundRoundingRule = model;
            break; // Exit inner loop
          }
        }
      }
      break; // Exit outer loop
    }
  }

  // If all three parts were successfully found, construct the final object
  if (foundFxRate && foundCountryAdjustment && foundRoundingRule) {
    return {
      paVersion: eswCoreHelpers.getPaVersion(),
      fxRates: foundFxRate,
      countryAdjustments: foundCountryAdjustment,
      roundingRules: foundRoundingRule
    };
  }

  // Return null if any piece of required information could not be found
  return null;
}

/**
 * returns e2e configurantions
 * @returns {Object|null} A new object containing the combined data, or null if any required part cannot be found.
 */
function getE2eConfigurations() {
  let currentSite = Site.getCurrent();
  let configData;
  try {
    configData = JSON.parse(request.httpParameterMap.requestBodyAsString || '{}');
  } catch (e) {
    response.setStatus(400);
    response.getWriter().write(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  let shopperCountry = configData.eswLocationIso;
  let shopperCountryDetail = eswCoreHelpers.getSelectedCountryDetail(shopperCountry);
  let retailerBaseCurrency = eswCoreHelpers.getBaseCurrencyPreference();
  let paDataResponse = getPaData(
    shopperCountry,
    shopperCountryDetail.defaultCurrencyCode,
    retailerBaseCurrency
  );

  let configs = {
    eswCurrency: shopperCountryDetail.defaultCurrencyCode,
    countryUrlParam: currentSite.getCustomPreferenceValue('eswCountryUrlParam'),
    paData: paDataResponse,
    paVersion: eswCoreHelpers.getPaVersion()
  };

  if (configData.prefSettings && 'c_eswAbTastyScriptPath' in configData.prefSettings) {
    configs.isAbTastyEnabled = eswCoreHelpers.isEswEnabledAbTasty();
    if (configs.isAbTastyEnabled) {
      configs.eswAbTastyScriptPath = eswCoreHelpers.getEswAbTastyScriptPaths();
      delete configData.prefSettings.c_eswAbTastyScriptPath;
    } else {
      configs.eswAbTastyScriptPath = configData.prefSettings.c_eswAbTastyScriptPath;
    }
  }
  configs.sitePrefRes = updateSitePreferences(configData.prefSettings, configData.prefGroup);

  if (configData.prefSettings && 'c_eswOverrideShipping' in configData.prefSettings) {
    configs.overrideShipping = eswCoreHelpers.getEswOverrideShipping(shopperCountry);
  }
  // eslint-disable-next-line consistent-return
  return configs;
}

function returnPreorderWithPayload(preorderResult, preorderPayload) {
  return {
    result: preorderResult,
    preorderReqPayload: preorderPayload
  };
}

exports.updateSitePreferences = updateSitePreferences;
exports.getDataAccessToken = getDataAccessToken;
exports.getPaData = getPaData;
exports.getE2eConfigurations = getE2eConfigurations;
exports.returnPreorderWithPayload = returnPreorderWithPayload;
