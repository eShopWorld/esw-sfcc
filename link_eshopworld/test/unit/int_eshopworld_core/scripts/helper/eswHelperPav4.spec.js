var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var UtilstMock = require('../../../../mocks/dw/util');
var collectionMock = require('../../../../mocks/dw.util.Collection');
var samplePaV4Data = {
    id: 'PLUGUS_IE',
    version: '58949fdf-5e3c-42b0-96a7-328d10836ae5',
    countryIso: 'IE',
    lastUpdated: '2023-04-19 06:31:13Z',
    tenantIdentifier: 'PLUGUS',
    merchandisePricingModel: 'ALLINCLUSIVE',
    fxRates: [
        {
            from: 'USD',
            to: 'EUR',
            rate: 0.9126419220735312130245976438
        }
    ],
    categories: [
        {
            id: 'default',
            estimatedTax: 20.0,
            estimatedFee: 0.0,
            estimatedDuty: 0.0,
            retailerAdjustment: 0.0,
            roundingConfigurations: [
                {
                    currencyIso: 'EUR',
                    currencyExponent: 2,
                    direction: 'Up',
                    model: 'none.none'
                }
            ],
            currencyDisplays: [
                {
                    currencyIso: 'EUR',
                    currencySymbol: '€',
                    currencyExponent: 2,
                    decimalSeparator: '.',
                    thousandSeparator: ',',
                    showTrailingZeros: true,
                    configurationString: '[CurrencySymbol][Number][DecimalSeparator][Exponent]'
                }
            ]
        }
    ]
};


