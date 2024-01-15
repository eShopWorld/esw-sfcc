
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../mocks/dw/system/Site');

describe('int_eshopworld_pwa/cartridge/scripts/helper/eswTimeZoneHelper.js', function () {
    var eswTzHelper = proxyquire('../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/helper/eswTimeZoneHelper', {
        'dw/system/Site': SiteMock
    });
    // Unit test
    it('Happy: Get country by time zone', () => {
        let countryByTimeZone = eswTzHelper.getCountryByTimeZone('Africa/Abidjan');
        expect(countryByTimeZone).to.equals('CI');
    });
    it('Sad: Get country by time zone', () => {
        let countryByTimeZone = eswTzHelper.getCountryByTimeZone();
        expect(countryByTimeZone).to.be.null;
    });
});
