var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var Collection = require('../../../../mocks/dw.util.Collection');
var CustomerMgr = require('../../../../mocks/dw/customer/CustomerMgr');
var CustomObjectMgrMock = require('../../../../mocks/dw/object/CustomObjectMgr');


var contactDetailType = {
    equalsIgnoreCase: function () {
        return true;
    }
};

var contactDetails = [
    {
        contactDetailType: contactDetailType,
        contactDetailsNickName: 'some value',
        firstName: 'some value',
        lastName: 'some value',
        gender: 'some value',
        address1: 'some value',
        address2: 'some value',
        city: 'some value',
        postalCode: 'some value',
        region: 'some value',
        country: 'some value',
        email: 'some value',
        telephone: 'some value',
        metadataItems: []
    },
    {
        contactDetailType: contactDetailType,
        contactDetailsNickName: 'some value',
        firstName: 'some value',
        lastName: 'some value',
        gender: 'some value',
        address1: 'some value',
        address2: 'some value',
        city: 'some value',
        postalCode: 'some value',
        region: 'some value',
        country: 'some value',
        email: 'some value',
        telephone: 'some value',
        metadataItems: []
    }
];
var MoneyMock = require('../../../../mocks/dw/value/Money');
var PaymentMgrMock = require('../../../../mocks/dw/order/PaymentMgr');
var orderMock = require('../../../../mocks/dw/order/Order');
describe('int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', function () {
    var eswCoreHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', {
        'dw/object/CustomObjectMgr': CustomObjectMgrMock,
        'dw/order/PaymentMgr': PaymentMgrMock,
        'dw/value/Money': MoneyMock,
        'dw/order/Order': orderMock,
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                eswInfoLogger: function () {}
            }
        },
        '*/cartridge/scripts/util/collections': Collection,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        }
                        return 'true';
                    }
                };
            }
        },
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants'),
        'dw/customer/CustomerMgr': CustomerMgr,
        '*/cartridge/scripts/helpers/addressHelpers': {
            generateAddressName: function () {
                return [
                    {
                        contactDetailType: function () {
                            return {
                                equalsIgnoreCase: function () {}
                            };
                        },
                        contactDetailsNickName: 'some value',
                        firstName: 'some value',
                        lastName: 'some value',
                        gender: 'some value',
                        address1: 'some value',
                        address2: 'some value',
                        city: 'some value',
                        postalCode: 'some value',
                        region: 'some value',
                        country: 'some value',
                        email: 'some value',
                        telephone: 'some value',
                        metadataItems: []
                    },
                    {
                        contactDetailType: 'some value',
                        contactDetailsNickName: 'some value',
                        firstName: 'some value',
                        lastName: 'some value',
                        gender: 'some value',
                        address1: 'some value',
                        address2: 'some value',
                        city: 'some value',
                        postalCode: 'some value',
                        region: 'some value',
                        country: 'some value',
                        email: 'some value',
                        telephone: 'some value',
                        metadataItems: []
                    }
                ];
            },
            createAddress: function () {
            }
        }
    }).getEswOcHelper();
    describe('Happy path', function () {
        it("Should save address to customer's address book", function () {
            eswCoreHelper.saveAddressinAddressBook(contactDetails, 'fakeID');
        });
    });
    describe('Sad Path', function () {
        it('Should throw error', function () {
            let getSavedAddress = eswCoreHelper.saveAddressinAddressBook([], '');
            expect(getSavedAddress).to.throw;
        });
    });
});
