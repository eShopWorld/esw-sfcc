'use strict';
var proxyquire = require('proxyquire').noCallThru();
var chai = require('chai');

var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Logger = require('../../../../mocks/dw/system/Logger');
var Money = require('../../../../mocks/dw/value/Money');
var SystemMock = require('../../../../mocks/dw/system/System');
var URLUtilsMock = require('../../../../mocks/dw/web/URLUtils');
var HTTPClientMock = require('../../../../mocks/dw/net/HTTPClient');
var LocalServiceRegMock = require('../../../../mocks/dw/svc/LocalServiceRegistry');

describe('int_eshopworld_core/cartridge/scripts/helper/eswHealthCheckHelper', function () {
    var eswHealthCheckHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswHealthCheckHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getMoneyObject: function () {
                    return new Money();
                },
                isEswRoundingsEnabled: function () {
                    return 'true';
                },
                applyRoundingModel: function () {
                    return 'price';
                }
            }
        },
        'dw/system/Logger': Logger,
        'dw/system/System': SystemMock,
        'dw/web/URLUtils': URLUtilsMock,
        'dw/svc/LocalServiceRegistry': LocalServiceRegMock,
        'dw/net/HTTPClient': HTTPClientMock,
        '*/cartridge/scripts/util/collections': collections,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value === 'eswBaseCurrency') {
                            return 'some value';
                        }
                        return 'true';
                    }
                };
            }
        },
        '*/cartridge/scripts/services/EswCoreService': {
            getEswServices: function () {

            }
        }
    }).eswHealthCheckHelper;
    describe('sucess path', function () {
        it('Should return error in service', function () {
            let isError = eswHealthCheckHelper.serviceHasError(502);
            chai.expect(isError).to.be.true;
        });
        it('Should return error in service', function () {
            let isError = eswHealthCheckHelper.serviceHasError(200);
            chai.expect(isError).to.be.false;
        });
        it('Should callHttp', function () {
            let httpRes = eswHealthCheckHelper.callHttp('GET', 'https://google.com');
            chai.expect(httpRes.statusCode).to.equal(200);
        });
        it('Should getServiceRes', function () {
            let serviceTest = eswHealthCheckHelper.getServiceRes('ESWOrderReturnService', {});
            chai.expect(serviceTest).to.be.null;
        });
        it('Should isServiceInUse', function () {
            let serviceTest = eswHealthCheckHelper.isServiceInUse('EswPackageV4Servicess');
            chai.expect(serviceTest).to.deep.equal({ inUse: true, serviceName: 'ID' });
        });
    });
});
