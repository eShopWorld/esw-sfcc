var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

// TODO: Generate such things using faker kind of libraries
var eswPaData = {
    fxRates: [{
        fromRetailerCurrencyIso: 'USD',
        toShopperCurrencyIso: 'GBP',
        rate: '0.8467257108364803'
    }, {
        fromRetailerCurrencyIso: 'USD',
        toShopperCurrencyIso: 'AED',
        rate: '3.672939987342314'
    }, {
        fromRetailerCurrencyIso: 'USD',
        toShopperCurrencyIso: 'AUD',
        rate: '1.4366577596942791'
    }, {
        fromRetailerCurrencyIso: 'USD',
        toShopperCurrencyIso: 'CAD',
        rate: '1.29460999742761'
    }, {
        fromRetailerCurrencyIso: 'USD',
        toShopperCurrencyIso: 'EUR',
        rate: '1.0034921513456831'
    }],
    countryAdjustment: [{
        deliveryCountryIso: 'AU',
        retailerAdjustments: {
            priceUpliftPercentage: 0
        },
        estimatedRates: {
            dutyPercentage: 0,
            taxPercentage: 10
        }
    }, {
        deliveryCountryIso: 'GB',
        retailerAdjustments: {
            priceUpliftPercentage: 0
        },
        estimatedRates: {
            dutyPercentage: 0,
            taxPercentage: 20
        }
    }, {
        deliveryCountryIso: 'US',
        retailerAdjustments: {
            priceUpliftPercentage: 0
        },
        estimatedRates: {
            dutyPercentage: 12,
            taxPercentage: 10
        }
    }, {
        deliveryCountryIso: 'IE',
        retailerAdjustments: {
            priceUpliftPercentage: 0
        },
        estimatedRates: {
            dutyPercentage: 0,
            taxPercentage: 20
        }
    }, {
        deliveryCountryIso: 'CA',
        retailerAdjustments: {
            priceUpliftPercentage: 0
        },
        estimatedRates: {
            dutyPercentage: 6.5,
            taxPercentage: 0
        }
    }],
    roundingModels: [{
        deliveryCountryIso: 'AU',
        roundingModels: [{
            currencyIso: 'AUD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.fixed00'
        }, {
            currencyIso: 'CAD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.fixed00'
        }, {
            currencyIso: 'CNY',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'DKK',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'fixed99.fixed00'
        }, {
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'GBP',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.fixed99'
        }, {
            currencyIso: 'USD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'GB',
        roundingModels: [{
            currencyIso: 'AUD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'CNY',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'DKK',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'fixed99.fixed00'
        }, {
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'GBP',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'USD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'US',
        roundingModels: [{
            currencyIso: 'AUD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'GBP',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.fixed99'
        }, {
            currencyIso: 'USD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'IE',
        roundingModels: [{
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.fixed00'
        }]
    }, {
        deliveryCountryIso: 'CA',
        roundingModels: [{
            currencyIso: 'AUD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'CAD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'GBP',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.fixed99'
        }, {
            currencyIso: 'USD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'HK',
        roundingModels: [{
            currencyIso: 'HKD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'DE',
        roundingModels: [{
            currencyIso: 'AUD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'CAD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'CNY',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'DKK',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'fixed99.fixed00'
        }, {
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'GBP',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.fixed99'
        }, {
            currencyIso: 'USD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'SG',
        roundingModels: [{
            currencyIso: 'SGD',
            currencyExponent: 2,
            direction: 'Down',
            model: 'none.fixed99'
        }]
    }, {
        deliveryCountryIso: 'IT',
        roundingModels: [{
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'ES',
        roundingModels: [{
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'DK',
        roundingModels: [{
            currencyIso: 'AUD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'DKK',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'fixed99.fixed00'
        }, {
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }, {
            currencyIso: 'GBP',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.fixed99'
        }, {
            currencyIso: 'USD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'SE',
        roundingModels: [{
            currencyIso: 'SEK',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'fixed99.fixed00'
        }, {
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'none.fixed99'
        }]
    }, {
        deliveryCountryIso: 'AE',
        roundingModels: [{
            currencyIso: 'AED',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'multiple5.fixed00'
        }]
    }, {
        deliveryCountryIso: 'AT',
        roundingModels: [{
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'BE',
        roundingModels: [{
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'BH',
        roundingModels: [{
            currencyIso: 'BHD',
            currencyExponent: 3,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'BR',
        roundingModels: [{
            currencyIso: 'BRL',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'EG',
        roundingModels: [{
            currencyIso: 'USD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'HU',
        roundingModels: [{
            currencyIso: 'HUF',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'multiple100.fixed00'
        }]
    }, {
        deliveryCountryIso: 'IL',
        roundingModels: [{
            currencyIso: 'ILS',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'multiple5.fixed00'
        }]
    }, {
        deliveryCountryIso: 'IN',
        roundingModels: [{
            currencyIso: 'INR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'JP',
        roundingModels: [{
            currencyIso: 'JPY',
            currencyExponent: 0,
            direction: 'Nearest',
            model: 'multiple1000.none'
        }]
    }, {
        deliveryCountryIso: 'LV',
        roundingModels: [{
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'MX',
        roundingModels: [{
            currencyIso: 'MXN',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'MY',
        roundingModels: [{
            currencyIso: 'MYR',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'multiple5.fixed00'
        }]
    }, {
        deliveryCountryIso: 'NZ',
        roundingModels: [{
            currencyIso: 'NZD',
            currencyExponent: 2,
            direction: 'Up',
            model: 'none.none'
        }]
    }, {
        deliveryCountryIso: 'PL',
        roundingModels: [{
            currencyIso: 'PLN',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'multiple10.fixed00'
        }]
    }, {
        deliveryCountryIso: 'RU',
        roundingModels: [{
            currencyIso: 'RUB',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'multiple5.fixed00'
        }]
    }, {
        deliveryCountryIso: 'VN',
        roundingModels: [{
            currencyIso: 'VND',
            currencyExponent: 0,
            direction: 'Nearest',
            model: 'multiple100000.none'
        }]
    }, {
        deliveryCountryIso: 'ZA',
        roundingModels: [{
            currencyIso: 'ZAR',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'none.fixed00'
        }]
    }, {
        deliveryCountryIso: 'HR',
        roundingModels: [{
            currencyIso: 'HRK',
            currencyExponent: 2,
            direction: 'Up',
            model: 'fixed99.fixed00'
        }, {
            currencyIso: 'EUR',
            currencyExponent: 2,
            direction: 'Nearest',
            model: 'fixed99.fixed00'
        }]
    }],
    eswPricingSynchronizationId: '2f672b8c-ce7d-471d-b5a3-eb09d93d8579'
};

describe('int_eshopworld_core/cartridge/scripts/helper/eswPricingHelper.js', function () {
    var eswPricingHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswPricingHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getPricingAdvisorData: function () { return eswPaData; },
                eswInfoLogger: function () { return 'a logger function'; }
            }
        },
        'dw/system/Logger': require('../../../../mocks/dw/system/Logger')
    }).eswPricingHelper;
    describe('Happy path', function () {
        it('Should Get Rounding Model for localize country', function () {
            let localizeObj = {
                currencyCode: 'EUR',
                countryCode: 'IE',
                applyRoundingModel: true,
                applyCountryAdjustments: false
            };
            let getESWRoundingModel = eswPricingHelper.getESWRoundingModel(localizeObj);
            // TODO: resultObj should be after comparing localizeObj and pricing advisor data
            let resultObj = [{
                currencyExponent: 2,
                currencyIso: localizeObj.currencyCode,
                direction: 'Up',
                model: 'none.fixed00'
            }];
            expect(getESWRoundingModel).to.deep.equal(resultObj);
        });
        it('Should return an empty rounding model result', function () {
            let localizeObj = null;
            let getESWRoundingModel = eswPricingHelper.getESWRoundingModel(localizeObj);
            expect(getESWRoundingModel).to.be.an('array').that.is.empty;
        });
        it('Should return an empty rounding model result', function () {
            let localizeObj = '';
            let getESWRoundingModel = eswPricingHelper.getESWRoundingModel(localizeObj);
            expect(getESWRoundingModel).to.be.an('array').that.is.empty;
        });
        it('Should return an empty rounding model result', function () {
            let localizeObj = 'undefined';
            let getESWRoundingModel = eswPricingHelper.getESWRoundingModel(localizeObj);
            expect(getESWRoundingModel).to.be.an('array').that.is.empty;
        });
    });
    describe('Sad Path', function () {
        it('Should throw error', function () {
            let localizeObj;
            let getESWRoundingModel = eswPricingHelper.getESWRoundingModel(localizeObj);
            chai.expect(getESWRoundingModel).to.throw;
        });
    });
});
