'use strict';

var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var calendarMock = require("../../../../mocks/dw/util/Calendar");
var ArrayList = require('../../../../mocks/dw.util.Collection');
var Logger = require('../../../../mocks/dw/system/Logger');
var Status = require('../../../../mocks/dw/system/Status');

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

describe('bm_eshopworld_core/cartridge/scripts/helper/eswSyncHelpers.js', function () {
    let eswSyncHelpers = proxyquire('../../../../../cartridges/bm_eshopworld_core/cartridge/scripts/helpers/eswSyncHelpers.js', {
        '*/cartridge/scripts/helper/eswCatalogHelper': {
            convertArrayToChunks: function () {
                return saleableProducts;
            },
            generateProductBatchPayload: function () {
                return bachProductsPayload;
            },
            sendCatalogData: function () {}
        },
        'dw/util/Calendar': calendarMock,
        'dw/web/Resource': {},
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                };
            }
        },
        'dw/system/Logger': Logger,
        'dw/system/Status': Status,
        '*/cartridge/scripts/util/Constants': {
            CATALOG_API_CHUNK: 100
        }
    });
    describe('success cases', function () {
        it('Should return true if synced products successfully', function () {
            let eswSyncApiResponse = eswSyncHelpers.syncSelectedProducts(saleableProducts);
            chai.expect(eswSyncApiResponse).to.be.an.instanceof(Status);
        });
    });
});
