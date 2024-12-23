var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');
var siteMock = require('../../../../mocks/dw/system/Site');
var Logger = require('../../../../mocks/dw/system/Logger');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
const collections = require('../../../../mocks/dw.util.CollectionHelper');
var PriceBookMgrMock = require('../../../../mocks/dw/catalog/PriceBookMgr');
global.empty = empty(global);

var stubTransaction = sinon.mock();
var stubCookie = sinon.mock();
var stubArrayList = sinon.mock();
var stubURLUtils = sinon.mock();

const productLineItems = [
    {
        productID: 'prod123',
        quantity: 2,
        customAttributes: {
            color: 'Red',
            size: 'M',
        },
    },
    {
        productID: 'prod456',
        quantity: 1,
        customAttributes: {
            color: 'Blue',
            size: 'L',
        },
    },
];

const order = {
    custom: {
        eswPackageJSON: JSON.stringify([
            {
                productLineItem: 'prod123',
                trackingNumber: 'TRACK123',
                lineItemDetail: {
                    name: 'Product 123',
                    color: 'Red',
                    size: 'M',
                    productImage: 'http://image.com/prod123.jpg',
                    total: 100,
                },
                qty: 2,
            },
            {
                productLineItem: 'prod789',
                trackingNumber: 'TRACK789',
                lineItemDetail: {
                    name: 'Product 789',
                    color: 'Black',
                    size: 'XL',
                    productImage: 'http://image.com/prod789.jpg',
                    total: 150,
                },
                qty: 1,
            },
        ]),
    },
};

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: 1
    }
};

global.session = session;

describe('int_eshopworld_controllers/cartridge/scripts/helper/eswHelper.js', function () {
    var eswHelper = proxyquire('../../../../../cartridges/int_eshopworld_controllers/cartridge/scripts/helper/eswHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                // eslint-disable-next-line semi
                getOverridePriceBook: function () { return { countryCode: 'fake countryCode' } },
                getOverridePriceBooks: function () { return {}; },
                getEShopWorldModuleEnabled: function () { return true; },
                isESWSupportedCountry: function () { return true; },
                isEswSplitShipmentEnabled: function () { return true; },
                strToJson: function () { return [
                    {
                        productLineItem: 'prod123',
                        trackingNumber: 'TRACK123',
                        trackingUrl: 'http://trackingurl.com/TRACK123',
                        lineItemDetail: {
                            name: 'Product 123',
                            color: 'Red',
                            size: 'M',
                            productImage: 'http://image.com/prod123.jpg',
                            total: 100,
                        },
                        qty: 2,
                    },
                    {
                        productLineItem: 'prod456',
                        trackingNumber: 'TRACK456',
                        trackingUrl: 'http://trackingurl.com/TRACK456',
                        lineItemDetail: {
                            name: 'Product 456',
                            color: 'Blue',
                            size: 'L',
                            productImage: 'http://image.com/prod456.jpg',
                            total: 150,
                        },
                        qty: 1,
                    },
                    {
                        productLineItem: 'prod789',
                        trackingNumber: 'TRACK789',
                        trackingUrl: 'http://trackingurl.com/TRACK789',
                        lineItemDetail: {
                            name: 'Product 789',
                            color: 'Black',
                            size: 'XL',
                            productImage: 'http://image.com/prod789.jpg',
                            total: 200,
                        },
                        qty: 1,
                    }
                ]; },
            }
        },
        '*/cartridge/scripts/helper/serviceHelper': {
            failOrder: function () { return ''; }
        },
        'dw/catalog/PriceBookMgr': PriceBookMgrMock,
        '*/cartridge/scripts/util/collections': collections,
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': Logger,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/system/Site': siteMock,
        'dw/util/StringUtils': StringUtils
    }).getEswHelper();
    describe('Happy case', function () {
        it('Should return EswPackageJSON', function () {
            let eswPackageJSON = eswHelper.getEswPackageJSON(productLineItems, order);
            expect(eswPackageJSON).to.be.an('Array');
        });
    });
    describe('Sad case', function () {
        it('Should return null', function () {
            let eswPackageJSON = eswHelper.getEswPackageJSON();
            expect(eswPackageJSON).to.be.null;
        });
    });
});
