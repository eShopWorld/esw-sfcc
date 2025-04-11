'use strict';

const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const LoggerMock = require('../../../../mocks/dw/system/Logger');
const ArrayList = require('../../../../mocks/dw.util.Collection');
const StringUtilsMock = require('../../../../mocks/dw/util/StringUtils');
const URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
const collections = require('../../../../mocks/dw.util.CollectionHelper');
const Transaction = require('../../../../mocks/dw/system/Transaction');
const CustomObjectMgr = require('../../../../mocks/dw/object/CustomObjectMgr');
const SystemMock = require('../../../../mocks/dw/system/System');
SystemMock.getCompatibilityMode = function () { return ''; };

const ObjectAttributeDefinition = require('../../../../mocks/dw/object/ObjectAttributeDefinition');
ObjectAttributeDefinition.getID = function () { return 'aFakeId'; };
ObjectAttributeDefinition.getDisplayName = function () { return 'aFakeDisplayName'; };
ObjectAttributeDefinition.getDefaultValue = function () { };
ObjectAttributeDefinition.isMandatory = function () { return true; };
ObjectAttributeDefinition.getValues = function () { };
ObjectAttributeDefinition.getObjectTypeDefinition = function () { return new ArrayList([]); };
ObjectAttributeDefinition.valueTypeCode = 8;

CustomObjectMgr.createCustomObject = function () { return {
    getCustom: function () { return {configReport: ''} }
}};


const ObjectAttributeGroupMock = require('../../../../mocks/dw/object/ObjectAttributeGroup');
ObjectAttributeGroupMock.getID = function () { return 'aFakeId'; };
ObjectAttributeGroupMock.getDisplayName = function () { return 'aFakeDisplayName'; };
ObjectAttributeGroupMock.getDescription = function () { return 'aFakeDescription'; };
ObjectAttributeGroupMock.getAttributeDefinitions = function () { return new ArrayList([]); };


const ObjectTypeDefMock = require('../../../../mocks/dw/object/ObjectTypeDefinition');
ObjectTypeDefMock.getAttributeGroups = function () { return new ArrayList([]); };

const ExtensibleObjectMock = require('../../../../mocks/dw/object/ExtensibleObject');
ExtensibleObjectMock.describe = function () { return ObjectTypeDefMock; };

let attributeDefinition = {
    getID: function () { return 'testID'; },
    getDisplayName: function () { return 'fakename'; },
    getDefaultValue: function () { return 'fakevalue'; },
    isMandatory: function () { return 'false'; },
    getObjectTypeDefinition: function () { return 'false'; },
    valueTypeCode: 6,
    getValues: function () { return 'false'; }
};

let resource = {
    msg: function (param1) {
        return param1;
    }
};

let formData = {
    "arrInput[0][country]": "US",
    "arrInput[0][pkgAsnModel]": "ModelA",
    "arrInput[1][country]": "UK",
    "arrInput[1][pkgAsnModel]": "ModelB",
    "arrInput[2][country]": "IN",
    "arrInput[2][pkgAsnModel]": "ModelC"
};

let CustomSiteMock = {};


describe('link_eshopworld/cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswBmGeneralHelper.js', function () {
    let eswBmGeneralHelpers = proxyquire('../../../../../cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswBmGeneralHelper.js', {
        'dw/system/Site': CustomSiteMock,
        getFieldType: function () { return { type: 'Boolean', template: 'form-fields/boolean-field' }; },
        'dw/system/Logger': LoggerMock,
        'dw/util/StringUtils': StringUtilsMock,
        'dw/system/System': SystemMock,
        'dw/web/URLUtils': URLUtilsMock,
        'dw/web/Resource': resource,
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/services/EswCoreService': {
            getEswServices: function () {
                return {
                    getOAuthService: function () {
                        return {
                            call: function () {
                                return {};
                            }
                        };
                    }
                };
            }
        },
        mapGroup: function () {
            return {
                id: 'aFakeId',
                bm_link: '/on/demandware.store/Sites-Site/default/ViewApplication-BM?csrf_token=GeMn5DfFMZmA2asyj40cmTuLjotbLJZofKkNB7h0uh_xqu-PlDE955Ot3EA2WVvarta5bvuDwkI85TsnFou6zfJV444I6zSxxrYQCqEpxTfisLrt9wX5MofADmF4NdUpa2as7kKENV1KHPClSXpgClyer5qlE4wy0Of4azwa4YJeHGgUfAo%3d#/?preference#site_preference_group_attributes!id!aFakeId',
                displayName: 'aFakeDisplayName',
                description: 'aFakeDescription',
                attributes: []
            };
        },
        'dw/system/Transaction': Transaction,
        'dw/object/CustomObjectMgr': CustomObjectMgr,
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCatalogUploadMethod: function () { return 'api'; },
                getCheckoutServiceName: function () { return 'testService'; },
                getCustomObjectDetails: function () { return {}; },
                queryAllCustomObjects: function () {
                    return {
                        hasNext: function () { return false; }
                    };
                },
                getPricingAdvisorData: function () {
                    return {

                    };
                },
                formatTimeStamp: function () {
                    return 'YYYY-MM-DD';
                }
            }
        },
        '*/cartridge/scripts/helper/eswBmHelper': {
            getFieldType: function (fieldTypeDwId) {
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
            },
            mapAttribute: function() {
                return {
                    id: 'fakeID',
                    displayName: 'fakename',
                    isMandatory: false,
                    completeObjInfo: ''
                };
            },
            loadGroups: function () {
                return {
                    id: 'testGroup',
                    prefrences: []
                };
            }
        }
    });

    describe('Happy path', function () {
        it('Should store MixedPkg Configs', function () {
            let storeMixedPkgConf = eswBmGeneralHelpers.storeMixedPkgConf(formData);
            chai.expect(storeMixedPkgConf).to.be.an('undefined');
        });
    });

    describe('Sad path', function () {
        it('Should store MixedPkg Configs', function () {
            chai.expect(function () {
                eswBmGeneralHelpers.storeMixedPkgConf();
            }).to.throw(TypeError, 'Cannot convert undefined or null to object');
        });
    });

    describe('Happy path', function () {
        it('Should convertMixedPkgInputToArr', function () {
            let convertMixedPkgInputToArr = eswBmGeneralHelpers.convertMixedPkgInputToArr(formData);
            chai.expect(convertMixedPkgInputToArr).to.be.an('Array');
        });
    });

    describe('Sad path', function () {
        it('Should convertMixedPkgInputToArr', function () {
            let convertMixedPkgInputToArr = eswBmGeneralHelpers.convertMixedPkgInputToArr({});
            chai.expect(convertMixedPkgInputToArr).to.satisfy(arr => arr === null || (Array.isArray(arr) && arr.length === 0));
        });
    });
});
