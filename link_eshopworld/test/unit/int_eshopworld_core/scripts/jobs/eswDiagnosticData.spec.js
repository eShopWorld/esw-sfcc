'use strict';

var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var dwLoggerMock = require('../../../../mocks/dw/system/Logger');
var dwStatusMock = require('../../../../mocks/dw/system/Status');
var CustomObjectMgr = require('../../../../mocks/dw/object/CustomObjectMgr');
var Transaction = require('../../../../mocks/dw/system/Transaction');
var ResourceMock = require('../../../../mocks/dw/web/Resource')

describe.skip('int_eshopworld_core/cartridge/scripts/jobs/CatalogFeed.js', function () {
    // var diagnosticData = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/jobs/eswDiagnosticData', {
    //     'dw/system/Logger': dwLoggerMock,
    //     'dw/system/Status': dwStatusMock,
    //     'dw/object/CustomObjectMgr': CustomObjectMgr,
    //     'dw/system/Transaction': Transaction,
    //     'dw/web/Resource': ResourceMock
    // });

    // it('Should return ERROR status', function () {
    //     let jobRes = diagnosticData.execute();
    //     chai.expect(jobRes).to.be.an.instanceof(dwStatusMock);
    // });
});
