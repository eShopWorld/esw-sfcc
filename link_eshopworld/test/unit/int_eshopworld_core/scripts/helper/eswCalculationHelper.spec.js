/* eslint-disable no-mixed-operators */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var empty = require('../../../../mocks/dw.global.empty');

global.empty = empty(global);

var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: ''
    }
};

global.session = session;

const toFixedNum = 7;

function getConvertedPriceV3(price, upliftPercentage, dutyPercentage, taxPercentage, fx) {
    return (price * (1 + upliftPercentage / 100) * (1 + dutyPercentage / 100) * (1 + taxPercentage / 100) * fx);
}

function getConvertedPriceV4(price, upliftPercentage, dutyPercentage, taxPercentage, fx, feePercentage) {
    return (((((price * (1 + upliftPercentage / 100)) * (1 + dutyPercentage / 100)) * (1 + taxPercentage / 100) * (1 + feePercentage / 100)) * fx).toFixed(toFixedNum));
}


describe('int_eshopworld_core/cartridge/scripts/helper/eswCalculationHelper.js', function () {
    let eswCoreHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCalculationHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                isEswRoundingsEnabled: function () { return true; },
                getPaVersion: function () {
                    return 'PAv4';
                },
                getEShopWorldModuleEnabled: function () {
                    return true;
                },
                getBaseCurrencyPreference: function () {
                    return 'USD';
                },
                getSelectedCountryDetail: function () {
                    var selectedCountry = {
                        countryCode: 'USD',
                        name: '',
                        defaultCurrencyCode: 'EUR',
                        baseCurrencyCode: 'USD',
                        isSupportedByESW: 'false',
                        isFixedPriceModel: false
                    };
                    selectedCountry.name = 'Ireland';
                    selectedCountry.defaultCurrencyCode = 'EUR';
                    selectedCountry.baseCurrencyCode = 'USD';
                    selectedCountry.isSupportedByESW = 'true';
                    selectedCountry.isFixedPriceModel = false;
                    return selectedCountry;
                },
                applyOverridePrice: function (billingAmount) {
                    return Number(billingAmount);
                },
                getAvailableCountry: function () {
                    return 'USD';
                },
                applyRoundingModel: function () {
                    return 'price';
                },
                isESWSupportedCountry: function () {
                    return 'true';
                }
            }
        },
        // getMoneyObject: function () { return 25; },
        'dw/system/Transaction': stubTransaction,
        'dw/web/Cookie': stubCookie,
        'dw/value/Money': Money,
        'dw/system/Logger': {
            debug: function (text) {
                return text;
            },
            error: function (text) {
                return text;
            }
        },
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value === 'eswBaseCurrency') {
                            return 'some value';
                        }
                        return 'true';
                    }
                };
            }
        },
        'dw/util/StringUtils': {
            formatMoney: function () {
                return null;
            }
        },
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants')
    }).getEswCalculationHelper;

    describe('PAv3', function () {
        describe('Job test inputs PAv3', function () {
            it('1: Should calculate dynamic price for the job without rounding and without formatted', function () {
                let price = 100;
                let options = {
                    isJob: true,
                    selectedCountry: 'IE',
                    currencyCode: 'EUR',
                    countryCode: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'USD',
                        toShopperCurrencyIso: 'EUR',
                        rate: '0.9549342703383'
                    },
                    selectedCountryAdjustments: {
                        deliveryCountryIso: 'EUR',
                        retailerAdjustments: {
                            priceUpliftPercentage: 0
                        },
                        estimatedRates: {
                            dutyPercentage: 0,
                            taxPercentage: 20
                        }
                    },
                    selectedRoundingRule: null
                };
                const expectedPrice = getConvertedPriceV3(
                    price,
                    options.selectedCountryAdjustments.retailerAdjustments.priceUpliftPercentage,
                    options.selectedCountryAdjustments.estimatedRates.dutyPercentage,
                    options.selectedCountryAdjustments.estimatedRates.taxPercentage, options.selectedFxRate.rate
                );
                const moneyObject = eswCoreHelper.getMoneyObject(price, false, true, true, options);
                expect(moneyObject.available).to.equal(expectedPrice);
            });
            it('2: Should calculate dynamic price for the job without rounding and without formatted', function () {
                let price = 56;
                let options = {
                    isJob: true,
                    selectedCountry: 'IE',
                    currencyCode: 'EUR',
                    countryCode: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'USD',
                        toShopperCurrencyIso: 'EUR',
                        rate: '0.1549342703383'
                    },
                    selectedCountryAdjustments: {
                        deliveryCountryIso: 'EUR',
                        retailerAdjustments: {
                            priceUpliftPercentage: 0
                        },
                        estimatedRates: {
                            dutyPercentage: 0,
                            taxPercentage: 20
                        }
                    },
                    selectedRoundingRule: null
                };
                const expectedPrice = getConvertedPriceV3(
                    price,
                    options.selectedCountryAdjustments.retailerAdjustments.priceUpliftPercentage,
                    options.selectedCountryAdjustments.estimatedRates.dutyPercentage,
                    options.selectedCountryAdjustments.estimatedRates.taxPercentage, options.selectedFxRate.rate
                );
                const moneyObject = eswCoreHelper.getMoneyObject(price, false, true, true, options);
                expect(moneyObject.available).to.equal(expectedPrice);
            });
            it('3: Should calculate dynamic price for the job without rounding and without formatted', function () {
                let price = 569803;
                let options = {
                    isJob: true,
                    selectedCountry: 'IE',
                    currencyCode: 'EUR',
                    countryCode: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'USD',
                        toShopperCurrencyIso: 'EUR',
                        rate: '0.2049342703383'
                    },
                    selectedCountryAdjustments: {
                        deliveryCountryIso: 'EUR',
                        retailerAdjustments: {
                            priceUpliftPercentage: 0
                        },
                        estimatedRates: {
                            dutyPercentage: 0,
                            taxPercentage: 20
                        }
                    },
                    selectedRoundingRule: null
                };
                const expectedPrice = getConvertedPriceV3(
                    price,
                    options.selectedCountryAdjustments.retailerAdjustments.priceUpliftPercentage,
                    options.selectedCountryAdjustments.estimatedRates.dutyPercentage,
                    options.selectedCountryAdjustments.estimatedRates.taxPercentage, options.selectedFxRate.rate
                );
                const moneyObject = eswCoreHelper.getMoneyObject(price, false, true, true, options);
                expect(moneyObject.available).to.equal(expectedPrice);
            });
        });
    });

    describe('PAv4', function () {
        let PaV4Inputs = [];
        for (let i = 0; i < 5; i++) {
            PaV4Inputs.push({
                price: Math.random() * 99999 + 0.1,
                options: {
                    selectedCountry: 'IE',
                    currencyCode: 'EUR',
                    countryCode: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'USD',
                        toShopperCurrencyIso: 'EUR',
                        rate: Math.random() * 0.9 + 0.1
                    },
                    selectedCountryAdjustments: {
                        deliveryCountryIso: 'EUR',
                        retailerAdjustments: {
                            priceUpliftPercentage: Math.random() * 99.9 + 0.1
                        },
                        estimatedRates: {
                            dutyPercentage: Math.random() * 99.9 + 0.1,
                            taxPercentage: Math.random() * 99.9 + 0.1,
                            feePercentage: Math.random() * 99.9 + 0.1
                        }
                    },
                    selectedRoundingRule: null
                }
            });
        }
        describe('Random Test inputs when isJob is false', function () {
            /**
             * This case will generate random test inputs
             * If error occured it will display input data
             * Developer can use that data to denbug the issue
             */
            it('Should calculate dynamic price for the job without rounding and without formatted', function () {
                for (let i = 0; i < PaV4Inputs.length; i++) {
                    let price = PaV4Inputs[i].price;
                    let options = PaV4Inputs[i].options;
                    let expectedPrice = getConvertedPriceV4(
                        price,
                        options.selectedCountryAdjustments.retailerAdjustments.priceUpliftPercentage,
                        options.selectedCountryAdjustments.estimatedRates.dutyPercentage,
                        options.selectedCountryAdjustments.estimatedRates.taxPercentage,
                        options.selectedFxRate.rate,
                        options.selectedCountryAdjustments.estimatedRates.feePercentage
                    );
                    let moneyObject = eswCoreHelper.getMoneyObject(price, false, true, true, options);
                    expect(moneyObject.available.toFixed(toFixedNum), '\nError in data ===> ' + JSON.stringify(PaV4Inputs[i]) + '\n').to.equal(expectedPrice);
                }
            });
        });
        describe('Job test inputs PAv4', function () {
            it('1: Should calculate dynamic price for the job without rounding and without formatted', function () {
                let price = 100;
                let options = {
                    isJob: true,
                    selectedCountry: 'IE',
                    currencyCode: 'EUR',
                    countryCode: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'USD',
                        toShopperCurrencyIso: 'EUR',
                        rate: '0.9549342703383'
                    },
                    selectedCountryAdjustments: {
                        deliveryCountryIso: 'EUR',
                        retailerAdjustments: {
                            priceUpliftPercentage: 0
                        },
                        estimatedRates: {
                            dutyPercentage: 0,
                            taxPercentage: 20,
                            feePercentage: 20
                        }
                    },
                    selectedRoundingRule: null
                };
                const expectedPrice = getConvertedPriceV4(
                    price,
                    options.selectedCountryAdjustments.retailerAdjustments.priceUpliftPercentage,
                    options.selectedCountryAdjustments.estimatedRates.dutyPercentage,
                    options.selectedCountryAdjustments.estimatedRates.taxPercentage,
                    options.selectedFxRate.rate,
                    options.selectedCountryAdjustments.estimatedRates.feePercentage
                );
                const moneyObject = eswCoreHelper.getMoneyObject(price, false, true, true, options);
                expect(moneyObject.available.toFixed(toFixedNum)).to.equal(expectedPrice);
            });
            it('2: Should calculate dynamic price for the job without rounding and without formatted', function () {
                let price = 56;
                let options = {
                    isJob: true,
                    selectedCountry: 'IE',
                    currencyCode: 'EUR',
                    countryCode: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'USD',
                        toShopperCurrencyIso: 'EUR',
                        rate: '0.1549342703383'
                    },
                    selectedCountryAdjustments: {
                        deliveryCountryIso: 'EUR',
                        retailerAdjustments: {
                            priceUpliftPercentage: 0
                        },
                        estimatedRates: {
                            dutyPercentage: 0,
                            taxPercentage: 20,
                            feePercentage: 20
                        }
                    },
                    selectedRoundingRule: null
                };
                const expectedPrice = getConvertedPriceV4(
                    price,
                    options.selectedCountryAdjustments.retailerAdjustments.priceUpliftPercentage,
                    options.selectedCountryAdjustments.estimatedRates.dutyPercentage,
                    options.selectedCountryAdjustments.estimatedRates.taxPercentage, options.selectedFxRate.rate,
                    options.selectedCountryAdjustments.estimatedRates.feePercentage
                );
                const moneyObject = eswCoreHelper.getMoneyObject(price, false, true, true, options);
                expect(moneyObject.available.toFixed(toFixedNum)).to.equal(expectedPrice);
            });
            it('3: Should calculate dynamic price for the job without rounding and without formatted', function () {
                let price = 569803;
                let options = {
                    isJob: true,
                    selectedCountry: 'IE',
                    currencyCode: 'EUR',
                    countryCode: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'USD',
                        toShopperCurrencyIso: 'EUR',
                        rate: '0.2049342703383'
                    },
                    selectedCountryAdjustments: {
                        deliveryCountryIso: 'EUR',
                        retailerAdjustments: {
                            priceUpliftPercentage: 0
                        },
                        estimatedRates: {
                            dutyPercentage: 2,
                            taxPercentage: 35,
                            feePercentage: 24
                        }
                    },
                    selectedRoundingRule: null
                };
                const expectedPrice = getConvertedPriceV4(
                    price,
                    options.selectedCountryAdjustments.retailerAdjustments.priceUpliftPercentage,
                    options.selectedCountryAdjustments.estimatedRates.dutyPercentage,
                    options.selectedCountryAdjustments.estimatedRates.taxPercentage,
                    options.selectedFxRate.rate,
                    options.selectedCountryAdjustments.estimatedRates.feePercentage
                );
                const moneyObject = eswCoreHelper.getMoneyObject(price, false, true, true, options);
                expect(moneyObject.available.toFixed(toFixedNum)).to.equal(expectedPrice);
            });
        });
    });
});
