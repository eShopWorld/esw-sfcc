var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

var URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
URLUtilsMock.https = function () { return 'https://zyfl-002.dx.commercecloud.salesforce.com' };
var HTTPClientMock = require("../../../../mocks/dw/net/HTTPClient");
var SystemMock = require("../../../../mocks/dw/system/System");
var LoggerMock = require("../../../../mocks/dw/system/Logger");
describe("int_eshopworld_core/cartridge/scripts/jobs/EswHealthCheck.js", function () {
    var eswHealthCheckHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswHealthCheckHelper', {
        'dw/web/URLUtils': URLUtilsMock,
        'dw/net/HTTPClient': HTTPClientMock,
        'dw/system/System': SystemMock,
        'dw/system/Logger': LoggerMock
    }).eswHealthCheckHelper;
    describe("serviceHasError Function", function () {
        describe("success path", function () {
            it("Should pass when error code is 500", function () {
                var serviceErrorResult = eswHealthCheckHelper.serviceHasError(500);
                expect(serviceErrorResult).to.be.true;
            });
            it("Should pass when error code is 502", function () {
                var serviceErrorResult = eswHealthCheckHelper.serviceHasError(502);
                expect(serviceErrorResult).to.be.true;
            });
            it("Should pass when error code is 408", function () {
                var serviceErrorResult = eswHealthCheckHelper.serviceHasError(408);
                expect(serviceErrorResult).to.be.true;
            });
        });
        describe("Fail path", function () {
            it("Should fail when error code is 200", function () {
                var serviceErrorResult = eswHealthCheckHelper.serviceHasError(200);
                expect(serviceErrorResult).to.be.false;
            });
            it("Should fail when error code is 201", function () {
                var serviceErrorResult = eswHealthCheckHelper.serviceHasError(201);
                expect(serviceErrorResult).to.be.false;
            });
            it("Should fail when error code is 202", function () {
                var serviceErrorResult = eswHealthCheckHelper.serviceHasError(202);
                expect(serviceErrorResult).to.be.false;
            });
        });
    });
    describe("callHttp Function", function () {
        it("Should call an http status code 200 with POST", function () {
            var httpCallRes = eswHealthCheckHelper.callHttp('GET', 's/RefArch/home');
            expect(httpCallRes.statusCode).to.equals(200);
        });
    });
    describe("callHttp Function", function () {
        it("Should call an http status code 200 with POST", function () {
            var httpCallRes = eswHealthCheckHelper.callHttp('GET', 's/RefArch/home');
            expect(httpCallRes.statusCode).to.equals(200);
        });
    });
    describe("callHttp Function", function () {
        it("Should call an http status code 200 with POST", function () {
            var httpCallRes = eswHealthCheckHelper.callHttp('GET', 's/RefArch/home');
            expect(httpCallRes.statusCode).to.equals(200);
        });
    });
});