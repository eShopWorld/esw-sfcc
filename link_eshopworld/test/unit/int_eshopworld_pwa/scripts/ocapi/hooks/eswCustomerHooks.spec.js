
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../../mocks/dw/system/Site');
var Status = require('../../../../../mocks/dw/system/Status');

describe('int_eshopworld_pwa/cartridge/scripts/ocapi/shop//int_eshopworld_pwa.js', function () {
    var customerHooks = proxyquire('../../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/ocapi/shop/hooks/customerHooks', {
        'dw/system/Site': SiteMock,
        'dw/system/Status': Status,
        '*/cartridge/scripts/helper/eswOCAPIHelperHL': {
            handleCustomerPostResponse: function () {return {}}
        }
    });
    // Unit test
    it('Override following method in order to customize the eSW Rounding model', function () {
        let afterPOST = customerHooks.afterPOST({}, {});
        expect(afterPOST).to.be.an('object');
    });
});
