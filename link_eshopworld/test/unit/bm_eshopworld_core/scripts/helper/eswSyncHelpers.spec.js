'use strict';

var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var calendarMock = require('../../../../mocks/dw/util/Calendar');
var ArrayList = require('../../../../mocks/dw.util.Collection');
var Logger = require('../../../../mocks/dw/system/Logger');
var Status = require('../../../../mocks/dw/system/Status');
const OrderMock = require('../../../../mocks/dw/order/Order');

var saleableProducts = new ArrayList([{
    product: {
        online: true,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {},
    productID: 'someID',
    quantityValue: 2,
    productCode: 'testId',
    name: 'testName',
    unitPrice: 'testPrice'
}]);

var saleableOrders = new ArrayList([{
    productLineitem: {
        online: true,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {},
    productID: 'someID',
    quantityValue: 2,
    productCode: 'testId',
    name: 'testName',
    unitPrice: 'testPrice'
}]);

var bachProductsPayload = [
    {
        productCode: '11160296020014',
        name: 'JACKET',
        description: 'JACKET',
        material: 'FABRIC 53% cotton',
        countryOfOrigin: 'IT',
        hsCode: '62043290',
        hsCodeRegion: 'EU',
        category: null,
        gender: null,
        ageGroup: null,
        size: null,
        weight: null,
        weightUnit: null,
        url: null,
        imageUrl: null,
        unitPrice: null,
        dangerousGoods: null,
        additionalProductCode: null,
        variantProductCode: null
    }
];

let product = {
    online: true,
    availabilityModel: {
        getAvailabilityLevels: function () {
            return {
                notAvailable: {
                    value: 0
                }
            };
        }
    }
};

describe('bm_eshopworld_core/cartridge/scripts/helper/eswSyncHelpers.js', function () {
    let eswSyncHelpers = proxyquire('../../../../../cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswSyncHelpers.js', {
        '*/cartridge/scripts/jobs/sendASNtoESW': {
            getSendASNtoESWUtils: {
                sendASNForPackage: function () {}
            }
        },
        '*/cartridge/scripts/helper/eswCatalogHelper': {
            convertArrayToChunks: function () {
                return saleableProducts;
            },
            generateProductBatchPayload: function () {
                return bachProductsPayload;
            },
            sendCatalogData: function () {},
            isValidProduct: function () {
                return {
                    isError: true
                };
            }
        },
        'dw/system/Transaction': '',
        'dw/util/Calendar': calendarMock,
        'dw/web/Resource': {
            msg: function () {
                return 'someResourceString';
            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {}
        },
        'dw/system/Logger': Logger,
        'dw/system/Status': Status,
        '*/cartridge/scripts/util/Constants': {
            CATALOG_API_CHUNK: 100
        }
    });
    it('Should return true if synced products successfully', function () {
        let eswSyncApiResponse = eswSyncHelpers.syncSelectedProducts(saleableProducts);
        chai.expect(eswSyncApiResponse).to.be.an.instanceof(Status);
    });
    it('Should return true if synced orders successfully', function () {
        let eswSyncApiResponse = eswSyncHelpers.exportSelectedOrders(saleableOrders);
        chai.expect(eswSyncApiResponse).to.be.an.instanceof(Status);
    });


    describe('shipOrders', function () {
        it('should return undefined when empty orders', function () {
            // Assuming shipOrders returns true for successful operation
            const result = eswSyncHelpers.shipOrders([]);
            chai.expect(result).to.be.undefined;
        });
    });
    describe('success cases', function () {
        it('Should return product status', function () {
            let productStatus = eswSyncHelpers.getProductSyncStatus(product);
            chai.expect(productStatus).to.deep.equal('someResourceString');
        });
    });
    describe('success cases', function () {
        it('Should return getSync Status Info', function () {
            let productStatus = eswSyncHelpers.getSyncStatusInfo(product);
            chai.expect(productStatus).to.deep.equal('unknown');
        });
    });
});
