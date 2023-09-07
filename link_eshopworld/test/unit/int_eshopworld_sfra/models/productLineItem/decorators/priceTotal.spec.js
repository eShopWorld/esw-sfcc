'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../../mocks/dw.util.Collection');

var lineItemMock = {
    priceAdjustments: new ArrayList([]),
    getPrice: function () {},
    adjustedPrice: {
        add: function () {}
    },
    quantity: {
        add: function () {}
    },
    basePrice: {
        currencyCode: ''
    },
    optionProductLineItems: new ArrayList([{
        adjustedPrice: {},
        quantity: {}
    }])
};

describe('product line item price total decorator', function () {
    var collections = proxyquire('../../../../../../cartridges/int_eshopworld_core/cartridge/scripts/util/collections', {
        'dw/util/ArrayList': ArrayList
    });

    var priceTotal = proxyquire('../../../../../../cartridges/int_eshopworld_sfra/cartridge/models/productLineItem/decorators/priceTotal', {
        '*/cartridge/scripts/util/collections': collections,
		'*/cartridge/scripts/helper/eswSFRAHelper' : {
			getEShopWorldModuleEnabled : function () { return true },
			getMoneyObject : function () { return 'formatted Money'; },
            getSubtotalObject : function () { return 'formatted Money'; },
			getCurrentEswCurrencyCode: function () { return 'currency' }
		},
        '*/cartridge/scripts/renderTemplateHelper': {
            getRenderedHtml: function () { return 'rendered HTML'; }
        },
        'dw/util/StringUtils': {
            formatMoney: function () { return 'formatted Money'; }
        },
        'dw/value': {
            Money: function () { return 'Money object'; }
        }
    });

    it('should create priceTotal property for passed in object', function () {
        var object = {};
        priceTotal(object, lineItemMock);

        assert.equal(object.priceTotal.price, 'formatted Money');
        assert.equal(object.priceTotal.renderedPrice, 'rendered HTML');
    });

    it('should handel price adjustments', function () {
        var object = {};
        lineItemMock.priceAdjustments = new ArrayList([{}]);
        priceTotal(object, lineItemMock);

        assert.equal(object.priceTotal.price, 'formatted Money');
    });
});
