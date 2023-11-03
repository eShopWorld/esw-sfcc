/* eslint-disable indent */
var chai = require('chai');
var proxyquire = require('proxyquire').noCallThru();
var ArrayList = require('../../../../mocks/dw.util.Collection');
var expect = chai.expect;
var sinon = require('sinon');

var basketMgr = require('../../../../mocks/BasketMgr');
var CustomObjectMgr = require('../../../../mocks/dw/object/CustomObjectMgr');
var collections = require('../../../../mocks/dw.util.CollectionHelper');
var Currency = require('../../../../mocks/dw/util/Currency');
var StringUtils = require('../../../../mocks/dw/util/StringUtils');
var Money = require('../../../../mocks/dw.value.Money');
var Logger = require('../../../../mocks/dw/system/Logger');
var Cookie = require('../../../../mocks/dw/web/Cookie');
var Transaction = require('../../../../mocks/dw/system/Transaction');
var cart = basketMgr.getCurrentBasket();
cart.custom = {
    eswShopperCurrencyDeliveryTaxes: ''
}
var fakeOrderObject = {
    "retailerCartId": "fake",
    "eShopWorldOrderNumber": "e26db11f",
    "checkoutTotal": {
        "retailer": {
            "currency": "USD",
            "amount": "105.50"
        },
        "shopper": {
            "currency": "EUR",
            "amount": "101.11"
        }
    },
    "paymentDetails": {
        "time": "2023-09-11T11:29:43.1766625Z",
        "method": "PaymentCard",
        "methodCardBrand": "Visa"
    },
    "retailerPromoCodes": [],
    "lineItems": [
        {
            "quantity": 1,
            "product": {
                "productCode": "701642984986M",
                "hsCode": "62114900",
                "title": "Classic Narrow Leg Pant",
                "description": "Classic Narrow Leg Pant",
                "productUnitPriceInfo": {
                    "price": {
                        "retailer": {
                            "currency": "USD",
                            "amount": "70.66"
                        },
                        "shopper": {
                            "currency": "EUR",
                            "amount": "67.72"
                        }
                    },
                    "discounts": []
                },
                "imageUrl": "fdfs",
                "color": "Black Multi",
                "size": "8",
                "isReturnProhibited": false,
                "metadataItems": []
            },
            "estimatedDeliveryDate": {
                "fromEShopWorld": "2023-09-26T00:00:00Z"
            },
            "lineItemId": 1,
            "charges": {
                "subTotalBeforeTaxesAndCartDiscountsApplied": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "70.66"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "67.72"
                    }
                },
                "subTotalAfterCartDiscount": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "70.66"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "67.72"
                    }
                },
                "cartDiscountAttribution": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "0.00"
                    }
                },
                "subTotal": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "57.45"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "55.06"
                    }
                },
                "uplift": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "0.00"
                    }
                },
                "delivery": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "28.33"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "27.15"
                    }
                },
                "deliveryDuty": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "0.00"
                    }
                },
                "deliveryTaxes": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "6.51"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "6.24"
                    }
                },
                "taxes": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "13.21"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "12.66"
                    }
                },
                "otherTaxes": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "0.00"
                    }
                },
                "administration": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "0.00"
                    }
                },
                "duty": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "EUR",
                        "amount": "0.00"
                    }
                }
            },
            "metadataItems": []
        }
    ],
    "deliveryCountryIso": "IE",
    "shopperCheckoutExperience": {
        "shopperCultureLanguageIso": "en-IE",
        "emailMarketingOptIn": true,
        "smsMarketingOptIn": true,
        "metadataItems": []
    },
    "retailerCheckoutExperience": {
        "metadataItems": [
            {
                "name": "OrderConfirmationUri_TestOnly",
                "value": "fdsf"
            },
            {
                "name": "OrderConfirmationBase64EncodedAuth_TestOnly",
                "value": "1 parameters"
            },
            {
                "name": "InventoryCheckUri_TestOnly",
                "value": "fdsd"
            },
            {
                "name": "InventoryCheckBase64EncodedAuth_TestOnly",
                "value": "1 parameters"
            }
        ]
    },
    "deliveryOption": {
        "deliveryOption": "POST",
        "isPriceOverrideFromRetailer": true,
        "deliveryOptionPriceInfo": {
            "price": {
                "retailer": {
                    "currency": "USD",
                    "amount": "34.84"
                },
                "shopper": {
                    "currency": "EUR",
                    "amount": "33.39"
                }
            },
            "discounts": []
        },
        "metadataItems": []
    },
    "charges": {
        "totalBeforeTaxesAndCartDiscountsApplied": {
            "retailer": {
                "currency": "USD",
                "amount": "70.66"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "67.72"
            }
        },
        "totalAfterCartDiscount": {
            "retailer": {
                "currency": "USD",
                "amount": "70.66"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "67.72"
            }
        },
        "totalCartDiscount": {
            "retailer": {
                "currency": "USD",
                "amount": "0.00"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "0.00"
            }
        },
        "total": {
            "retailer": {
                "currency": "USD",
                "amount": "57.45"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "55.06"
            }
        },
        "delivery": {
            "retailer": {
                "currency": "USD",
                "amount": "28.33"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "27.15"
            }
        },
        "deliveryDuty": {
            "retailer": {
                "currency": "USD",
                "amount": "0.00"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "0.00"
            }
        },
        "deliveryTaxes": {
            "retailer": {
                "currency": "USD",
                "amount": "6.51"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "6.24"
            }
        },
        "taxes": {
            "retailer": {
                "currency": "USD",
                "amount": "13.21"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "12.66"
            }
        },
        "otherTaxes": {
            "retailer": {
                "currency": "USD",
                "amount": "0.00"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "0.00"
            }
        },
        "administration": {
            "retailer": {
                "currency": "USD",
                "amount": "0.00"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "0.00"
            }
        },
        "duty": {
            "retailer": {
                "currency": "USD",
                "amount": "0.00"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "0.00"
            }
        },
        "uplift": {
            "retailer": {
                "currency": "USD",
                "amount": "0.00"
            },
            "shopper": {
                "currency": "EUR",
                "amount": "0.00"
            }
        }
    },
    "contactDetails": [
        {
            "contactDetailType": "IsDelivery",
            "contactDetailsNickName": "",
            "firstName": "sd",
            "lastName": "test",
            "gender": "None",
            "address1": "436M M block Model",
            "address2": "",
            "city": "Lahore",
            "postalCode": "A65 F4E2",
            "region": "Dublin",
            "country": "IE",
            "email": "test@gmail.com",
            "telephone": "+3538576437634",
            "metadataItems": []
        },
        {
            "contactDetailType": "IsPayment",
            "contactDetailsNickName": "",
            "firstName": "sd",
            "lastName": "test",
            "gender": "None",
            "address1": "436M M block Model",
            "address2": "",
            "city": "Lahore",
            "postalCode": "A65 F4E2",
            "region": "Dublin",
            "country": "IE",
            "email": "test@gmail.com",
            "telephone": "+3538576437634",
            "metadataItems": []
        }
    ]
};
cart.priceAdjustments = new ArrayList([{
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
                            priceValue: {},
                            productID: 'someID',
                            quantityValue: 2,
                            custom: { thresholdDiscountType: 'fake type' }
                        }]);

