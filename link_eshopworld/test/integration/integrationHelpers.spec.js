var sfraUrlPaths = require('./paths.spec');
var config = require('./it.config.spec');

module.exports = {
    getUrl: function (path) {
        var urlPathAtIndex = (path.split("|") > 1) && config.isSeoPath ? 1 : 0;
        return sfraUrlPaths.SFRA.pathPrefix.split('|')[urlPathAtIndex].trim() + '/' + path.split("|")[urlPathAtIndex].trim();
    },
    getRequest: function () {
        return {
            "brandOrderReference": "fake-refrence",
            "weight": {
                "weightTotal": 0,
                "weightUnit": "KG"
            },
            "custom": {
                "parentBrandOrderReference": "fake-refrence",
            },
            "orderType": "Offline",
            "parentBrandOrderReference": "09-09447-9325T",
            "transactionReference": "fake-refrence",
            "transactionDateTime": "2023-01-19T07:51:38.055Z",
            "actionedBy": "Retailer",
            "actionedByUser": "",
            "shopperCurrencyIso": "GBP",
            "retailerCurrencyIso": "GBP",
            "deliveryCountryIso": "GB",
            "shopperExperience": {
                "shopperCultureLanguageIso": "en-IE",
                "registeredProfileId": "xyz"
            },
            "contactDetails": [{
                    "contactDetailsType": "IsPayment",
                    "nickName": "",
                    "addressId": "",
                    "firstName": "Nag",
                    "lastName": "Bagi",
                    "address1": "3056 Hastings Way",
                    "address2": "",
                    "address3": "",
                    "city": "San Ramon",
                    "postalCode": "94582-2505",
                    "region": "Re",
                    "country": "GB",
                    "email": "xyz@members.com",
                    "telephone": "3108951518",
                    "gender": "",
                    "poBox": ""
                },
                {
                    "contactDetailsType": "IsDelivery",
                    "nickName": "",
                    "addressId": "",
                    "firstName": "Nag",
                    "lastName": "Bagi",
                    "address1": "3056 Hastings Way",
                    "address2": "",
                    "address3": "",
                    "city": "San Ramon",
                    "postalCode": "94582-2505",
                    "region": "Re",
                    "country": "GB",
                    "email": "xyz@members.com",
                    "telephone": "3108951518",
                    "gender": "",
                    "poBox": ""
                }
            ],
            "lineItems": [{
                "quantity": 1,
                "estimatedDeliveryDateFromRetailer": "2023-01-19T07:51:38.055Z",
                "lineItemId": 1,
                "product": {
                    "productCode": "013742002836M",
                    "title": "Turquoise and Gold Bracelet",
                    "description": "Turquoise and Gold Bracelet",
                    "productUnitPriceInfo": {
                        "price": {
                            "currency": "EUR",
                            "amount": "39.0"
                        }
                    },
                    "customsDescription": "",
                    "hsCode": "",
                    "countryOfOriginIso": "",
                    "imageUrl": "",
                    "color": "Gold",
                    "size": "",
                    "metadataItems": {},
                    "isReturnProhibited": true
                }
            }],
            "deliveryOption": {
                "eshopDeliveryOptionCode": "POST",
                "estimatedDeliveryDateToShopper": "2023-01-19T07:51:38.055Z",
                "priceInfo": {
                    "price": {
                        "currency": "EUR",
                        "amount": "0"
                    }
                }
            },
            "retailerInvoice": {
                "number": "",
                "date": ""
            },
            "payment": {
                "method": "CreditCard",
                "last4Digits": "",
                "paymentAttemptRef": ""
            },
            "originDetails": {
                "originType": "Store",
                "nickName": "",
                "addressId": "",
                "firstName": "Nag",
                "lastName": "Bagi",
                "address1": "3056 Hastings Way",
                "address2": "",
                "address3": "",
                "city": "San Ramon",
                "postalCode": "94582-2505",
                "region": "Re",
                "country": "GB",
                "email": "xyz@members.com",
                "telephone": "3108951518",
                "gender": "",
                "poBox": ""
            },
            "metadataItems": [{
                "name": "PaymentMethod",
                "value": "109X"
            }]
        };
    }
}