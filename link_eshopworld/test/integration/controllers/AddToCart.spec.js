var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = chai.assert;
chai.use(chaiHttp);

var config = require('../it.config.spec');
var integrationHelper = require('../integrationHelpers.spec');
var urlPaths = require('../paths.spec');

describe("Add to cart integration", function () {
    this.timeout(15000);
    describe("Simple product", function () {
        it("Should navigate to PDP", async function () {
            var pdpUri = integrationHelper.getUrl(urlPaths[config.testFor].pdp);
            let resp = await chai.request(config.baseUrl).get(pdpUri);
            assert.equal(resp.statusCode, 200);
            chai.expect(resp.text).to.include('data-action="Product-Show"');
        });
        it("Should add product to cart", async function () {
            var productData = {
                pid: '013742003154M',
                quantity: 1,
                options: []
            };
            var addToCartUrl = integrationHelper.getUrl(urlPaths[config.testFor].addToCart);
            let resp = await chai.request(config.baseUrl).post(addToCartUrl)
                .set('content-type', 'application/x-www-form-urlencoded; charset=UTF-8')
                .set('Cookie', 'dwanonymous_1f866598df3d23bd96d7fbc0ff91985f=ce4VjtC4abKgNlcWTUWl5e0THV; dwanonymous_b5d8a8e2b741ecb26e2f400a02c69ec5=cdgKT9acbC5qg4z7fo3hghh5BP; dwsid=hBHWtjzqDSNR1AYcsJfCT-L8M8SriTQIaRLQcw0BvfaH-GFpsER2FdJcqg49VWH6SBfWPZzXsICedlpzgVczrg==; dwbmsid=Ja8jJRwos98ufC8qZUlGwjMAd28NTNwwu1YC_sYxhCAOZ_IhYbgyTkG9TEmEi-gBY20lKQO5ZN4x0cu1UKt39Q==; sid=gsQhRGHly9Vr679991H7M-QpxDb2hvL-Uy0; __cq_dnt=1; dw_dnt=1; esw.InternationalUser=true; esw.sessionid=cdgKT9acbC5qg4z7fo3hghh5BP; esw.currency=AUD; esw.Landing.Played=true; esw.location=AU; esw.LanguageIsoCode=en_US')
                .type('form')
                .send(productData);
            chai.expect(resp.body).to.have.property('quantityTotal');
            chai.expect(resp.body).to.not.throw;
        });
    });
});