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


describe('link_eshopworld/cartridges/int_eshopworld_core/cartridge/scripts/helper/eswBmHelper.js', function () {
    let eswBmGeneralHelpers = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswBmHelper.js', {
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
});
