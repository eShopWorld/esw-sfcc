'use strict';

const chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
const SiteMock = require('../../../../mocks/dw/system/Site');
const LoggerMock = require('../../../../mocks/dw/system/Logger');
const ArrayList = require('../../../../mocks/dw.util.Collection');
const StringUtilsMock = require('../../../../mocks/dw/util/StringUtils');

const mockOrder = {
    confirmationStatus: { value: 'Created' },
    status: { value: 'CREATED' },
    productLineItems: [],
    shipments: [{ shippingMethodID: 'method123' }],
    setConfirmationStatus: sinon.stub(),
    setExportStatus: sinon.stub(),
    setPaymentStatus: sinon.stub(),
};
// Mocking SFCC Site object

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
const OrderMock = require('../../../../mocks/dw/order/Order');
var OrderMgr = require('../../../../mocks/dw/order/OrderMgr');


const ObjectTypeDefMock = require('../../../../mocks/dw/object/ObjectTypeDefinition');
ObjectTypeDefMock.getAttributeGroups = function () { return new ArrayList([]); };

const ExtensibleObjectMock = require('../../../../mocks/dw/object/ExtensibleObject');
ExtensibleObjectMock.describe = function () { return ObjectTypeDefMock; };


describe('link_eshopworld/cartridges/int_eshopworld_core/cartridge/scripts/helper/eswBmHelper.js', function () {
    let eckoutHelper = proxyquire('../../../../../cartridges/int_eshopworld_eckout/cartridge/scripts/helper/eckoutHelper.js', {
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        } else {
                            return true
                        }
                    }
                };
            }
        },
        getFieldType: function () { return { type: 'Boolean', template: 'form-fields/boolean-field' }; },
        'dw/system/Logger': LoggerMock,
        'dw/util/StringUtils': StringUtilsMock,
        'dw/order/Order': {
            'CONFIRMATION_STATUS_CONFIRMED': undefined,
            'ORDER_STATUS_FAILED': undefined,
            'ORDER_STATUS_CREATED': 'CREATED'
        },
        'dw/order/OrderMgr': {
            getOrder: sinon.stub().returns(mockOrder),
            placeOrder: sinon.stub().returns(mockOrder)
        },
        '*/cartridge/scripts/helper/orderConfirmationHelper': {
            getEswOcHelper: function () { return {
                setApplicableShippingMethods: function (params) {
                    return ''
                },
                updateEswOrderAttributesV3: function (params) {
                    return ''
                },
                updateOrderLevelAttrV3: function (params) {
                    return ''
                },
                updateShopperAddressDetails: function (params) {
                    return ''
                },
                updateEswPaymentAttributes: function (params) {
                    return ''
                },
                processKonbiniOrderConfirmation: function (params) {
                    return ''
                },
                processUpdateOrderAttributes: function (params) {
                    return ''
                },
                isUpdateOrderPaymentStatusToPaidAllowed: function (params) {
                    return ''
                }
            }}
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
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getCatalogUploadMethod: function () { return 'api'; },
                isUpdateOrderPaymentStatusToPaidAllowed: function () { return ''; },
            }
        }
    }).eswEmbCheckoutHelper;

    describe('getEswEmbCheckoutScriptPath Function', () => {
        it('should return the correct ESW Checkout Iframe script path', () => {
            const expectedPath = '/scripts/esw/checkout.js';
            const actualPath = eckoutHelper.getEswEmbCheckoutScriptPath();
            expect(actualPath).to.be.true;
        });
    });

    describe('getShopperIpAddressValue Function', () => {

        it('should return the correct shopper IP address when it exists in metadata items', () => {
            const ocPayloadJson = {
                shopperCheckoutExperience: {
                    metadataItems: [
                        { name: "eswShopperIpAddress", value: "192.168.1.1" },
                        { name: "otherMetadataItem", value: "someValue" }
                    ]
                }
            };
            const ipAddress = eckoutHelper.getShopperIpAddressValue(ocPayloadJson);
            expect(ipAddress).to.equal('192.168.1.1');
        });
    
        it('should return null when shopper IP address is not present in metadata items', () => {
            const ocPayloadJson = {
                shopperCheckoutExperience: {
                    metadataItems: [
                        { name: "otherMetadataItem", value: "someValue" }
                    ]
                }
            };
            const ipAddress = eckoutHelper.getShopperIpAddressValue(ocPayloadJson);
            expect(ipAddress).to.be.null;
        });
    
        it('should return the correct shopper IP address with case-insensitive matching', () => {
            const ocPayloadJson = {
                shopperCheckoutExperience: {
                    metadataItems: [
                        { Name: "eswShopperIpAddress", value: "203.0.113.1" },
                        { name: "otherMetadataItem", value: "someValue" }
                    ]
                }
            };
            const ipAddress = eckoutHelper.getShopperIpAddressValue(ocPayloadJson);
            expect(ipAddress).to.equal('203.0.113.1');
        });
    
        it('should return null when metadata items array is empty', () => {
            const ocPayloadJson = {
                shopperCheckoutExperience: {
                    metadataItems: []
                }
            };
            const ipAddress = eckoutHelper.getShopperIpAddressValue(ocPayloadJson);
            expect(ipAddress).to.be.null;
        });
    });

    describe('getCartItem', function () {
        it('should return the matching cart item', function () {
            // Mock data
            const obj = [
                {
                    product: { productCode: 'P123' },
                    lineItemId: 'L1'
                },
                {
                    product: { productCode: 'P456' },
                    lineItemId: 'L2'
                }
            ];
    
            const order = {
                productLineItems: [
                    {
                        productID: 'P123',
                        custom: { eswLineItemId: 'L1' }
                    },
                    {
                        productID: 'P456',
                        custom: { eswLineItemId: 'L2' }
                    }
                ]
            };
    
            // Test function
            const lineItem = 0; // Testing first line item
            const result = eckoutHelper.getCartItem(obj, order, lineItem);
    
            // Assertions
            assert.equal(result[0].product.productCode, 'P123');
        });
    
        it('should return undefined if no match is found', function () {
            // Mock data
            const obj = [
                {
                    product: { productCode: 'P789' },
                    lineItemId: 'L3'
                }
            ];
    
            const order = {
                productLineItems: [
                    {
                        productID: 'P123',
                        custom: { eswLineItemId: 'L1' }
                    }
                ]
            };
    
            // Test function
            const lineItem = 0; // Testing first line item
            const result = eckoutHelper.getCartItem(obj, order, lineItem);
            assert.equal(result.length, []);
        });
    });

    describe('processUpdateOrderAttributes Function', () => {
        it('should perform order confirmation and update attributes when order is in CREATED status', () => {
            // Mock order object
            // Mock obj and req
            const mockObj = {
                checkoutTotal: { shopper: { amount: '100' } },
                paymentDetails: { methodCardBrand: 'Visa' },
                deliveryOption: { deliveryOption: 'express' },
                deliveryCountryIso: 'US',
                contactDetails: {},
                lineItems: [{ product: { productCode: 'product123' } }],
            };
            const mockReq = {}; // Simulating the request object
            const mockResponse = { setStatus: sinon.stub() };
    
            // Mock the helpers and methods used in the function
            global.OrderMgr = { 
                getOrder: sinon.stub().returns(mockOrder),
                placeOrder: sinon.stub(),
                undoFailOrder: sinon.stub(),
            };
            global.ocHelper = { 
                setApplicableShippingMethods: sinon.stub(),
                updateEswOrderAttributesV3: sinon.stub(),
                updateEswOrderAttributesV2: sinon.stub(),
                updateEswOrderItemAttributesV3: sinon.stub(),
                updateEswOrderItemAttributesV2: sinon.stub(),
                updateOrderLevelAttrV3: sinon.stub(),
                updateShopperAddressDetails: sinon.stub(),
                updateEswPaymentAttributes: sinon.stub(),
                processKonbiniOrderConfirmation: sinon.stub().returns(false),
                saveAddressinAddressBook: sinon.stub(),
            };
            global.eswHelper = { isUpdateOrderPaymentStatusToPaidAllowed: sinon.stub().returns(true) };
    
            // Call the function
            const result = eckoutHelper.processUpdateOrderAttributes(mockOrder, mockObj, mockReq);
            expect(result).to.deep.equal({});
        });
    });
});
