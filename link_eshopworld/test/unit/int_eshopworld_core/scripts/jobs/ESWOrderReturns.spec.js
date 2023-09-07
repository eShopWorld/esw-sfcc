'use strict';

var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var dwLoggerMock = require('../../../../mocks/dw/system/Logger');
var dwStatusMock = require('../../../../mocks/dw/system/Status');
var dwFileMock = require('../../../../mocks/dw/io/File');
var dwFileWriterMock = require('../../../../mocks/dw/io/FileWriter');
var dwCsvStreamWriterMock = require('../../../../mocks/dw/io/CSVStreamWriter');
var dwSiteMock = require('../../../../mocks/dw/system/Site');
var dwStringUtilMock = require('../../../../mocks/dw/util/StringUtils');
var dwProductSearchModelMock = require('../../../../mocks/dw/catalog/ProductSearchModel');
var dwTransactionMock = require('../../../../mocks/dw/system/Transaction');
var dwOrderMgrMock = require('../../../../mocks/dw/order/OrderMgr');
var stubLocalizeObj = sinon.stub();
stubLocalizeObj.apply({
    currencyCode: 'GBP',
    countryCode: 'GB',
    applyRoundingModel: false,
    applyCountryAdjustments: false
});

describe('int_eshopworld_core/cartridge/scripts/jobs/CatalogFeed.js', function () {
    var generateLocalizeProductFeed = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/jobs/ESWOrderReturns', {
        'dw/system/Logger': dwLoggerMock,
        'dw/order/OrderMgr': dwOrderMgrMock,
        'dw/system/Status': dwStatusMock,
        'dw/io/File': dwFileMock,
        'dw/io/FileWriter': dwFileWriterMock,
        'dw/io/CSVStreamWriter': dwCsvStreamWriterMock,
        'dw/system/Site': dwSiteMock,
        'dw/util/StringUtils': dwStringUtilMock,
        'dw/catalog/ProductSearchModel': dwProductSearchModelMock,
        'dw/system/Transaction': dwTransactionMock,
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {

            }
        },
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    getPricingAdvisorData: function () {
                        return {

                        };
                    },
                    queryAllCustomObjects: function () {
                        return [
                            { custom: 'GB' }
                        ];
                    },
                    getOverrideCountry: function () { return 'country list'; },
                    getAvailableCountry: function () { return 'country'; },
                    getCurrentEswCurrencyCode: function () { return 'currency'; },
                    getOverridePriceBooks: function () { return {}; }
                };
            }
        }
    });

    it('Should return ERROR status', function () {
        let jobRes = generateLocalizeProductFeed.execute();
        chai.expect(jobRes).to.be.an.instanceof(dwStatusMock);
    });
});
