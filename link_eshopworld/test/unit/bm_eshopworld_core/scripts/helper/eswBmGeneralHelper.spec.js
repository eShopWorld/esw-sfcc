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
                    return [
                        { custom: 'GB' }
                    ];
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

    describe('Return Field Type', function () {
        it('Should return FieldType', function () {
            let fieldType = eswBmGeneralHelpers.getFieldType(8);
            chai.expect(fieldType).to.deep.equal({
                type: 'Boolean',
                template: 'form-fields/boolean-field'
            });
        });
    });

    describe('Return Mapped Attribute', function () {
        it('Should return MappedAttribute', function () {
            let mappedAttribute = eswBmGeneralHelpers.mapAttribute(attributeDefinition);
            chai.expect(mappedAttribute).to.be.an('object');
        });
    });

    describe('Return loadGroups Attribute', function () {
        it('Should return loadGroups', function () {
            CustomSiteMock.getCurrent = function () {
                return {
                    getPreferences: function () { return ''; },
                    getAllowedLocales: function () { 
                        return {
                            toArray: function () { return []; }
                        };
                    },
                    getAllowedCurrencies: function () { 
                        return {
                            toArray: function () { return []; }
                        };
                    },
                    getID: function () {
                        return 'testID';
                    }
                };
            };
            let loadGroupsAttr = eswBmGeneralHelpers.loadGroups({}, 'testURL', {}, 8);
            chai.expect(loadGroupsAttr).to.be.an('object');
        });
    });

    describe('Return Monitoring report', function () {
        it('Should return Monitoring report', function () {
            let monitoringReport = eswBmGeneralHelpers.updateIntegrationMonitoring([
                [
                    {
                        "SiteConfigs": {
                            "site": null,
                            "eswCartridgeVersion": null
                        }
                    },
                    {
                        "allowedLocales": null,
                        "allowedCurrencies": null
                    },
                    {
                        "ESWConfigs": {
                            "storefront": {
                                "customPrefrences": {
                                    "ESWGeneralConfiguration": [
                                        {
                                            "displayName": null,
                                            "value": null
                                        }
                                    ],
                                    "ESWRetailerDisplayConfiguration": [
                                        {
                                            "displayName": null,
                                            "value": null
                                        },
                                        {
                                            "displayName": null,
                                            "value": null
                                        },
                                        {
                                            "displayName": null,
                                            "value": null
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            ]);
            chai.expect(monitoringReport).to.be.an('String');
        });
    });

    describe('Return updated Integration Monitoring Report', function () {
        it('Should Return updated Integration Monitoring Report', function () {
            let monitoringReport = eswBmGeneralHelpers.loadReport('fakeCsrf');
            chai.expect(monitoringReport).to.be.an('Array');
        });
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
