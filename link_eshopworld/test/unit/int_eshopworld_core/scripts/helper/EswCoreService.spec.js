var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var LoggerMock = require('../../../../mocks/dw/system/Logger');

var integrationHelper = require('../../../../integration/integrationHelpers.spec');
var reqObj = integrationHelper.getRequest();

describe('int_eshopworld_core/cartridge/scripts/services/EswCoreService.js', function () {
    var EswCoreService = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/services/EswCoreService', {
        'dw/system/Logger': LoggerMock,
        'dw/svc/LocalServiceRegistry': {
            createService: function () {
                return {
                    createRequest: function () { return 'fake clientID'; },
                    parseResponse: function () { return {}; },
                    filterLogMessage: function () { return {}; },
                    getRequestLogMessage: function () { return {}; },
                    getResponseLogMessage: function () { return {}; }
                };
            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getClientID: function () { return 'fake clientID'; },
                eswInfoLogger: function () { return 'a logger function'; },
                getSelectedPriceFeedInstance: function () { return 'EswPriceFeedV4Service.PROD'; },
                getCheckoutServiceName: function () { return 'EswCheckoutv3'; }
            } }
    }).getEswServices();
    describe('Happy path', function () {
        it('Should test esw order V2 api', function () {
            let returnResult = EswCoreService.getOrderSubmitAPIServiceV2(reqObj);
            expect(returnResult).to.be.an('object');
        });
        it('Should test esw order V3 api', function () {
            let returnResult = EswCoreService.getOrderSubmitAPIServiceV2(reqObj);
            expect(returnResult).to.be.an('object');
        });
        it('Should  not return false for PAv3 service', function () {
            let serviceRes = EswCoreService.getPricingV3Service();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getOAuthService', function () {
            let serviceRes = EswCoreService.getOAuthService();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getPricingOAuthService', function () {
            let serviceRes = EswCoreService.getPricingOAuthService();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getPreorderServiceV2', function () {
            let serviceRes = EswCoreService.getPreorderServiceV2();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getPackageServiceV4', function () {
            let serviceRes = EswCoreService.getPackageServiceV4();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getOrderAPIServiceV2', function () {
            let serviceRes = EswCoreService.getOrderAPIServiceV2();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getOrderAPIServiceV2', function () {
            let serviceRes = EswCoreService.getEswOrderReturnService();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getOrderSubmitAPIServiceV2', function () {
            let serviceRes = EswCoreService.getOrderSubmitAPIServiceV2();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getPricingAdvisorService', function () {
            let serviceRes = EswCoreService.getPricingAdvisorService();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getCatalogService', function () {
            let serviceRes = EswCoreService.getCatalogService();
            expect(serviceRes).not.to.be.false;
        });
        it('Should  not return false for getCatalogService', function () {
            let service = {
                URL: 'http://localhost:',
                addHeader: function (header) {
                    return '';
                },
                setRequestMethod: function (header) {
                    return '';
                }
            };
            let serviceRes = EswCoreService.createRequest(service);
            expect(serviceRes).to.be.undefined;
        });
    });
});
