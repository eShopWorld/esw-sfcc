
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;

const collections = require('../../../../mocks/dw.util.CollectionHelper');
const SiteMock = require('../../../../mocks/dw/system/Site');
const Basket = require('../../../../mocks/dw/order/Basket');
const Money = require('../../../../mocks/dw.value.Money');
var ArrayList = require('../../../../mocks/dw.util.Collection');
var PROMOTION_CLASS_PRODUCT = 'awesome promotion';
const ShippingMgr = require('../../../../mocks/dw/order/ShippingMgr');
const Currency = require('../../../../mocks/dw/util/Currency');
const Transaction = require('../../../../mocks/dw/system/Transaction');
const ProductMgrMock = require('../../../../mocks/dw/catalog/ProductMgr');

// eslint-disable-next-line require-jsdoc
function MockInstanceOf() {
}

var hookMgr = {
    callHook: function () {}
};
const localizeObj = {
    applyCountryAdjustments: true,
    localizeCountryObj: {
        currencyCode: 'EUR',
        countryCode: 'en-IE'
    },
    applyRoundingModel: 'false'
};

ProductMgrMock.getProduct = function () {
    return {
        custom: {
            eswProductRestrictedCountries: false
        }
    };
};

describe('int_eshopworld_pwa/cartridge/scripts/helper/eswHelperHL.js', function () {
    var eswHelperHL = proxyquire('../../../../../cartridges/int_eshopworld_pwa/cartridge/scripts/helper/eswHelperHL', {
        'dw/system/Site': SiteMock,
        'dw/value/Money': Money,
        '*/cartridge/scripts/helper/eswPricingHelper': {
            eswPricingHelper: {
                getConvertedPrice: function () { return 1; },
                isShippingCostConversionEnabled: function () { return true; }
            }
        },
        '*/cartridge/scripts/helper/eswPricingHelperHL': {
            isShippingCostConversionEnabled: function () {
                return false;
            }
        },
        'dw/campaign/Promotion': {
            PROMOTION_CLASS_ORDER: PROMOTION_CLASS_PRODUCT
        },
        'dw/order/ShippingMgr': ShippingMgr,
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                checkIsEswAllowedCountry: function () {
                    return true;
                },
                getOverrideShipping: function () {
                    return [];
                },
                getOrderProratedDiscount: function () {
                    return 10;
                },
                getProductLineMetadataItemsPreference: function () {
                    return 'someattribute|someattribute';
                },
                removeThresholdPromo: function () {
                    return {};
                }
            }
        },
        '*/cartridge/scripts/helper/serviceHelper': '',
        'dw/system/HookMgr': hookMgr,
        'dw/util/Currency': Currency,
        'dw/system/Transaction': Transaction,
        'dw/catalog/ProductMgr': ProductMgrMock,
        'dw/order/PriceAdjustment': MockInstanceOf,
        '*/cartridge/scripts/util/collections': collections
    });
    // Unit test
    it('Returns Order Prorated Discount', () => {
        Basket.priceAdjustments = new ArrayList([{
            promotion: {
                promotionClass: 'awesome promotion',
                price: 10
            },
            priceValue: 10
        }]);
        let orderProratedDiscount = eswHelperHL.getOrderProratedDiscount(Basket);
        expect(orderProratedDiscount).to.be.equals(10);
    });
    it('Returns getOrder Discount', () => {
        Basket.priceAdjustments = new ArrayList([{
            promotion: {
                promotionClass: 'awesome promotion',
                price: 10
            },
            priceValue: 10
        }]);
        let orderDiscount = eswHelperHL.getOrderDiscount(Basket, localizeObj);
        expect(orderDiscount).to.have.property('value');
    });
    it('Returns Applied shipping method', () => {
        Basket.getDefaultShipment = function () {
            return {
                getID: function () {
                    return 'me';
                },
                setShippingMethod: function () {
                    return '';
                }
            };
        };
        Basket.getShipment = function () {
            return {
                setShippingMethod: function () {
                    return '';
                }
            };
        };
        Basket.getCurrencyCode = function () {
            return 'EUR';
        };
        ShippingMgr.getShipmentShippingModel = function () {
            return {
                getApplicableShippingMethods: function () {
                    return [{
                        ID: {
                            equals: function () {
                                return true;
                            }
                        },
                        displayName: 'me',
                        currencyCode: 'EUR'
                    }];
                }
            };
        };
        let shippingMethod = eswHelperHL.applyShippingMethod(Basket, 'me', 'IE', false);
        expect(shippingMethod).to.have.property('displayName');
    });
    it('Returns product item metadata items', () => {
        Basket.productLineItem = {
            price: '',
            basePrice: '',
            priceAfterItemDiscount: '',
            priceAfterOrderDiscount: '',
            priceAdjustments: [],
            c_eswRestrictedProduct: '',
            c_eswReturnProhibited: '',
            c_eswReturnProhibitedMsg: '',
            custom: {
                someattribute: 'someattribute'
            }
        };
        let metaDataResponse = eswHelperHL.getProductLineMetadataItems(Basket.productLineItem);
        chai.expect(metaDataResponse).to.be.instanceOf(Array);
    });
    it('Setup Basket currecy based on pricebook currency', () => {
        session.setCurrency = function () {
            return '';
        };
        Basket.productLineItem = {
            price: '',
            basePrice: '',
            priceAfterItemDiscount: '',
            priceAfterOrderDiscount: '',
            priceAdjustments: [],
            c_eswRestrictedProduct: '',
            c_eswReturnProhibited: '',
            c_eswReturnProhibitedMsg: '',
            custom: {
                someattribute: 'someattribute'
            }
        };
        Basket.updateCurrency = function () {
            return '';
        };
        let response = eswHelperHL.setBaseCurrencyPriceBook('EUR', Basket);
        chai.expect(response).to.be.undefined;
    });
    it('Returns Shipping method ID', () => {
        let shippingServiceType = eswHelperHL.getShippingServiceType(Basket, 'IE', []);
        chai.expect(shippingServiceType).to.equals('EXP2');
    });
    it('Returns if restricted product', () => {
        let productRestricted = eswHelperHL.isProductRestricted('testproductId', 'EUR');
        chai.expect(productRestricted).to.equals(false);
    });
    it('Returns if restricted product return', () => {
        let returnProhibited = eswHelperHL.isReturnProhibited('testproductId', 'EUR');
        chai.expect(returnProhibited).to.equals(false);
    });
    it('Returns Cart shipping cost', () => {
        let eswCartShippingCost = eswHelperHL.getEswCartShippingCost(10, localizeObj, {});
        expect(eswCartShippingCost).to.have.property('value');
    });
    it('Returns Threshold Enabled', () => {
        let promotion = {
            custom: {
                eswLocalizedThresholdEnabled: true
            }
        };
        let isThresholdEnabled = eswHelperHL.isThresholdEnabled(promotion);
        expect(isThresholdEnabled).to.equals(true);
    });
    it('Returns Discount Type', () => {
        let promotion = {
            custom: {
                eswPromotionDiscountType: ''
            }
        };
        let discountType = eswHelperHL.getDiscountType(promotion);
        expect(discountType).to.equals('');
    });
});
