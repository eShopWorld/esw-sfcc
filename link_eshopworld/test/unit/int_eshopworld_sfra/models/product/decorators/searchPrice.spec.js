'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var ArrayList = require('../../../../../mocks/dw.util.Collection');

var stubRangePrice = sinon.stub();
var stubDefaultPrice = sinon.stub();
var stubPriceModel = sinon.stub();
var stubRootPriceBook = sinon.stub();

var pricModelMock = {
    priceInfo: {
        priceBook: { ID: 'somePriceBook' }
    }
};

var searchHitMock = {
    minPrice: { value: 100, available: true },
    maxPrice: { value: 100, available: true },
    firstRepresentedProduct: {
        ID: 'someProduct',
        getPriceModel: stubPriceModel
    },
    discountedPromotionIDs: ['someID']
};

var noActivePromotionsMock = [];
var activePromotionsNoMatchMock = ['someOtherID'];

function getSearchHit() {
    return searchHitMock;
}


describe('search price decorator', function () {

    var searchPrice = proxyquire('../../../../../../cartridges/int_eshopworld_sfra/cartridge/models/product/decorators/searchPrice', {
        'dw/campaign/PromotionMgr': {
            getPromotion: function () {
                return {};
            }
        },
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    getEShopWorldModuleEnabled: function () { return true },
                    getOverrideCountry: function () { return 'country list' },
                    getAvailableCountry: function () { return 'country' },
                    getCurrentEswCurrencyCode: function () { return 'currency' },
                    getOverridePriceBooks: function () { return {} },
                }
            }
        },
        'dw/util/ArrayList': ArrayList,
        '*/cartridge/scripts/helpers/pricing': {
            getRootPriceBook: stubRootPriceBook,
            getPromotionPrice: function () { return { value: 50, available: true }; },
            getPromotions: function () {
                return {
                    getLength: function () { return 0 }
                }
            },
        },
        'dw/catalog/PriceBookMgr': {
            setApplicablePriceBooks: function () { },
            getApplicablePriceBooks: function () { }
        },
        '*/cartridge/models/price/default': stubDefaultPrice,
        '*/cartridge/models/price/range': stubRangePrice
    });

    afterEach(function () {
        stubRangePrice.reset();
        stubDefaultPrice.reset();
    });

    it('should create a property on the passed in object called price with no active promotions', function () {
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit);

        assert.isTrue(stubDefaultPrice.withArgs({ value: 100, available: true }).calledOnce);
    });

    it('should create a property on the passed in object called price when there are active promotion but they do not match', function () {
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchPrice(object, searchHitMock, activePromotionsNoMatchMock, getSearchHit);
        assert.isTrue(stubDefaultPrice.withArgs({ value: 100, available: true }).calledOnce);
    });

    it('should create a property on the passed in object called price', function () {
        var object = {};
        stubPriceModel.returns(pricModelMock);
        stubRootPriceBook.returns({ ID: 'someOtherPriceBook' });
        searchHitMock.maxPrice.value = 200;
        searchPrice(object, searchHitMock, noActivePromotionsMock, getSearchHit);
        assert.isTrue(stubRangePrice.withArgs({ value: 100, available: true }, { value: 200, available: true }).calledOnce);
    });

});
