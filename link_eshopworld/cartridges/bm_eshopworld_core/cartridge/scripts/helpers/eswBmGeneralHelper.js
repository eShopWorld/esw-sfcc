
'use strict';

const Site = require('dw/system/Site');

/**
 * Return the type of the field
 * @param {number} fieldTypeDwId - fieldTypeDwId (Class ObjectAttributeDefinition)
 * @returns {string} - string of type input
 */
function getFieldType(fieldTypeDwId) {
    let fieldTypes = {
        8: {
            type: 'Boolean',
            template: 'form-fields/boolean-field'
        },
        6: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        11: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        12: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        31: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        33: {
            type: 'Set of String',
            template: 'form-fields/dropdown-field'
        },
        5: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        7: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        1: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        9: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        2: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        13: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        10: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        21: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        22: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        23: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        3: {
            type: 'String',
            template: 'form-fields/string-field'
        },
        4: {
            type: 'Text',
            template: 'form-fields/text-field'
        }
    };
    return fieldTypes[fieldTypeDwId];
}
/**
 * Map the given attribute definition to a simple object
 * @param {dw/value/ObjectAttributeDefinition} attributeDefinition The attribute definition to map as simple object
 * @returns {Object} The mapping object
 */
function mapAttribute(attributeDefinition) {
    let mappedAttribute = {
        id: attributeDefinition.getID(),
        displayName: attributeDefinition.getDisplayName(),
        defaultValue: attributeDefinition.getDefaultValue(),
        isMandatory: attributeDefinition.isMandatory(),
        completeObjInfo: attributeDefinition.getObjectTypeDefinition(),
        type: getFieldType(attributeDefinition.valueTypeCode),
        enumValues: attributeDefinition.getValues()
    };
    let customPrefVal = Site.getCurrent().getCustomPreferenceValue(attributeDefinition.getID());
    if (mappedAttribute.type.type === 'Boolean') {
        mappedAttribute.currentValue = customPrefVal;
    } else {
        mappedAttribute.currentValue = customPrefVal || '';
    }
    return mappedAttribute;
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
    return {
        id: groupDefinition.getID(),
        bm_link: groupURL.toString() + require('dw/util/StringUtils').format(appendedParameter, groupDefinition.getID()),
        displayName: groupDefinition.getDisplayName(),
        description: groupDefinition.getDescription(),
        attributes: groupDefinition.getAttributeDefinitions().toArray().map(mapAttribute)
    };
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
    var describe = preferences.describe();
    var preferencesGroups = describe.getAttributeGroups().toArray().map(function (groupDefinition) {
        if (groupDefinition.ID === groupId) {
            return mapGroup(groupDefinition, groupURL, appendedParameter);
        }
        return null;
    }).filter(function (preferencesGroup) {
        return !empty(preferencesGroup);
    });
    if (groupId && typeof groupId !== 'undefined') {
        return preferencesGroups[0];
    }
    return preferencesGroups;
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
