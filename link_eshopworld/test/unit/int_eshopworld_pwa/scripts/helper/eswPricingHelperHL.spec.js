
// var chai = require('chai');
// var proxyquire = require('proxyquire').noCallThru();
// var expect = chai.expect;

// const Basket = require('../../../../mocks/dw/order/Basket');
// const SiteMock = require('../../../../mocks/dw/system/Site');
// const Logger = require('../../../../mocks/dw/system/Logger');

// describe('int_eshopworld_pwa/cartridge/scripts/helper/eswPricingHelperHL.js', function () {
//     var eswPricingHelperHL = proxyquire('../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/helper/eswPricingHelperHL', {
//         'dw/system/Site': SiteMock,
//         'dw/system/Logger': Logger,
//         'dw/catalog/PriceBookMgr': {
//             getPriceBook: function () {
//                 return '';
//             }
//         },
//         '*/cartridge/scripts/helper/eswCoreHelper': {
//             getEswHelper: {
//                 getMoneyObject: function () {
//                     return Money();
//                 },
//                 isEswRoundingsEnabled: function () {
//                     return 'true';
//                 },
//                 applyRoundingModel: function () {
//                     return 'price';
//                 },
//                 getOverrideShipping: function () {
//                     return '';
//                 },
//                 getSelectedCountryDetail: function (shopperCountry) {
//                     if (shopperCountry) {
//                         return {
//                             name: 'test',
//                             defaultCurrencyCode: 'EUR',
//                             isFixedPriceModel: true
//                         };
//                     }
//                     return null;
//                 },
//                 getOverridePriceBooks: function (country) {
//                     if (country) {
//                         return ['test-pricebook'];
//                     }
//                     return [];
//                 },
//                 getPricingAdvisorData: function () {
//                     return { fxRates: [{ toShopperCurrencyIso: 'EUR', fromRetailerCurrencyIso: 'USD' }] };
//                 },
//                 getBaseCurrencyPreference: function () {
//                     return 'USD';
//                 }
//             }
//         },
//         '*/cartridge/scripts/helper/eswHelperHL': {
//             getOverridePriceBooks: function () {
//                 return ['test-pricebook'];
//             }
//         },
//         getESWCurrencyFXRate: function (country) {
//             return '';
//         }
//     });
//     // Unit test
//     it('return override shipping cost conversion enable', function () {
//         let shippingCostConversionEnabled = eswPricingHelperHL.isShippingCostConversionEnabled('EUR');
//         expect(shippingCostConversionEnabled).to.be.true;
//     });
//     it('Happy: return override shipping cost conversion enable', function () {
//         let shopperCurrency = eswPricingHelperHL.getShopperCurrency('en-IE');
//         expect(shopperCurrency).to.be.contain('EUR');
//     });
//     it('Sad: return override shipping cost conversion enable', function () {
//         let shopperCurrency = eswPricingHelperHL.getShopperCurrency();
//         expect(shopperCurrency).to.be.null;
//     });
//     it('Happy: return override price book for fixed price country on basket', function () {
//         let overridePriceBooks = eswPricingHelperHL.setOverridePriceBooks('en-IE', 'EUR', Basket, false);
//         expect(overridePriceBooks).to.be.true;
//     });
//     it('Sad: return override price book for fixed price country on basket', function () {
//         let overridePriceBooks = eswPricingHelperHL.setOverridePriceBooks();
//         expect(overridePriceBooks).to.be.false;
//     });
//     it('return fixed price country', function () {
//         let fixedPriceCountry = eswPricingHelperHL.isFixedPriceCountry('en-IE');
//         expect(fixedPriceCountry).to.be.true;
//     });
//     it('return localized price', function () {
//         const localizeObj = {
//             applyCountryAdjustments: true,
//             localizeCountryObj: {
//                 countryCode: 'EUR'
//             }
//         };
//         let convertedPrice = eswPricingHelperHL.getConvertedPrice(10, localizeObj, { selectedFxRate: {} });
//         expect(convertedPrice).to.be.equals(10);
//     });
//     it('Happy: return Conversion Prefrence', function () {
//         const localizeObj = {
//             applyCountryAdjustments: true,
//             localizeCountryObj: {
//                 currencyCode: 'EUR',
//                 countryCode: 'en-IE'
//             },
//             applyRoundingModel: 'false'
//         };
//         let convertedPrice = eswPricingHelperHL.getConversionPreference(localizeObj);
//         expect(convertedPrice).to.have.property('selectedFxRate');
//     });
//     it('Sad: return Conversion Prefrence', function () {
//         let convertedPrice = eswPricingHelperHL.getConversionPreference();
//         expect(convertedPrice).to.be.null;
//     });
// });
