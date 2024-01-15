
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const SiteMock = require('../../../../mocks/dw/system/Site');
var ArrayList = require('../../../../mocks/dw.util.Collection');
const collections = require('../../../../mocks/dw.util.CollectionHelper');
let money = require('../../../../mocks/dw.value.Money');
var resource = {
    msg: function (param1) {
        return param1;
    }
};

describe('int_eshopworld_pwa/cartridge/scripts/helper/eswPwaCoreHelper.js', function () {
    var eswPwaCoreHelper = proxyquire('../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/helper/eswPwaCoreHelper', {
        'dw/system/Site': SiteMock,
        'dw/util/ArrayList': ArrayList,
        'dw/content/ContentMgr': '',
        'dw/web/Resource': resource,
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getSelectedCountryDetail: function () {
                    return {
                        name: '',
                        countrycode: ''
                    }
                },
                getESWCurrencyFXRate: function () {
                    return ''
                },
                getESWCountryAdjustments: function () {
                    return ''
                },
                getMoneyObject: function () {
                    return {
                        available: true,
                        value: '10.99',
                        getDecimalValue: function () { return '10.99'; },
                        getCurrencyCode: function () { return 'EUR'; },
                        subtract: function () { return new Money(isAvailable); }
                    };
                },
                isProductRestricted: function () {
                    return false
                },
                isEswRoundingsEnabled: function () {
                    return false
                },
                getAllCountries: function () {
                    return []
                },
                getBaseCurrencyPreference: function () {
                    return 'EUR';
                }
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {
                getESWRoundingModel: function () {
                    return ''
                },
            }
        },
        '*/cartridge/scripts/helper/eswHelperHL': {
            isProductRestricted: function () {
                return false
            },
            isReturnProhibited: function () {
                return false
            },
            getFinalOrderTotalsObject: function () {
                return money()
            }
        },
        '*/cartridge/scripts/helper/eswTimeZoneHelper': '',
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/helper/eswPricingHelperHL': {
            getConversionPreference: function () {
            }
        }
    });
    // Unit test
    it('Return country locale', () => {
        let countryByTimeZone = eswPwaCoreHelper.getLocaleCountry('en-IE');
        expect(countryByTimeZone).to.equals('IE');
    });
    it('return country details', () => {
        const httpParams = 'en-IE'
        let countryDetailByParam = eswPwaCoreHelper.getCountryDetailByParam(httpParams);
        expect(countryDetailByParam).to.have.property('name');
    });
    it('return localized country details', () => {
        const selectedCountryDetail = {
            defaultCurrencyCode: 'USD',
            countryCode: 'EUR'
        }
        let countryLocalizeObj = eswPwaCoreHelper.getCountryLocalizeObj(selectedCountryDetail);
        expect(countryLocalizeObj).to.have.property('currencyCode');
    });
    it('Modify product items', () => {
        const productItems = [{
            price: '',
            basePrice: '',
            priceAfterItemDiscount: '',
            priceAfterOrderDiscount: '',
            priceAdjustments: [],
            c_eswRestrictedProduct: '',
            c_eswReturnProhibited: '',
            c_eswReturnProhibitedMsg: ''
        }]
        let modifyLineItems = eswPwaCoreHelper.modifyLineItems(productItems, {countryCode: 'EUR'});
        expect(modifyLineItems).to.have.property('docModifiedLineItems');
    });
    it('returns promo code array', () => {
        const order = {};
        order.couponLineItems = [{
            couponCode: 'qa1'
        }]
        let retailerPromoCodes = eswPwaCoreHelper.getRetailerPromoCodes(order);
        chai.expect(retailerPromoCodes).to.be.instanceOf(Array);
    });
    it('returns shopper URL', () => {
        let shopperCheckoutExperience = eswPwaCoreHelper.getPwaShopperUrl('en-IE');
        expect(shopperCheckoutExperience).to.be.an('string');
    });
    it('returns updated lineitems', () => {
        const basketLineItems = [
            {
                price: '10',
                basePrice: '10',
                priceAfterItemDiscount: '10',
                priceAfterOrderDiscount: '10',
                priceAdjustments: []
            }
        ];

        const selectedCountryLocalizeObj = {
            isFixedPriceModel: false,
            countryCode: 'US', // Provide the appropriate country code for testing
        };
        let modifyLineItems = eswPwaCoreHelper.modifyLineItems(basketLineItems, selectedCountryLocalizeObj);
        expect(modifyLineItems).to.have.property('docModifiedLineItems');
    });
    it('returns site Data', () => {
        SiteMock.getCurrent = function () {
            return {
                getID: function () {
                    return 'test'
                },
                getAllowedLocales: function () {
                    return []
                },
                getCurrent: function () {
                }
            }
        }
        let getPwaSitesData = eswPwaCoreHelper.getPwaSitesData('en-IE');
        expect(getPwaSitesData).to.be.an('array');
    });
    it('returns shopper URL', () => {
        let cart;
        let grandTotal = eswPwaCoreHelper.getGrandTotal(cart, {countryCode: 'IE', currencyCode: 'EUR'}, {shippingTotal: 100});
        expect(grandTotal).to.be.an('string');
    });
});
