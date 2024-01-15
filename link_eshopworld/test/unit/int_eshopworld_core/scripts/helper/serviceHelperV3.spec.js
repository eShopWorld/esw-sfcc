'use strict';
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();

var collections = require('../../../../mocks/dw.util.CollectionHelper');
var basketMgrMock = require('../../../../mocks/dw/order/BasketMgr');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var siteMock = require('../../../../mocks/dw/system/Site');
var urlUtilsMock = require('../../../../mocks/dw/web/URLUtils');

var Currency = require('../../../../mocks/dw/util/Currency');
Currency.getCurrency = function () {
    return 'Eur';
};

var LoggerMock = require('../../../../mocks/dw/system/Logger');

describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3.js', function () {
    var serviceHelperV3 = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelperV3', {
        '*/cartridge/scripts/util/collections': collections,
        'dw/system/Logger': LoggerMock,
        'dw/order/BasketMgr': basketMgrMock,
        'dw/util/StringUtils': StringUtils,
        'dw/system/Site': siteMock,
        'dw/web/URLUtils': urlUtilsMock,
        'dw/util/Currency': Currency,
        '*/cartridge/scripts/helper/eswCalculationHelper': {
            getMoneyObject: function () {
                return 23;
            }
        },
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                strToJson: function () {
                    return {
                        fromRetailerCurrencyIso: 'USD',
                        rate: '1',
                        toShopperCurrencyIso: 'Eur'
                    };
                },
                isEswRoundingsEnabled: function () {
                    return true;
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
                        fromRetailerCurrencyIso: 'USD',
                        rate: '0.045215122125',
                        toShopperCurrencyIso: 'EUR'
                    };
                    // eslint-disable-next-line no-param-reassign
                    billingAmount /= selectedFxRate.rate;
                    return Number(billingAmount);
                },
                getAvailableCountry: function () {
                    return 'IE';
                },
                applyRoundingModel: function () {
                    return 'price';
                },
                isESWSupportedCountry: function () {
                    return 'true';
                }
            }
        }
    });
    describe('Promotion message conversion', function () {
        it('Should convertPromotionMessage', function () {
            let promoString = serviceHelperV3.convertPromotionMessage('<span class="esw-price" data-disable-adjustments="true" data-disable-rounding="true">USD 23</span>');
            chai.expect(promoString).to.equal(null);
        });
    });
});
