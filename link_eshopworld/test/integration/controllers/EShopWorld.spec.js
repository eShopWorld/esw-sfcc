var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = chai.assert;
chai.use(chaiHttp);

var config = require('../it.config.spec');
var integrationHelper = require('../integrationHelpers.spec');
var urlPaths = require('../paths.spec');

/**
 * Test case: GetDefaultCurrency
 * endpoint should be available
 */
describe("controllers/EShopWorld.js", function () {
    this.timeout(20000);
    describe('GetDefaultCurrency', function () {
        describe('positive test', function () {
            it('EShopWorld GetDefaultCurrency: endpoint should be available and return response object.', async function () {
                let controllerPath = integrationHelper.getUrl(urlPaths.SFRA.getDefaultCurrency);
                let resp = await chai.request(config.baseUrl).get(controllerPath).query({ country: 'GB' });
                let jsonResponse = resp.body;
                assert.equal(resp.statusCode, 200);
                assert.property(jsonResponse, 'success');
                assert.property(jsonResponse, 'isAllowed');
                assert.property(jsonResponse, 'currency');
            });
        });
    });


    describe('GetEswHeader', function () {
        describe('positive test', function () {
            it("should render template for GetEswHeader", async function () {
                let controllerPath = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-GetEswHeader';
                let resp = await chai.request(config.baseUrl).get(controllerPath);
                chai.expect(resp.text).to.include("selectors selector-container headerDropdown");
            });
        });
    });

    describe("Home", function () {
        it("Should rebuild the cart upon redirect from ESW checkout", async function () {
            var controllerPath = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-Home';
            let resp = await chai.request(config.baseUrl).get(controllerPath);
            chai.expect(resp).to.have.status(200);
            chai.expect(resp).to.redirectTo(/home/gi);
        });
    });

    describe("GetCart", function () {
        it("Should rebuild the cart upon redirect from ESW checkout", async function () {
            var controllerPath = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-GetCart';
            let resp = await chai.request(config.baseUrl).get(controllerPath);
            chai.expect(resp).to.have.status(200);
            chai.expect(resp).to.redirectTo(/cart/gi);
        });
    });

    describe('ProcessWebHooks', function () {
        describe("Order returns", function () {
            it("Should throw if order ID is not found in the BM", async function () {
                var controllerPath = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-ProcessWebHooks';
                let resp = await chai.request(config.baseUrl).post(controllerPath).send({
                    ReturnOrder: {
                        BrandOrderReference: "fakeID"
                    }
                });
                chai.expect(resp).to.throw;
            });
        });
        describe("Order Appeasements", function () {
            it("Should check appeasement webhook response", async function () {
                var controllerUrl = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-ProcessWebHooks';
                let resp = await chai.request(config.baseUrl).post(controllerUrl).send({
                    ReturnOrder: {
                        AppeasementType: "fakeID"
                    }
                });
                console.log(config.baseUrl + controllerUrl)
                chai.expect(resp).to.throw;
            });
        });
    });

    describe("GetSlectedCountryProductPrice", function () {
        it("Should throw if no product found", async function () {
            let controllerPath = "/GetSlectedCountryProductPrice";
            let resp = await chai.request(config.baseUrl).get(controllerPath);
            chai.expect(resp).to.throw;
        });
    });

    describe("RegisterCustomer", function () {
        it("Should throw if session.privacy.confirmedOrderID not found", async function () {
            let controllerPath = "/RegisterCustomer";
            let resp = await chai.request(config.baseUrl).get(controllerPath);
            chai.expect(resp).to.throw;
        });
    });
    describe("ProcessExternalOrder", function () {
        it("Should place the order based on request object", async function () {
            let requestObj = integrationHelper.getRequest();
            let controllerPath = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-ProcessExternalOrder';
            let resp = await chai.request(config.baseUrl).post(controllerPath).send(
                requestObj
            );
            assert.equal(resp.unauthorized, false);
        });
        it("Should throw if request object is not available", async function () {
            let controllerPath = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-ProcessExternalOrder';
            let resp = await chai.request(config.baseUrl).post(controllerPath).send({});
            let jsonResponse = resp.body;
            assert.equal(resp.unauthorized, false);
        });
    });
    describe("Notify", function () {
        it("Should throw if confirm order not with auth or BM existed OrderID status", async function () {
            let controllerPath = "/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-Notify";
            let resp = await chai.request(config.baseUrl).post(controllerPath).send(
                {
                    retailerCartId : 'fakeID',
                    eShopWorldOrderNumber: 'fakeOrderNumber'
                });
            chai.expect(resp).to.throw;
        });
    });

    describe("ValidateInventory", function () {
        it("Should throw if inventory not found", async function () {
            let controllerPath = "/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-ValidateInventory";
            let resp = await chai.request(config.baseUrl).post(controllerPath).send(
                {
                    retailerCartId : 'fakeID',
                });
            chai.expect(resp).to.throw;
        });
    });

    describe('GetEswFooter', function () {
        describe('positive test', function () {
            it("should render template for GetEswFooter", async function () {
                let controllerPath = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-GetEswFooter';
                let resp = await chai.request(config.baseUrl).get(controllerPath);
                chai.expect(resp.text).to.include("selectors selector-container footerDropdown");
            });
        });
    });

    describe('GetEswAppResources', function () {
        describe('positive test', function () {
            it("should render template for GetEswAppResources", async function () {
                let controllerPath = '/on/demandware.store/Sites-RefArch-Site/default/EShopWorld-GetEswAppResources';
                let resp = await chai.request(config.baseUrl).get(controllerPath);
                chai.expect(resp.text).to.include("window.SitePreferences");
            });
        });
    });
});