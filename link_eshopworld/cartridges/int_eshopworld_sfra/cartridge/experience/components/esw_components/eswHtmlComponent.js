'use strict';

const Template = require('dw/util/Template');
const HashMap = require('dw/util/HashMap');
const Site = require('dw/system/Site');

const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

/**
 * Render logic for the storefront.editorialRichText component
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    let model = modelIn || new HashMap();
    let content = context.content;
    model.eswHtmlContent = content.get('eswHtmlContent') || null;
    model.isEswEnabled = eswCoreHelper.getEShopWorldModuleEnabled();
    model.countryUrlParam = Site.current.getCustomPreferenceValue('eswCountryUrlParam');
    model.selectedCountry = request.httpParameterMap.get(Site.current.getCustomPreferenceValue('eswCountryUrlParam'));
    return new Template(
    'experience/components/esw_components/eswHtmlComponent'
  ).render(model).text;
};
