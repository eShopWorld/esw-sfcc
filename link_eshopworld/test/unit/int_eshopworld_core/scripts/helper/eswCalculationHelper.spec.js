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

describe('int_eshopworld_core/cartridge/scripts/helper/eswCalculationHelper.js', function () {
    var eswCoreHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/eswCalculationHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getPaVersion: function (paVersion) {
                    return (!global.empty(paVersion)) ? 'PAv4' : paVersion;
                },
                getEShopWorldModuleEnabled: function () {
                    return true;
                },
                getBaseCurrencyPreference: function () {
                    return 'EUR';
                },
                getSelectedCountryDetail: function () {
                    var selectedCountry = {
                        countryCode: 'USD',
                        name: '',
                        defaultCurrencyCode: 'USD',
                        baseCurrencyCode: 'USD',
                        isSupportedByESW: 'false',
                        isFixedPriceModel: 'false'
                    };
                    selectedCountry.name = 'Canada';
                    selectedCountry.defaultCurrencyCode = 'CAD';
                    selectedCountry.baseCurrencyCode = '';
                    selectedCountry.isSupportedByESW = 'true';
                    selectedCountry.isFixedPriceModel = 'true';
                    return selectedCountry;
                },
                applyOverridePrice: function (billingAmount) {
                    var selectedFxRate = {
                        fromRetailerCurrencyIso: 'EUR',
                        rate: '1',
                        toShopperCurrencyIso: session.getCurrency().currencyCode
                    };
                    // eslint-disable-next-line no-param-reassign
                    billingAmount /= selectedFxRate.rate;
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
        getPaVersion: function () { return 'PAv3'; },
        getMoneyObject: function () { return 25; },
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
                return 'formatted money';
            }
        },
        '*/cartridge/scripts/util/Constants': require('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/Constants')
    }).getEswCalculationHelper;

    describe('Happy path', function () {
        describe('Fixed price cases', function () {
            it('Should Get money object with duty and tax, fxrate calculations and apply adjustments', function () {
                let price = 25;
                let moneyObject = eswCoreHelper.getMoneyObject(price, false, true, false, {
                    selectedCountry: 'GB',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'EUR',
                        toShopperCurrencyIso: 'GBP',
                        rate: '0.8048807985769707'
                    },
                    selectedCountryAdjustments: {
                        deliveryCountryIso: 'GBP',
                        retailerAdjustments: {
                            priceUpliftPercentage: 0
                        },
                        estimatedRates: {
                            dutyPercentage: 0,
                            taxPercentage: 20
                        }
                    },
                    selectedRoundingRule: {
                        currencyIso: 'GB',
                        currencyExponent: 2,
                        direction: 'Up',
                        model: 'none.fixed99'
                    }
                });
                expect(moneyObject).to.equals(20.12201996442427);
            });
        });

        describe('Dynamic price cases', function () {
            it('Should Get money object with duty and tax, fxrate calculations and apply adjustments PAv3', function () {
                let price = 25;
                let moneyObject = eswCoreHelper.getMoneyObject(price, false, true, false, {
                    selectedCountry: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'EUR',
                        toShopperCurrencyIso: 'EUR',
                        rate: '0.8048807985769707'
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
                    selectedRoundingRule: {
                        currencyIso: 'IE',
                        currencyExponent: 2,
                        direction: 'Up',
                        model: 'none.fixed99'
                    }
                });
                expect(moneyObject).to.equals(price);
            });

            it('Should Get money object with duty and tax, fxrate calculations and apply adjustments PAv4', function () {
                let price = 25;
                let moneyObject = eswCoreHelper.getMoneyObject(price, false, true, false, {
                    selectedCountry: 'IE',
                    selectedFxRate: {
                        fromRetailerCurrencyIso: 'EUR',
                        toShopperCurrencyIso: 'EUR',
                        rate: '0.8048807985769707'
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
                    selectedRoundingRule: {
                        currencyIso: 'IE',
                        currencyExponent: 2,
                        direction: 'Up',
                        model: 'none.fixed99'
                    }
                });
                expect(moneyObject).to.equals(price);
            });
        });
    });

    describe('Sad Path', function () {
        it('Should throw error', function () {
            let price;
            let moneyObject = eswCoreHelper.getMoneyObject(price, false, false, false, null);
            expect(moneyObject).to.throw;
        });
        it('Should Get money object with duty and tax, fxrate calculations and apply adjustments', function () {
            let price = 1.23;
            let moneyObject = eswCoreHelper.getMoneyObject(price, false, false, false, null);
            expect(moneyObject).to.have.property('value');
        });
    });
});
