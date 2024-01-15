
'use strict';

const eswCoreBmHelper = require('*/cartridge/scripts/helper/eswBmHelper');

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
    const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
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

exports.loadGroups = loadGroups;
exports.removeElements = removeElements;
exports.getFieldType = getFieldType;
exports.mapGroup = mapGroup;
exports.mapAttribute = mapAttribute;