describe('int_eshopworld_core/cartridge/scripts/helper/eswHelperPav4.js', function () {
    var eswHelperPav4 = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswHelperPav4', {
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    getPricingAdvisorData: function () {
                        return {};
                    }
                };
            },
            getPricingAdvisorData: function () {
                return {
                    fxRates: [{ fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'AUD', rate: '1.713783750261352' }, { fromRetailerCurrencyIso: 'USD', toShopperCurrencyIso: 'AUD', rate: '1.5704926859956025' }, { fromRetailerCurrencyIso: 'USD', toShopperCurrencyIso: 'EUR', rate: '0.9621552266050354' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'ZAR', rate: '20.880637485693097' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'HKD', rate: '8.994340073577096' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'MOP', rate: '9.271944074082342' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'TRY', rate: '22.105922979337816' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'USD', rate: '1.1458019971423699' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'MAD', rate: '11.614995211845901' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'PYG', rate: '8219.873158310205' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'OMR', rate: '0.4410588002739505' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'CHF', rate: '1.0068562783280748' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'SGD', rate: '1.5246745493895508' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'THB', rate: '39.092242167394275' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'KWD', rate: '0.3514423499310857' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'GBP', rate: '0.9204929980304212' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'MXN', rate: '20.898583502348167' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'QAR', rate: '4.20515551033417' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'SAR', rate: '4.298152957480033' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'CNY', rate: '7.881857481497872' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'RUB', rate: '93.990496078185' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'IDR', rate: '17114.569814423237' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'TWD', rate: '34.85873197008432' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'ILS', rate: '4.1469991719314265' }, { fromRetailerCurrencyIso: 'EUR', toShopperCurrencyIso: 'KRW', rate: '1511.0565146837496' }],
                    countryAdjustment: [{ deliveryCountryIso: 'AU', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 11, taxPercentage: 5 } }, { deliveryCountryIso: 'SM', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 20, taxPercentage: 0 } }, { deliveryCountryIso: 'ZA', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 15, taxPercentage: 20 } }, { deliveryCountryIso: 'HK', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 0, taxPercentage: 10 } }, { deliveryCountryIso: 'MO', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 0, taxPercentage: 0 } }, { deliveryCountryIso: 'TR', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 0, taxPercentage: 20 } }, { deliveryCountryIso: 'US', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 5, taxPercentage: 15 } }, { deliveryCountryIso: 'MC', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 12, taxPercentage: 0 } }, { deliveryCountryIso: 'MA', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 2.5, taxPercentage: 20 } }, { deliveryCountryIso: 'PY', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 22, taxPercentage: 10 } }, { deliveryCountryIso: 'OM', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 5, taxPercentage: 0 } }, { deliveryCountryIso: 'BA', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 20, taxPercentage: 17 } }, { deliveryCountryIso: 'BR', retailerAdjustments: { priceUpliftPercentage: -9.09 }, estimatedRates: { dutyPercentage: 22, taxPercentage: 19 } }, { deliveryCountryIso: 'DE', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 0, taxPercentage: 19 } }, { deliveryCountryIso: 'CH', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 7, taxPercentage: 7.7 } }, { deliveryCountryIso: 'SG', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 8, taxPercentage: 0.1 } }, { deliveryCountryIso: 'TH', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 7, taxPercentage: 25.5 } }, { deliveryCountryIso: 'KW', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 5, taxPercentage: 0 } }, { deliveryCountryIso: 'GB', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 20, taxPercentage: 4.2 } }, { deliveryCountryIso: 'MX', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 16, taxPercentage: 15 } }, { deliveryCountryIso: 'NO', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 10.6, taxPercentage: 25 } }, { deliveryCountryIso: 'QA', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 5, taxPercentage: 0 } }, { deliveryCountryIso: 'SA', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 12, taxPercentage: 5 } }, { deliveryCountryIso: 'CN', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 5, taxPercentage: 10 } }, { deliveryCountryIso: 'RU', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 18, taxPercentage: 14 } }, { deliveryCountryIso: 'GE', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 5, taxPercentage: 18 } }, { deliveryCountryIso: 'ID', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 10, taxPercentage: 10 } }, { deliveryCountryIso: 'TW', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 0, taxPercentage: 0 } }, { deliveryCountryIso: 'IE', retailerAdjustments: { priceUpliftPercentage: -9.09 }, estimatedRates: { dutyPercentage: 0, taxPercentage: 23 } }, { deliveryCountryIso: 'IL', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 12, taxPercentage: 17 } }, { deliveryCountryIso: 'KR', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 13, taxPercentage: 10 } }, { deliveryCountryIso: 'MY', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 0, taxPercentage: 0 } }, { deliveryCountryIso: 'MD', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 10, taxPercentage: 20 } }, { deliveryCountryIso: 'AL', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 15, taxPercentage: 20 } }, { deliveryCountryIso: 'PE', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 6, taxPercentage: 18 } }, { deliveryCountryIso: 'SE', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 4.5, taxPercentage: 25 } }, { deliveryCountryIso: 'AF', retailerAdjustments: { priceUpliftPercentage: 0 }, estimatedRates: { dutyPercentage: 0, taxPercentage: 0 } }],
                    roundingModels: [{ deliveryCountryIso: 'AU', roundingModels: [{ currencyIso: 'AUD', currencyExponent: 2, direction: 'Up', model: 'multiple5.multiple50' }, { currencyIso: 'EUR', currencyExponent: 2, direction: 'None', model: 'none.none' }] }, { deliveryCountryIso: 'SM', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'ZA', roundingModels: [{ currencyIso: 'ZAR', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'HK', roundingModels: [{ currencyIso: 'HKD', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'MO', roundingModels: [{ currencyIso: 'MOP', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'TR', roundingModels: [{ currencyIso: 'TRY', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'US', roundingModels: [{ currencyIso: 'USD', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'MC', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'MA', roundingModels: [{ currencyIso: 'MAD', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'PY', roundingModels: [{ currencyIso: 'PYG', currencyExponent: 0, direction: 'Up', model: 'none.none' }, { currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'OM', roundingModels: [{ currencyIso: 'OMR', currencyExponent: 3, direction: 'Up', model: 'none.none' }, { currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'BA', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'BR', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'DE', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'CH', roundingModels: [{ currencyIso: 'CHF', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'SG', roundingModels: [{ currencyIso: 'SGD', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'TH', roundingModels: [{ currencyIso: 'THB', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'KW', roundingModels: [{ currencyIso: 'KWD', currencyExponent: 3, direction: 'Up', model: 'none.none' }, { currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'GB', roundingModels: [{ currencyIso: 'GBP', currencyExponent: 2, direction: 'Down', model: 'none.fixed99' }] }, { deliveryCountryIso: 'MX', roundingModels: [{ currencyIso: 'MXN', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'NO', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'QA', roundingModels: [{ currencyIso: 'QAR', currencyExponent: 2, direction: 'Up', model: 'none.none' }, { currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'SA', roundingModels: [{ currencyIso: 'SAR', currencyExponent: 2, direction: 'Up', model: 'none.none' }, { currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'CN', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'None', model: 'none.none' }, { currencyIso: 'CNY', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'RU', roundingModels: [{ currencyIso: 'RUB', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'GE', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'ID', roundingModels: [{ currencyIso: 'IDR', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'TW', roundingModels: [{ currencyIso: 'TWD', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'IE', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'IL', roundingModels: [{ currencyIso: 'ILS', currencyExponent: 2, direction: 'Up', model: 'none.none' }] }, { deliveryCountryIso: 'KR', roundingModels: [{ currencyIso: 'KRW', currencyExponent: 0, direction: 'Up', model: 'none.none' }, { currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'MY', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'MD', roundingModels: [{ currencyIso: 'EUR', currencyExponent: 2, direction: 'Up', model: 'none.fixed00' }] }, { deliveryCountryIso: 'AL', roundingModels: [{ currencyIso: 'ALL', currencyExponent: 2, direction: 'None', model: 'none.none' }] }, { deliveryCountryIso: 'PE', roundingModels: [{ currencyIso: 'PEN', currencyExponent: 2, direction: 'None', model: 'none.none' }] }, { deliveryCountryIso: 'SE', roundingModels: [{ currencyIso: 'SEK', currencyExponent: 2, direction: 'Up', model: 'multiple5.fixed00' }] }, { deliveryCountryIso: 'AF', roundingModels: [{ currencyIso: 'AFN', currencyExponent: 2, direction: 'None', model: 'none.none' }] }],
                    eswPricingSynchronizationId: 'randomString'
                };
            }
        },
        '*/cartridge/scripts/util/Constants': {},
        'dw/util/ArrayList': UtilstMock.ArrayList,
        '*/cartridge/scripts/util/collections': {
            forEach: function () {
                var args = Array.from(samplePaV4Data);
                var list = args[0];
                var callback = args[1];
                if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
                    list = list.toArray();
                }
                return list ? list.forEach(callback) : null;
            }
        }
    });
    describe('Success Cases', function () {
        it('Should getMapPaV4DataForCustomObject', function () {
            var sampleDatRes = eswHelperPav4.getMapPaV4DataForCustomObject(samplePaV4Data);
            chai.expect(sampleDatRes.fxRates).to.be.instanceOf(Array);
        });
        it('Should getPaDataByCategoryOrCountry', function () {
            var paByCountry = eswHelperPav4.getPaDataByCategoryOrCountry('IE', 'default', 'EUR');
            chai.expect(paByCountry).to.be.instanceOf(Object);
        });
    });
    describe('Error Cases', function () {
        it('Should getMapPaV4DataForCustomObject', function () {
            var sampleDatRes = eswHelperPav4.getMapPaV4DataForCustomObject({});
            chai.expect(sampleDatRes.countryAdjustments).to.equals(undefined);
        });
        it('Should getPaDataByCategoryOrCountry', function () {
            var paByCountry = eswHelperPav4.getPaDataByCategoryOrCountry('IE', 'default', 'EUR');
            chai.expect(paByCountry.selectedCountryAdjustment).to.deep.equal([]);
        });
    });
});
