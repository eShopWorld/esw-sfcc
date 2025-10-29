'use strict';

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

/**
 * This function will check if ESW Spark Dynamic Pricing is enabled and return the class name to be applied to the DOM element.
 * @param {string} className - The class name to be applied if ESW Spark Dynamic Pricing is enabled.
 * @returns {string} - The class name if ESW Spark Dynamic Pricing is enabled, otherwise an empty string.
 */
function applySparkClassToDom(className){
    try{
        if(eswHelper.isEswEnabledSparkPricingConversion()) {
            return className;
        }
    }catch(e){
        return '';
    }
    return '';
}

exports.applySparkClassToDom = applySparkClassToDom
