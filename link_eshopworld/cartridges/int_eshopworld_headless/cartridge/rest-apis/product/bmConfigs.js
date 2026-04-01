
'use strict';


/* API includes */
const logger = require('dw/system/Logger');
const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');

const eswCoreBmHelper = require('*/cartridge/scripts/helper/eswBmHelper');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const Currency = require('dw/util/Currency');
const RESTResponseMgr = require('dw/system/RESTResponseMgr');

exports.getBmConfigs = function () {
    let responseJSON;
    try {
        let configFields = eswCoreBmHelper.loadGroups(
            Site.getCurrent().getPreferences(),
            URLUtils.url('ViewApplication-BM'),
            '#/?preference#site_preference_group_attributes!id!{0}',
            'ESW General Configuration'
        ).attributes;
        let filteredFields = {};
        // Add allowed fields in this array
        let allwedResponseFields = ['eswEshopworldModuleEnabled', 'eswEnableTaxInformation'];
        for (let i = 0; i < configFields.length; i++) {
            let configFieldId = configFields[i].id;
            if (allwedResponseFields.indexOf(configFieldId) !== -1) {
                filteredFields[configFieldId] = configFields[i].currentValue;
            }
        }

        let selectedCountryDetail = eswHelper.getCountryDetailByParam(request.httpParameters.get('c_country')[0]);
        let selectedCountryLocalizeObj = eswHelper.getCountryLocalizeObj(selectedCountryDetail);

        filteredFields.defaultLoaderText = Resource.msg('message.default.esw.loading', 'esw', null);
        if (eswHelper.isEswEnabledEmbeddedCheckout()) {
            filteredFields.eswEmbeddedCheckoutScriptPath = eswHelper.getEswEmbCheckoutScriptPath();
        }

        if (eswHelper.checkIsEswAllowedCountry(selectedCountryDetail.countryCode)) {
            filteredFields.eswNativeShippingEnabled = eswHelper.isEswNativeShippingHidden() ? !eswHelper.isSelectedCountryOverrideShippingEnabled(selectedCountryDetail.countryCode) : false;
            filteredFields.eswNativeShippingEnabledMsg = Resource.msg('hide.shipping.disclaimer.msg', 'esw', null);
        }
        filteredFields.eswgetTopLevelDomain = eswHelper.getTopLevelDomain();

        // Ab Tasty fields
        filteredFields.isAbTastyEnabled = eswHelper.isEswEnabledAbTasty();
        filteredFields.abTastyScriptPath = filteredFields.isAbTastyEnabled ? eswHelper.getEswAbTastyScriptPaths() : null;

        filteredFields.isEswEnabledEmbeddedCheckout = eswHelper.isEswEnabledEmbeddedCheckout();
        if (filteredFields.isEswEnabledEmbeddedCheckout === true) {
            try {
                const embCheckoutHelper = require('*/cartridge/scripts/helper/eckoutHelper').eswEmbCheckoutHelper;
                filteredFields.ecCookieName = embCheckoutHelper.getEswIframeCookieName();
            } catch (e) {
                filteredFields.ecCookieName = null;
            }
        }
        filteredFields.isEnabledMultiOrigin = eswHelper.isEnabledMultiOrigin();
        eswHelper.setLocation(selectedCountryDetail.countryCode);
        eswHelper.createCookie('esw.location', selectedCountryDetail.countryCode, '/');
        eswHelper.createCookie('esw.currency', selectedCountryDetail.defaultCurrencyCode, '/');
        responseJSON = {
            eswBmConfigs: filteredFields,
            shopperPricingConfigs: {
                code: selectedCountryDetail.defaultCurrencyCode,
                symbol: Currency.getCurrency(selectedCountryDetail.defaultCurrencyCode).symbol,
                isFixedPriceModel: selectedCountryDetail.isFixedPriceModel,
                fxRate: !empty(selectedCountryLocalizeObj.selectedFxRate) ? selectedCountryLocalizeObj.selectedFxRate.rate : null,
                roundingModel: selectedCountryLocalizeObj.selectedRoundingRule,
                countryAdjustments: selectedCountryLocalizeObj.selectedCountryAdjustments
            }
        }
    } catch (e) {
        logger.error('ESW BMConfigs Error: {0}', e.message);
        responseJSON = {
            ResponseCode: '400',
            ResponseText: 'Error: Internal error',
            errorMessage: e.message
        };
    }
    RESTResponseMgr
        .createSuccess(responseJSON)
        .render();
};

exports.getBmConfigs.public = true;
