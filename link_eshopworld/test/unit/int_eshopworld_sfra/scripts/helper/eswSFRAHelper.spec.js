
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../mocks/dw/system/Site');
const CookieMock = require('../../../../mocks/dw/web/Cookie');

describe('int_eshopworld_sfra/cartridge/scripts/helper/eswOrderImportHelper.js', function () {
    var eswSFRAHelper = proxyquire('../../../../../cartridges/int_eshopworld_sfra/cartridge/scripts/helper/eswSFRAHelper', {
        'dw/system/Site': SiteMock,
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    isAjaxCall: function () { return false; },
                    getSelectedCountryProductPrice: function () { 
                        return {
                            value: '',
                            currency: '',
                            decimalPrice: ''
                        };
                    },
                    getCurrentEswCurrencyCode: function () { return 'EUR'; },
                    getAvailableCountry: function () { return 'US'; }
                };
            }
        }
    });
    describe('isAjaxCall', function () {
        it('Should Get Ajax Call status', function () {
            let isAjaxCall = eswSFRAHelper.isAjaxCall();
            expect(isAjaxCall).to.equals(false);
        });
    });
    describe('product price object', function () {
        it('should return product price', () => {
            const productPrice = eswSFRAHelper.getSelectedCountryProductPrice(15, 'USD');
            expect(productPrice).to.have.property('currency');
        });
    });
    describe('getCurrentEswCurrencyCode', function () {
        it('should return CurrentEswCurrencyCode', () => {
            const currentEswCurrencyCode = eswSFRAHelper.getCurrentEswCurrencyCode();
            expect(currentEswCurrencyCode).to.equals('EUR');
        });
    });
    describe('getAvailableCountry', function () {
        it('should return AvailableCountry', () => {
            const availableCountry = eswSFRAHelper.getAvailableCountry();
            expect(availableCountry).to.equals('US');
        });
    });
});
