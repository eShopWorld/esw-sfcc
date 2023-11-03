'use strict';

const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SiteMock = require('../../../../mocks/dw/system/Site');
const LoggerMock = require('../../../../mocks/dw/system/Logger');
const ArrayList = require('../../../../mocks/dw.util.Collection');
const StringUtilsMock = require('../../../../mocks/dw/util/StringUtils');

const ObjectAttributeDefinition = require('../../../../mocks/dw/object/ObjectAttributeDefinition');
ObjectAttributeDefinition.getID = function () { return 'aFakeId'; };
ObjectAttributeDefinition.getDisplayName = function () { return 'aFakeDisplayName'; };
ObjectAttributeDefinition.getDefaultValue = function () { };
ObjectAttributeDefinition.isMandatory = function () { return true; };
ObjectAttributeDefinition.getValues = function () { };
ObjectAttributeDefinition.getObjectTypeDefinition = function () { return new ArrayList([]); };
ObjectAttributeDefinition.valueTypeCode = 8;

const ObjectAttributeGroupMock = require('../../../../mocks/dw/object/ObjectAttributeGroup');
ObjectAttributeGroupMock.getID = function () { return 'aFakeId'; };
ObjectAttributeGroupMock.getDisplayName = function () { return 'aFakeDisplayName'; };
ObjectAttributeGroupMock.getDescription = function () { return 'aFakeDescription'; };
ObjectAttributeGroupMock.getAttributeDefinitions = function () { return new ArrayList([]); };


const ObjectTypeDefMock = require('../../../../mocks/dw/object/ObjectTypeDefinition');
ObjectTypeDefMock.getAttributeGroups = function () { return new ArrayList([]); };

const ExtensibleObjectMock = require('../../../../mocks/dw/object/ExtensibleObject');
ExtensibleObjectMock.describe = function () { return ObjectTypeDefMock; };


