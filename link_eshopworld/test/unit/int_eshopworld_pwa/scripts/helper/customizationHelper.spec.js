
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../mocks/dw/system/Site');
var productMock = require('../../../../mocks/dw/catalog/Product');

describe('int_eshopworld_pwa/cartridge/scripts/helper/customizationHelper.js', function () {
    var customizationHelper = proxyquire('../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/helper/customizationHelper', {
        'dw/system/Site': SiteMock
    });
    // Unit test
    it('Override following method in order to customize the eSW Rounding model', function () {
        let appliedCustomizedRounding = customizationHelper.applyCustomizedRounding({}, {});
        expect(appliedCustomizedRounding).to.be.null;
    });
    it('Override following method to get product image based on view type', function () {
        productMock.getImage = function () { return { httpURL: 'test URL' } };
        let productImage = customizationHelper.getProductImage(productMock);
        expect(productImage).to.contains('URL');
    });
    it('Override default shipping method', function () {
        let defaultShippingMethodID = customizationHelper.getDefaultShippingMethodID('dm1', undefined);
        expect(defaultShippingMethodID).to.contains('dm1');
    });
});
