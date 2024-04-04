var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var expect = chai.expect;
var sinon = require('sinon');


var Money = require('../../../../mocks/dw.value.Money');
var ArrayList = require('../../../../mocks/dw.util.Collection');
var collections = require('../../../../mocks/dw.util.Collection');
var basketMgr = require('../../../../mocks/BasketMgr');
var empty = require('../../../../mocks/dw.global.empty');
global.empty = empty(global);


var stubTransaction = sinon.stub();
var stubCookie = sinon.stub();
var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();
var toProductMock = require('../../../../mocks/utilHelpers');

function createShipmentShippingModel() {
    return {
        applicableShippingMethods: [
            {
                description: 'Order received within 7-10 business days',
                displayName: 'Ground',
                ID: '001',
                custom: {
                    estimatedArrivalTime: '7-10 Business Days'
                }
            },
            {
                description: 'Order received in 2 business days',
                displayName: '2-Day Express',
                ID: '002',
                shippingCost: '$0.00',
                custom: {
                    estimatedArrivalTime: '2 Business Days'
                }
            }
        ],
        getApplicableShippingMethods: function () {
            return [
                {
                    description: 'Order received within 7-10 business days',
                    displayName: 'Ground',
                    ID: '001',
                    custom: {
                        estimatedArrivalTime: '7-10 Business Days'
                    }
                },
                {
                    description: 'Order received in 2 business days',
                    displayName: '2-Day Express',
                    ID: '002',
                    shippingCost: '$0.00',
                    custom: {
                        estimatedArrivalTime: '2 Business Days'
                    }
                }
            ];
        },
        getShippingCost: function () {
            return {
                amount: {
                    valueOrNull: 7.99
                }
            };
        }
    };
}

var productLineItems1 = new ArrayList([{
    product: {
        online: true,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {},
    productID: 'someID',
    quantityValue: 2
}]);

var session = {
    getCurrency: function () {
        return 'USD';
    },
    privacy: {
        fxRate: ''
    }
};

global.session = session;
global.customer = {
    profile: null
};

var productVariantMock = {
    ID: '1234567',
    name: 'test product',
    variant: true,
    availabilityModel: {
        isOrderable: {
            return: true,
            type: 'function'
        },
        inventoryRecord: {
            ATS: {
                value: 100
            }
        }
    },
    minOrderQuantity: {
        value: 2
    }
};

var productMock = {
    variationModel: {
        productVariationAttributes: new ArrayList([{
            attributeID: '',
            value: ''
        }]),
        selectedVariant: productVariantMock
    }
};

let OverrideShipping = JSON.stringify([
    {
        countryCode: 'GB',
        shippingMethod: {
            ID: ['POST_GB', 'EXP2_GB']
        }
    },
    {
        countryCode: 'CA',
        shippingMethod: {
            ID: ['POST_CA', 'EXP2_CA']
        }
    },
    {
        countryCode: 'SE',
        shippingMethod: {
            ID: ['POST_CA', 'EXP2_CA']
        }
    }
]);


var createApiBasket = function (options) {
    var safeOptions = options || {};

    var basket = {
        allProductLineItems: new ArrayList([{
            bonusProductLineItem: false,
            gift: false,
            UUID: 'some UUID',
            adjustedPrice: {
                value: 'some value',
                currencyCode: 'USD'
            },
            quantity: {
                value: 1
            },
            product: toProductMock(productMock)
        }]),
        productLineItems: productLineItems1,
        totalGrossPrice: new Money(true),
        totalTax: new Money(true),
        shippingTotalPrice: new Money(true)
    };


    if (safeOptions.shipping) {
        basket.shipments = [safeOptions.shipping];
    } else {
        basket.shipments = [{
            shippingMethod: {
                ID: '005'
            }
        }];
    }
    basket.defaultShipment = basket.shipments[0];

    basket.getShipments = function () {
        return basket.shipments;
    };
    basket.getAdjustedMerchandizeTotalPrice = function () {
        return new Money(true);
    };

    if (safeOptions.productLineItems) {
        basket.productLineItems = safeOptions.productLineItems;
    }

    if (safeOptions.totals) {
        basket.totals = safeOptions.totals;
    }

    return basket;
};
var rememberMeCookie = { dwloginId: 'rahul.naik@ralphlauren.com' };

describe('int_eshopworld_core/cartridge/scripts/helper/serviceHelper.js', function () {
    global.request = {
        getHttpCookies: function () {
            return rememberMeCookie;
        }
    };
    var preparePreOrder = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/serviceHelper', {
        '*/cartridge/scripts/helper/eswCoreHelper': {
            getEswHelper: {
                getMoneyObject: function () {
                    return Money();
                },
                getEnableInventoryCheck: function () {
                    return false;
                },
                isEswRoundingsEnabled: function () {
                    return 'true';
                },
                applyRoundingModel: function () {
                    return 'price';
                },
                getCheckoutServiceName: function () {
                    return 'some service';
                },
                getOrderDiscount: function () {
                    return '$10';
                },
                getSubtotalObject: function () {
                    return Money();
                },
                getMappedCustomerMetadata: function () {
                    return 'eswMarketingOptIn|eswMarketingOptIn';
                },
                getUrlExpansionPairs: function () {
                    return 'EXPENSAIN PAIRS';
                },
                getMetadataItems: function () {
                    return 'some  items meta';
                },
                getSelectedInstance: function () {
                    return 'some  selected instance';
                },
                getMappedBasketMetadata: function () {
                    return 'some  site meta';
                },
                isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled: function () {
                    return 'false';
                },
                getOverrideShipping: function () {
                    return '';
                },
                getAvailableCountry: function () {
                    return 'some country';
                }
            }
        },
        getCartItemsV2: function () {
            return null;
        },
        '*/cartridge/scripts/helper/eswPricingHelper': {
            getConversionPreference: function () {
                return null;
            }
        },
        '*/cartridge/scripts/helper/eswHelperHL': '',
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
        'dw/web/URLAction': function () {
            return 'some url';
        },
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': {
            https: function () {
                return {};
            }
        },
        'dw/order/ShippingMgr': {
            getDefaultShippingMethod: function () {
                return defaultShippingMethod;
            },
            getShipmentShippingModel: function (shipment) {
                return createShipmentShippingModel(shipment);
            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return {};
                        }
                        return 'true';
                    }
                };
            }
        },
        'dw/util/Currency': {
            getCurrency: function () {
                return 'currency';
            }
        },
        'dw/util/StringUtils': {
            formatMoney: function () {
                return 'formatted money';
            }
        },
        '*/cartridge/scripts/util/collections': {
            forEach: function () {
                return collections.forEach;
            }
        },
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/helper/serviceHelperV3': ''
    });
    describe('Happy path', function () {
        it('Should prepare pre order payload', function () {
            let basket = createApiBasket();
            let prderPayload = preparePreOrder.preparePreOrder(null, basket);
            expect(prderPayload).to.have.property('contactDetails');
        });
        it('it Should have checkout experience', function () {
            let basket = createApiBasket();
            let prderPayload = preparePreOrder.preparePreOrder(null, basket);
            expect(prderPayload).to.have.property('shopperCheckoutExperience');
        });
    });
    describe('Sad Path', function () {
        it('Should throw error', function () {
            let basket;
            let prderPayload = preparePreOrder.preparePreOrder(basket);
            expect(prderPayload).to.throw;
        });
    });
});