describe('link_eshopworld/cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswBmGeneralHelper.js', function () {
    let eswBmGeneralHelpers = proxyquire('../../../../../cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswBmGeneralHelper.js', {
        'dw/system/Site': SiteMock,
        getFieldType: function () { return { type: 'Boolean', template: 'form-fields/boolean-field' }; },
        'dw/system/Logger': LoggerMock,
        'dw/util/StringUtils': StringUtilsMock,
        mapGroup: function () {
            return {
                id: 'aFakeId',
                bm_link: '/on/demandware.store/Sites-Site/default/ViewApplication-BM?csrf_token=GeMn5DfFMZmA2asyj40cmTuLjotbLJZofKkNB7h0uh_xqu-PlDE955Ot3EA2WVvarta5bvuDwkI85TsnFou6zfJV444I6zSxxrYQCqEpxTfisLrt9wX5MofADmF4NdUpa2as7kKENV1KHPClSXpgClyer5qlE4wy0Of4azwa4YJeHGgUfAo%3d#/?preference#site_preference_group_attributes!id!aFakeId',
                displayName: 'aFakeDisplayName',
                description: 'aFakeDescription',
                attributes: []
            };
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCatalogUploadMethod: function () { return 'api'; }
            }
        }
    });
    it('Should return the field type', function () {
        let fieldType = eswBmGeneralHelpers.getFieldType(8);
        chai.expect(fieldType).to.deep.equal({ type: 'Boolean', template: 'form-fields/boolean-field' });
    });
    it('Should return undefined if no field type is given', function () {
        let fieldType = eswBmGeneralHelpers.getFieldType();
        chai.expect(fieldType).to.be.undefined;
    });

    it('Should map group', function () {
        let objectAttirbutGroupeMap = eswBmGeneralHelpers.mapGroup(ObjectAttributeGroupMock, '/on/demandware.store/Sites-Site/default/ViewApplication-BM?csrf_token=GeMn5DfFMZmA2asyj40cmTuLjotbLJZofKkNB7h0uh_xqu-PlDE955Ot3EA2WVvarta5bvuDwkI85TsnFou6zfJV444I6zSxxrYQCqEpxTfisLrt9wX5MofADmF4NdUpa2as7kKENV1KHPClSXpgClyer5qlE4wy0Of4azwa4YJeHGgUfAo%3d', '#/?preference#site_preference_group_attributes!id!{0}');
        chai.expect(objectAttirbutGroupeMap).to.deep.equal({
            id: 'aFakeId',
            bm_link: '/on/demandware.store/Sites-Site/default/ViewApplication-BM?csrf_token=GeMn5DfFMZmA2asyj40cmTuLjotbLJZofKkNB7h0uh_xqu-PlDE955Ot3EA2WVvarta5bvuDwkI85TsnFou6zfJV444I6zSxxrYQCqEpxTfisLrt9wX5MofADmF4NdUpa2as7kKENV1KHPClSXpgClyer5qlE4wy0Of4azwa4YJeHGgUfAo%3d#/?preference#site_preference_group_attributes!id!aFakeId',
            displayName: 'aFakeDisplayName',
            description: 'aFakeDescription',
            attributes: []
        });
    });

    it('Should mapAttribute', function () {
        let mapAttributeGroup = eswBmGeneralHelpers.mapAttribute(ObjectAttributeDefinition);
        chai.expect(mapAttributeGroup.isMandatory).to.be.true;
    });

    it('Should loadGroups', function () {
        let loadedGroups = eswBmGeneralHelpers.loadGroups(ExtensibleObjectMock, '#/?preference#site_preference_group_attributes!id!{0}', null, 'ESW Catalog Integration Configuration');
        chai.expect(loadedGroups).to.be.undefined;
    });
    it('Should removeElements', function () {
        let sitePrefAttr = [{
            id: 'isEswCatalogFeatureEnabled',
            displayName: 'Is ESW Catalog Service Enabled?',
            defaultValue: {},
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'Boolean',
                template: 'form-fields/boolean-field'
            },
            enumValues: {},
            currentValue: true
        }, {
            id: 'eswCatalogImportMethod',
            displayName: 'ESW Catalog Import Method',
            defaultValue: null,
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'Set of String',
                template: 'form-fields/dropdown-field'
            },
            enumValues: {},
            currentValue: {}
        }, {
            id: 'eswCatalogFeedLocalPath',
            displayName: 'ESW Catalog Feed Local Path',
            defaultValue: {},
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'String',
                template: 'form-fields/string-field'
            },
            enumValues: {},
            currentValue: 'IMPEX/src/ESW/Catalog/'
        }, {
            id: 'eswCatalogFeedRemotePath',
            displayName: 'ESW Catalog Feed Remote Path',
            defaultValue: null,
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'String',
                template: 'form-fields/string-field'
            },
            enumValues: {},
            currentValue: '/Core/Evo/Catalog/PUS/Sandbox/Processed/'
        }, {
            id: 'eswCatalogFeedSFTPService',
            displayName: 'ESW Catalog Feed SFTP Service Name',
            defaultValue: null,
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'String',
                template: 'form-fields/string-field'
            },
            enumValues: {},
            currentValue: 'ESWSFTP'
        }, {
            id: 'eswCatalogFeedInstanceID',
            displayName: 'ESW Catalog Feed Instance ID',
            defaultValue: null,
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'String',
                template: 'form-fields/string-field'
            },
            enumValues: {},
            currentValue: ''
        }, {
            id: 'eswCatalogFeedProductCustomAttrFieldMapping',
            displayName: 'ESW Catalog Feed Product Custom Fields Mapping',
            defaultValue: null,
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'Text',
                template: 'form-fields/text-field'
            },
            enumValues: {},
            currentValue: '{\n\t"material": "productSKU ",\n\t"countryOfOrigin": "productSKU ",\n\t"hsCode": "productSKU ",\n\t"hsCodeRegion": "productSKU ",\n\t"category": "productSKU ",\n\t"gender": "productSKU ",\n\t"ageGroup": "productSKU ",\n\t"weight": "productSKU ",\n\t"weightUnit": "productSKU ",\n\t"dangerousGoods": "productSKU "\n}'
        }, {
            id: 'eswCatalogFeedPriceBookID',
            displayName: 'ESW Catalog Feed PriceBook ID',
            defaultValue: null,
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'String',
                template: 'form-fields/string-field'
            },
            enumValues: {},
            currentValue: 'usd-m-list-prices'
        }, {
            id: 'eswCatalogFeedTimeStamp',
            displayName: 'ESW Catalog Feed Last executed on',
            defaultValue: null,
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'String',
                template: 'form-fields/string-field'
            },
            enumValues: {},
            currentValue: '2023-08-09T17:07:58.350Z'
        }, {
            id: 'eswCatalogFeedDelimiter',
            displayName: 'ESW Catalog Feed Delimiter',
            defaultValue: {},
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'Set of String',
                template: 'form-fields/dropdown-field'
            },
            enumValues: {},
            currentValue: {}
        }, {
            id: 'isEswCatalogInternalValidationEnabled',
            displayName: 'Catalog Internal Validation',
            defaultValue: {},
            isMandatory: false,
            completeObjInfo: {},
            type: {
                type: 'Boolean',
                template: 'form-fields/boolean-field'
            },
            enumValues: {},
            currentValue: true
        }];
        let removeElem = eswBmGeneralHelpers.removeElements(sitePrefAttr, {
            apiFields: [
                'isEswCatalogInternalValidationEnabled',
                'eswCatalogFeedPriceBookID',
                'eswCatalogFeedTimeStamp'
            ],
            sftpFields: [
                'eswCatalogFeedLocalPath',
                'eswCatalogFeedRemotePath',
                'eswCatalogFeedSFTPService',
                'eswCatalogFeedInstanceID',
                'eswCatalogFeedProductCustomAttrFieldMapping',
                'eswCatalogFeedDelimiter',
                'eswCatalogFeedPriceBookID',
                'eswCatalogFeedTimeStamp'
            ]
        });
        chai.expect(removeElem).to.deep.equal([
            {
                id: 'isEswCatalogFeatureEnabled',
                displayName: 'Is ESW Catalog Service Enabled?',
                defaultValue: {},
                isMandatory: false,
                completeObjInfo: {},
                type: { type: 'Boolean', template: 'form-fields/boolean-field' },
                enumValues: {},
                currentValue: true
            },
            {
                id: 'eswCatalogFeedPriceBookID',
                displayName: 'ESW Catalog Feed PriceBook ID',
                defaultValue: null,
                isMandatory: false,
                completeObjInfo: {},
                type: { type: 'String', template: 'form-fields/string-field' },
                enumValues: {},
                currentValue: 'usd-m-list-prices'
            },
            {
                id: 'eswCatalogFeedTimeStamp',
                displayName: 'ESW Catalog Feed Last executed on',
                defaultValue: null,
                isMandatory: false,
                completeObjInfo: {},
                type: { type: 'String', template: 'form-fields/string-field' },
                enumValues: {},
                currentValue: '2023-08-09T17:07:58.350Z'
            },
            {
                id: 'isEswCatalogInternalValidationEnabled',
                displayName: 'Catalog Internal Validation',
                defaultValue: {},
                isMandatory: false,
                completeObjInfo: {},
                type: { type: 'Boolean', template: 'form-fields/boolean-field' },
                enumValues: {},
                currentValue: true
            }
        ]);
    });
});
