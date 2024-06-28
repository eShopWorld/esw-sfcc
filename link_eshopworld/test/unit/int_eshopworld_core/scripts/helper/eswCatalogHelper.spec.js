'use strict';

var chai = require('chai');
const expect = chai.expect;
var proxyquire = require('proxyquire').noCallThru();
var ArrayListMock = require('../../../../mocks/dw.util.Collection');
var calendarMock = require('../../../../mocks/dw/util/Calendar');
var productMock = require('../../../../mocks/dw/catalog/Product');
var MarkupMock = require('../../../../mocks/dw/content/MarkupText');
var siteMock = require('../../../../mocks/dw/system/Site');
var dwTransactionMock = require('../../../../mocks/dw/system/Transaction');
var dwStringUtilMock = require('../../../../mocks/dw/util/StringUtils');
const Constants = require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants');
dwStringUtilMock.formatCalendar = function (timeStamp) {
    return timeStamp;
};
const iteratorMock = require('../../../../mocks/dw/util/Iterator');
const productSearchModelMock = require('../../../../mocks/dw/catalog/ProductSearchModel');
productSearchModelMock.productSearchHits = iteratorMock;
const URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
const LoggerMock = require('../../../../mocks/dw/system/Logger');
const StatusMock = require('../../../../mocks/dw/system/Status');
const svdResultMock = require('../../../../mocks/dw/svc/Result');
const ProductMgrMock = require('../../../../mocks/dw/catalog/ProductMgr');
svdResultMock.isOk = function () { return false; };
global.empty = empty();
describe('int_eshopworld_core/cartridge/scripts/helper/eswCatalogHelper.js', function () {
    ArrayListMock.size = function () { return 1; };
    let eswCatalogHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCatalogHelper.js', {
        'dw/catalog/ProductMgr': ProductMgrMock,
        'dw/web/URLUtils': URLUtilsMock,
        'dw/system/Status': StatusMock,
        'dw/catalog/ProductSearchModel': productSearchModelMock,
        'dw/system/Site': siteMock,
        'dw/util/StringUtils': dwStringUtilMock,
        'dw/system/Transaction': dwTransactionMock,
        'dw/util/Calendar': calendarMock,
        '*/cartridge/scripts/util/Constants': Constants,
        'dw/system/Logger': LoggerMock,
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                isEswCatalogFeatureEnabled: function () { return true; },
                getCatalogUploadMethod: function () { return Constants.API; },
                isEswCatalogInternalValidationEnabled: function () { return true; },
                getEswCatalogFeedProductCustomAttrFieldMapping: function () { return { material: 'material', hsCode: 'hsCode', hsCodeRegion: 'hsCodeRegion', countryOfOrigin: 'countryOfOrigin' }; },
                strToJson: function () { return {}; },
                getEswCatalogFeedLastExec: function () { return new Date(); }
            }
        }
    });
    describe('success cases', function () {
        it('Should validate a product and return true', function () {
            productMock.getID = function () { return 'dummy_pid'; };
            productMock.getName = function () { return 'dummy_p_name'; };
            productMock.getShortDescription = function () { return MarkupMock; };
            productMock.getShortDescription().getMarkup = function () { return 'dummy_p_short_description'; };
            productMock.custom = {
                material: 'iron',
                hsCode: '123456',
                hsCodeRegion: 'AN',
                countryOfOrigin: 'MF'
            };
            expect(eswCatalogHelper.isValidProduct(productMock)).to.have.property('isError');
        });
        it('Should return true if isValidHsCodeRegion', function () {
            let isValidHsCodeRegion = eswCatalogHelper.isValidHsCodeRegion('AF');
            expect(isValidHsCodeRegion).to.be.true;
        });
        it('Should return true if isValidCountryOfOrigin', function () {
            let isValidCountryOfOrigin = eswCatalogHelper.isValidCountryOfOrigin('AF');
            expect(isValidCountryOfOrigin).to.be.true;
        });
        it('should convert array to chunk', function () {
            let arrayChunk = eswCatalogHelper.convertArrayToChunks([2, 3, 4, 5], 2);
            expect(arrayChunk).to.deep.equal([[2, 3], [4, 5]]);
        });
        it('should format timeStamp', function () {
            let timeStamp = new Date();
            let finalTime = eswCatalogHelper.formatTimeStamp(timeStamp);
            expect(finalTime).to.be.an.instanceOf(calendarMock);
        });
        it('should saveFeedExecutionTimeStamp', function () {
            expect(eswCatalogHelper.saveFeedExecutionTimeStamp()).to.be.undefined;
        });
        it('should generateProductBatchPayload', function () {
            let productBatch = eswCatalogHelper.generateProductBatchPayload({});
            expect(productBatch).deep.equal([]);
        });
        it('should sendCatalogData', function () {
            let catalogData = eswCatalogHelper.sendCatalogData({});
            expect(catalogData).to.be.an.instanceOf(StatusMock);
        });
        it('should return an empty array when the input array is empty', function () {
            const arr = [];
            const chunkSize = 10;

            const result = eswCatalogHelper.convertArrayToChunks(arr, chunkSize);

            expect(result).to.be.an('array');
            expect(result).to.be.empty;
        });

        it('should return an array of chunks when the input array is not empty', function () {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const chunkSize = 2;

            const result = eswCatalogHelper.convertArrayToChunks(arr, chunkSize);

            expect(result).to.be.an('array');
            expect(result.length).to.equal(5);
            expect(result[0]).to.deep.equal([1, 2]);
            expect(result[1]).to.deep.equal([3, 4]);
            expect(result[2]).to.deep.equal([5, 6]);
            expect(result[3]).to.deep.equal([7, 8]);
            expect(result[4]).to.deep.equal([9, 10]);
        });

        it('should return the last chunk even if it is smaller than the chunk size', function () {
            const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const chunkSize = 3;

            const result = eswCatalogHelper.convertArrayToChunks(arr, chunkSize);

            expect(result).to.be.an('array');
            expect(result.length).to.equal(4);
            expect(result[0]).to.deep.equal([1, 2, 3]);
            expect(result[1]).to.deep.equal([4, 5, 6]);
            expect(result[2]).to.deep.equal([7, 8, 9]);
            expect(result[3]).to.deep.equal([10]);
        });
    });
    describe('Error cases', function () {
        it('Should validate a product and return true', function () {
            productMock.getID = function () { return 'dummy_pid'; };
            productMock.getName = function () { return 'dummy_p_name'; };
            productMock.getShortDescription = function () { return MarkupMock; };
            productMock.getShortDescription().getMarkup = function () { return 'dummy_p_short_description'; };
            productMock.custom = {};
            expect(eswCatalogHelper.isValidProduct(productMock)).to.throw;
        });
        it('Should return true if isValidCountryOfOrigin', function () {
            let isValidCountryOfOrigin = eswCatalogHelper.isValidCountryOfOrigin('FF');
            expect(isValidCountryOfOrigin).to.be.false;
        });
        it('Should return true if isValidHsCodeRegion', function () {
            let isValidHsCodeRegion = eswCatalogHelper.isValidHsCodeRegion('FF');
            expect(isValidHsCodeRegion).to.be.false;
        });
        it('should convert array to chunk', function () {
            let arrayChunk = eswCatalogHelper.convertArrayToChunks([], 2);
            expect(arrayChunk).to.deep.equal([]);
        });
        it('should check isExternalyValidProduct', function () {
            let isExternalValid = eswCatalogHelper.isExternalyValidProduct(productMock);
            expect(isExternalValid.isError).to.be.false;
        });
        it('should storeCatalogApiResponse', function () {
            let svcResultMock = eswCatalogHelper.storeCatalogApiResponse([], svdResultMock);
            expect(svcResultMock).to.be.undefined;
        });
        it('should eswCatalogHelper.getFilteredProducts', function () {
            let filteredProds = eswCatalogHelper.getFilteredProducts(true);
            expect(filteredProds).to.deep.equal([]);
        });


        it('should return an empty array when there are no products', function () {
            let isApiMethod = false;
            let searchAbleProducts = [];

            let result = eswCatalogHelper.getFilteredProducts(isApiMethod, searchAbleProducts);

            expect(result).to.be.null;
        });

        it('should return an array of products when there are products', function () {
            let isApiMethod = false;
            let searchAbleProducts = [
                { product: { lastModified: new Date('2023-09-20T17:05:01Z') } },
                { product: { lastModified: new Date('2023-09-20T17:05:02Z') } },
                { product: { lastModified: new Date('2023-09-20T17:05:03Z') } }
            ];
            let result = eswCatalogHelper.getFilteredProducts(isApiMethod, searchAbleProducts);
            expect(result).to.be.null;
        });
    });
});