cart.defaultShipment.shippingPriceAdjustments = new ArrayList([{
    basedOnCoupon: true
}]);
cart.getPriceAdjustments = function () {
    return new ArrayList([{
        basedOnCampaign: true,
        promotion: {
            enabled: true
        },
        campaign: {
            enabled: true
        }
    }]);
};
cart.getAllProductLineItems = function () {
    return new ArrayList([{
        getPriceAdjustments: function () {
            return new ArrayList([{
                basedOnCampaign: false,
                promotion: {
                    enabled: false
                },
                campaign: {
                    enabled: false
                }
            }]);
        },
        basedOnCampaign: true,
        promotion: {
            enabled: false
        },
        campaign: {
            enabled: false
        }
    }]);
};

var stubArrayList = sinon.stub();
var stubURLUtils = sinon.stub();

describe('int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper.js', function () {
    var getEswOcHelper = proxyquire('../../../../../cartridges/int_eshopworld_core/cartridge/scripts/helper/orderConfirmationHelper', {
        'dw/system/Logger':  Logger,
        'dw/web/Cookie': Cookie,
        'dw/system/Transaction': Transaction,
        'dw/util/ArrayList': stubArrayList,
        'dw/web/URLUtils': stubURLUtils,
        'dw/value/Money': Money,
        '*/cartridge/scripts/helper/eswHelper': {
            getEswHelper: function () {
                return {
                    overridePrice: function () {
                        return false;
                    },
                    setAllAvailablePriceBooks: function () {},
                    setBaseCurrencyPriceBook: function () {}
                }
            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function (value) {
                        if (value == 'eswBaseCurrency') {
                            return 'some value';
                        } else {
                            return 'true';
                        }
                    }
                };
            }
        },
        '*/cartridge/scripts/models/CartModel': {
            get: function () {
                return;
            }
        },
        'dw/util/Currency': Currency,
        'dw/util/StringUtils': StringUtils,
        '*/cartridge/scripts/util/collections': collections,
        'dw/customer/CustomerMgr': {
            getCustomerByLogin: function () {
                return;
            }
        },
        'dw/object/CustomObjectMgr': CustomObjectMgr,
        'dw/order/BasketMgr': basketMgr,
        '*/cartridge/scripts/helper/eswCalculationHelper': {
            getEswCalculationHelper: {
                getSubtotalObject: function () {
                    return Money(true, request.httpCookies['esw.currency'].value);
                },
                getMoneyObject: function () {
                    return Money
                }
            }
        },
        '*/cartridge/scripts/helper/serviceHelper': {
            applyShippingMethod: function () {
                return null;
            }
        }
    }).getEswOcHelper();
    describe('Happy path', function () {
        it("it Should set override pricebook", function () {
            let getFinalOrderTotalsObject = getEswOcHelper.setOverridePriceBooks('CAD', 'USD', {});
            expect(getFinalOrderTotalsObject).to.equal(undefined);
        });
    });
    describe('Happy path', function () {
        it("it Should set applicable shipping method", function () {
            let getFinalOrderTotalsObject = getEswOcHelper.setApplicableShippingMethods(cart, 'POST', 'CAD', global.request);
            expect(getFinalOrderTotalsObject).to.equal(undefined);
        });
    });
    describe('Happy path', function () {
        it("it Should update order attributes", function () {
            let getUpdatedEswOrderAttributesV3 = getEswOcHelper.updateEswOrderAttributesV3(fakeOrderObject, cart);
            expect(getUpdatedEswOrderAttributesV3).to.equal(undefined);
        });
    });
});