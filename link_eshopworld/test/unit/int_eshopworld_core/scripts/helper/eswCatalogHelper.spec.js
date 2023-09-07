'use strict';

var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var ArrayListMock = require('../../../../mocks/dw.util.Collection');
var calendarMock = require("../../../../mocks/dw/util/Calendar");
var productMock = require('../../../../mocks/dw/catalog/Product');
var MarkupMock = require('../../../../mocks/dw/content/MarkupText');
var siteMock = require('../../../../mocks/dw/system/Site');
var dwTransactionMock = require('../../../../mocks/dw/system/Transaction');
var dwStringUtilMock = require('../../../../mocks/dw/util/StringUtils');
const Constants = require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants');

global.empty = empty();
describe('int_eshopworld_core/cartridge/scripts/helper/eswCatalogHelper.js', function () {
    ArrayListMock.size = function () { return 1; };
    let eswCatalogHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCatalogHelper.js', {
        'dw/system/Site': siteMock,
        'dw/util/StringUtils': dwStringUtilMock,
        'dw/system/Transaction': dwTransactionMock,
        'dw/util/Calendar': calendarMock,
        '*/cartridge/scripts/util/Constants': Constants,
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    isEswCatalogFeatureEnabled: function () { return true; },
                    getCatalogUploadMethod: function () { return  Constants.API; },
                    isEswCatalogInternalValidationEnabled: function () { return true; }
                };
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
            chai.expect(eswCatalogHelper.isValidProduct(productMock)).to.have.property('isError');
        });
        it('Should return true if isValidHsCodeRegion', function () {
            let isValidHsCodeRegion = eswCatalogHelper.isValidHsCodeRegion('AF');
            chai.expect(isValidHsCodeRegion).to.be.true;
        });
        it('Should return true if isValidCountryOfOrigin', function () {
            let isValidCountryOfOrigin = eswCatalogHelper.isValidCountryOfOrigin('AF');
            chai.expect(isValidCountryOfOrigin).to.be.true;
        });
        it('should convert array to chunk', function () {
            let arrayChunk = eswCatalogHelper.convertArrayToChunks([2, 3, 4, 5], 2);
            chai.expect(arrayChunk).to.deep.equal([[2, 3], [4, 5]]);
        });
    });
    describe('Error cases', function () {
        it('Should validate a product and return true', function () {
            productMock.getID = function () { return 'dummy_pid'; };
            productMock.getName = function () { return 'dummy_p_name'; };
            productMock.getShortDescription = function () { return MarkupMock; };
            productMock.getShortDescription().getMarkup = function () { return 'dummy_p_short_description'; };
            productMock.custom = {};
            chai.expect(eswCatalogHelper.isValidProduct(productMock)).to.throw;
        });
        it('Should return true if isValidCountryOfOrigin', function () {
            let isValidCountryOfOrigin = eswCatalogHelper.isValidCountryOfOrigin('FF');
            chai.expect(isValidCountryOfOrigin).to.be.false;
        });
        it('Should return true if isValidHsCodeRegion', function () {
            let isValidHsCodeRegion = eswCatalogHelper.isValidHsCodeRegion('FF');
            chai.expect(isValidHsCodeRegion).to.be.false;
        });
        it('should convert array to chunk', function () {
            let arrayChunk = eswCatalogHelper.convertArrayToChunks([], 2);
            chai.expect(arrayChunk).to.deep.equal([]);
        });
    });
});
