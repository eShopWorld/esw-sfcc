'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Money = require('../dw.value.Money');
var ArrayList = require('../../mocks/dw.util.Collection');

function proxyModel() {
	var collections = proxyquire('../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections',{
	'dw/util/ArrayList': ArrayList
    });
	
    return proxyquire('../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/models/totals', {
        'dw/util/StringUtils': {
            formatMoney: function () {
                return 'formatted money';
            }
        },
        'dw/value/Money': Money,
        'dw/util/Template': function () {
            return {
                render: function () {
                    return { text: 'someString' };
                }
            };
        },
        'dw/util/HashMap': function () {
            return {
                result: {},
                put: function (key, context) {
                    this.result[key] = context;
                }
            };
        },
        '*/cartridge/scripts/util/collections': collections,
		'*/cartridge/scripts/helper/eswHelper' : { 
			getEswHelper : function () { return 'formatted Money'; } 
		}
    });
}

module.exports = proxyModel();
