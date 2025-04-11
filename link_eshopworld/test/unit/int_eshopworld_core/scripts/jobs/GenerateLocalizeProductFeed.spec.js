'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var chai = require('chai');

var dwLoggerMock = require('../../../../mocks/dw/system/Logger');
var dwStatusMock = require('../../../../mocks/dw/system/Status');
var dwFileMock = require('../../../../mocks/dw/io/File');
var dwFileWriterMock = require('../../../../mocks/dw/io/FileWriter');
var dwCsvStreamWriterMock = require('../../../../mocks/dw/io/CSVStreamWriter');
var dwSiteMock = require('../../../../mocks/dw/system/Site');
var dwStringUtilMock = require('../../../../mocks/dw/util/StringUtils');
var dwProductSearchModelMock = require('../../../../mocks/dw/catalog/ProductSearchModel');

var stubLocalizeObj = sinon.stub();
stubLocalizeObj.apply({
    currencyCode: 'GBP',
    countryCode: 'GB',
    applyRoundingModel: false,
    applyCountryAdjustments: false
});

describe('int_eshopworld_core/cartridge/scripts/jobs/GenerateLocalizeShoppingFeed.js', function () {
    var GenerateLocalizeShoppingFeed = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/jobs/GenerateLocalizeShoppingFeed', {
        'dw/system/Logger': dwLoggerMock,
        'dw/catalog/CatalogMgr': '',
        'dw/system/Status': dwStatusMock,
        'dw/io/File': dwFileMock,
        'dw/io/FileWriter': dwFileWriterMock,
        'dw/io/CSVStreamWriter': dwCsvStreamWriterMock,
        'dw/system/Site': dwSiteMock,
        'dw/util/StringUtils': dwStringUtilMock,
        'dw/catalog/ProductSearchModel': dwProductSearchModelMock,
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {

            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
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
            },
            'dw/system/Site': {
                getCurrent: function () { }
            }
        }
    });

    it('Should return ERROR status', function () {
        let fff = GenerateLocalizeShoppingFeed.execute();
        chai.expect(fff).to.be.an.instanceof(dwStatusMock);
    });
});
