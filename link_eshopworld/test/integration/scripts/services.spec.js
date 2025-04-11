/**
 * File handles integration tests for services,
 * We are not checking services with actual data so 40* errors 
 * to be considered that a test is passed with and without data
 */
'use strict';
var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var orderReturnServiceUrl = 'https://order-transaction-api-plugus.sandbox.eshopworld.com/';
var checkoutV2ServiceSfraUrl = 'https://checkout-api-plugus.sandbox.eshopworld.com/';
var checkoutV2ServiceSgUrl = 'https://checkout-api-plugeu.sandbox.eshopworld.com/';
var checkoutV3ServiceSfraUrl = 'https://checkout-api-plugus.sandbox.eshopworld.com/';
var authServiceUrl = 'https://security-sts.sandbox.eshopworld.com/';
var pkgV4Url = 'https://package-api.sandbox.eshopworld.com/';

describe("ServiceTests", function () {
    this.timeout(20000);
    describe("ESWOrderReturnService", function () {
        it('should throw 401 status with data', async function () {
            let resp = await chai.request(orderReturnServiceUrl).post('api/v2/Order/dummyRef/OrderActivity').send({});
            chai.expect(resp.status).equals(401);
        });
        it('should throw 401 without data', async function () {
            let resp = await chai.request(orderReturnServiceUrl).post('api/v2/Order/dummyRef/OrderActivity');
            chai.expect(resp.status).equals(401);
        });
    });

    describe(".SFRA", function () {
        it('should throw 401 status with data', async function () {
            let resp = await chai.request(checkoutV2ServiceSfraUrl).post('api/v2/PreOrder').send({});
            chai.expect(resp.status).equals(401);
        });
        it('should throw 401 without data', async function () {
            let resp = await chai.request(checkoutV2ServiceSfraUrl).post('api/v2/PreOrder');
            chai.expect(resp.status).equals(401);
        });
    });

    describe(".SG", function () {
        it('should throw 401 status with data', async function () {
            let resp = await chai.request(checkoutV2ServiceSgUrl).post('api/v2/PreOrder').send({});
            chai.expect(resp.status).equals(401);
        });
        it('should throw 401 without data', async function () {
            let resp = await chai.request(checkoutV2ServiceSgUrl).post('api/v2/PreOrder');
            chai.expect(resp.status).equals(401);
        });
    });

    describe("EswCheckoutV3Service.SFRA", function () {
        it('should throw 401 status with data', async function () {
            let resp = await chai.request(checkoutV3ServiceSfraUrl).post('api/v3/PreOrder').send({});
            chai.expect(resp.status).equals(401);
        });
        it('should throw 401 without data', async function () {
            let resp = await chai.request(checkoutV3ServiceSfraUrl).post('api/v3/PreOrder');
            chai.expect(resp.status).equals(401);
        });
    });

    describe("EswOAuthService", function () {
        it('should throw 401 status with data', async function () {
            let resp = await chai.request(authServiceUrl).post('connect/token').send({});
            chai.expect(resp.status).equals(400);
        });
        it('should throw 401 without data', async function () {
            let resp = await chai.request(authServiceUrl).post('connect/token');
            chai.expect(resp.status).equals(400);
        });
    });

    describe("EswPackageV4Service", function () {
        it('should throw 401 status with data', async function () {
            let resp = await chai.request(pkgV4Url).post('api/v4/Package').send({});
            chai.expect(resp.status).equals(401);
        });
        it('should throw 401 without data', async function () {
            let resp = await chai.request(pkgV4Url).post('api/v4/Package');
            chai.expect(resp.status).equals(401);
        });
    });
    describe('EswPriceFeedV4Credentials', function () {
        it('should throw 405 status with data', async function () {
            let resp = await chai.request('https://pricing-advisor-api.sandbox.eshopworld.com').post('/api/4.0/StandardAdvice/plugus').send({});
            chai.expect(resp.status).equals(405);
        });
    });

    describe('EswCatalogV4Credentials', function () {
        it('should throw 401 status with data', async function () {
            let resp = await chai.request('https://logistics-customscatalog-api.sandbox.eshopworld.com/').post('/api/v2/RetailerCatalog').send([{
                "productCode": "sony-ps3-bundleM",
                "name": "Playstation 3 Bundle",
                "description": "This is short desc",
                "material": "iron",
                "countryOfOrigin": "AG",
                "hsCode": "AGAGAG",
                "hsCodeRegion": "AG",
                "category": "electronics-game-consoles",
                "gender": null,
                "ageGroup": null,
                "size": null,
                "weight": null,
                "weightUnit": null,
                "url": null,
                "imageUrl": null,
                "unitPrice": null,
                "dangerousGoods": null,
                "additionalProductCode": null,
                "variantProductCode": null
            }]);
            chai.expect(resp.status).equals(401);
        });
    });
    describe('EswGetAsnPackage Service', function() {
        it('should throw 401 status with data', async function () {
            let resp = await chai.request('https://logistics-package-api.sandbox.eshopworld.com').get('/api/v4/Package/GetAsnPackage').query({
                FromDate: '2023-01-01T00:00:00Z',
                ToDate: '2023-01-31T23:59:59Z'
            });
            chai.expect(resp.status).equals(401);
        });
    });
});
