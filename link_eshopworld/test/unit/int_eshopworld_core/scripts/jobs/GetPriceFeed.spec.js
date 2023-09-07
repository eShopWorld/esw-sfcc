/**
 * Script file for calling price feed service api and update site preferences from response.
 * @return {boolean} - returns execute result
 */
function execute() {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
        eswServices = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
        CustomObjectMgr = require('dw/object/CustomObjectMgr'),
        Transaction = require('dw/system/Transaction'),
        logger = require('dw/system/Logger'),
        Status = require('dw/system/Status');
    let Constants = require('*/cartridge/scripts/util/Constants');
    let eswPaV4Helper = require('*/cartridge/scripts/helper/eswHelperPav4');
    let paVersion = eswHelper.getPaVersion();
    let priceFeedV4ServiceObj;
    let priceFeedV4Result;
    let fxRates;
    let countryAdjustments;
    let rounding;
    let priceFeedV4;
    let co;
    try {
        let priceFeedServiceObj,
            priceFeedResult,
            priceFeed,
            today = new Date();

        let oAuthObj = eswServices.getPricingOAuthService(),
            dayOfAPICall = eswHelper.getDayOfLastAPICall(),
            shortenedDayOfAPICall = dayOfAPICall;
        if (!empty(dayOfAPICall)) {
            shortenedDayOfAPICall = dayOfAPICall.substring(0, dayOfAPICall.indexOf('.') + 4);
            shortenedDayOfAPICall = new Date(shortenedDayOfAPICall.concat(dayOfAPICall.substring(dayOfAPICall.length - 1)));
        }

        if (empty(shortenedDayOfAPICall) || today.toDateString() !== shortenedDayOfAPICall.toDateString()) {
            let formData = {
                'grant_type': 'client_credentials', // eslint-disable-line quote-props
                'scope': 'pricing.advisor.api.all' // eslint-disable-line quote-props
            };
            formData.client_id = eswHelper.getClientID();
            formData.client_secret = eswHelper.getSelectedPriceFeedInstance() === 'production' ? eswHelper.getProductionClientSecret() : eswHelper.getClientSecret();
            let oAuthResult = oAuthObj.call(formData);
            if (oAuthResult.status === 'OK' && !empty(oAuthResult.object)) {
                switch (paVersion) {
                    case Constants.PA_V3:
                        priceFeedServiceObj = eswServices.getPricingV3Service();
                        priceFeedResult = priceFeedServiceObj.call(JSON.parse(oAuthResult.object).access_token);

                        if (priceFeedResult.status === 'OK' && !empty(priceFeedResult.object)) {
                            priceFeed = JSON.parse(priceFeedResult.object);
                            fxRates = priceFeed.fxRates;
                            countryAdjustments = priceFeed.deliveryCountryAdjustments;
                            rounding = priceFeed.deliveryCountryRoundingModels;
                            Transaction.wrap(function () {
                                co = CustomObjectMgr.getCustomObject('ESW_PA_DATA', 'ESW_PA_DATA');

                                if (co) {
                                    CustomObjectMgr.remove(co);
                                }
                                co = CustomObjectMgr.createCustomObject('ESW_PA_DATA', 'ESW_PA_DATA');
                                co.getCustom().fxRatesJson = JSON.stringify(fxRates);
                                co.getCustom().countryAdjustmentJson = JSON.stringify(countryAdjustments);
                                co.getCustom().eswRoundingJson = JSON.stringify(rounding);
                                co.getCustom().eswPricingSynchronizationId = priceFeed.pricingSynchronizationId;
                                co.getCustom().eswPriceFeedLastUpdated = priceFeed.lastUpdated;
                            });
                        } else if (priceFeedResult.status === 'ERROR' || empty(priceFeedResult.object)) {
                            if (priceFeedResult.error === 403) {
                                logger.error('ESW PriceFeed Service Forbidden Error: 403: Make sure that service URL configurations, Client ID and Client Secret are aligned and correct.');
                                return new Status(Status.ERROR);
                            }
                            logger.error('ESW PriceFeed Service Error: {0} {1}', priceFeedResult.error, priceFeedResult.msg);
                            return new Status(Status.ERROR);
                        }
                        break;
                    case Constants.PA_V4:
                        priceFeedV4ServiceObj = eswServices.getPricingAdvisorService();
                        priceFeedV4Result = priceFeedV4ServiceObj.call(JSON.parse(oAuthResult.object).access_token);
                        if (priceFeedV4Result.status === 'OK' && !empty(priceFeedV4Result.object)) {
                            priceFeedV4 = JSON.parse(priceFeedV4Result.object);
                            Transaction.wrap(function () {
                                co = CustomObjectMgr.getCustomObject('ESW_PA_DATA', 'ESW_PA_DATA');
                                if (co) {
                                    CustomObjectMgr.remove(co);
                                }
                                co = CustomObjectMgr.createCustomObject('ESW_PA_DATA', 'ESW_PA_DATA');
                                let mappedData = eswPaV4Helper.getMapPaV4DataForCustomObject(priceFeedV4);
                                co.getCustom().fxRatesJson = JSON.stringify(mappedData.fxRates);
                                co.getCustom().countryAdjustmentJson = JSON.stringify(mappedData.countryAdjustments);
                                co.getCustom().eswRoundingJson = JSON.stringify(mappedData.roundingRules);
                            });
                        }
                        break;
                    default:
                        logger.error('ESW Get Price Feed Job Error: {0}', 'Un Identified ' + paVersion);
                }
            } else if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
                logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
                return new Status(Status.ERROR);
            }
        }
    } catch (e) {
        logger.error('ESW PriceFeed Error: {0} {1}', e.message, e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
