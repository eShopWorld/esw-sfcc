var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var calendarMock = require("../../../../mocks/dw/util/Calendar");
calendarMock.prototype.getTime = function () { return new Date('2021-03-25'); }

var FileMock = require('../../../../mocks/dw/io/File');
var FileWriterMock = require('../../../../mocks/dw/io/FileWriter');

describe('int_eshopworld_core/cartridge/scripts/helper/eswFileHelper.js', function () {
    var eswFileHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswFileHelper', {
        'dw/util/Calendar': calendarMock,
        'dw/io/File': FileMock,
        'dw/io/FileWriter': FileWriterMock
    }).eswFileHelper;
    describe("Success cases", function () {
        it("Should get date string from date object in specific format", function () {
            var dateStr = eswFileHelper.getCurrentDateString();
            expect(dateStr).to.equals('Thu_Mar_25_2021');
        });
        it("Should get date time string from date object in specific format", function () {
            var dateTimeStr = eswFileHelper.getCurrnetDateIsoString();
            expect(dateTimeStr).to.equals('2021-03-25T00_00_00.000Z');
        });
        it("Should create file in impex if no name is given", function () {
            var createFileFunction = eswFileHelper.createFile('IMPEX/src');
            expect(createFileFunction).to.be.instanceOf(FileMock);
        });
        it("Should create file in impex if  name is given", function () {
            var createFileFunction = eswFileHelper.createFile('IMPEX/src', 'myTestFile');
            expect(createFileFunction).to.be.instanceOf(FileMock);
        });
        it("Should get date time string from date object in specific format", function () {
            var dateTimeStr = eswFileHelper.getCurrnetDateIsoString();
            expect(dateTimeStr).to.equals('2021-03-25T00_00_00.000Z');
        });
    });
});
