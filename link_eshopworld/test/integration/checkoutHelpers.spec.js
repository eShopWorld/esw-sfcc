module.exports = {
    getRequest: function () {
        return {
            "retailerCartId": "fakeID",
            "eShopWorldOrderNumber": "fakeOrderNumber",
            "checkoutTotal": {
                "retailer": {
                    "currency": "USD",
                    "amount": "41.89"
                },
                "shopper": {
                    "currency": "AUD",
                    "amount": "65.75"
                }
            },
            "paymentDetails": {
                "time": "2024-02-27T17:05:40.5649661Z",
                "method": "PaymentCard",
                "methodCardBrand": "Visa"
            },
            "retailerPromoCodes": [],
            "lineItems": [
                {
                    "quantity": 1,
                    "product": {
                        "productCode": "013742003277M",
                        "hsCode": "62114900",
                        "title": "Green and Gold Clip On Earring",
                        "description": "Green and Gold Clip On Earring",
                        "productUnitPriceInfo": {
                            "price": {
                                "retailer": {
                                    "currency": "USD",
                                    "amount": "29.15"
                                },
                                "shopper": {
                                    "currency": "AUD",
                                    "amount": "45.75"
                                }
                            },
                            "discounts": []
                        },
                        "imageUrl": "fakeUrl",
                        "color": "Green",
                        "size": "",
                        "isReturnProhibited": false,
                        "metadataItems": []
                    },
                    "estimatedDeliveryDate": {
                        "fromEShopWorld": "2024-03-08T00:00:00Z"
                    },
                    "lineItemId": 1,
                    "charges": {
        "cashOnDelivery": {
              "retailer": {
                "currency": "AUD",
                "amount": "100.00"
              },
              "shopper": {
                "currency": "AUD",
                "amount": "100.00"
              }
            },
                        "subTotalBeforeTaxesAndCartDiscountsApplied": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "29.15"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "45.75"
                            }
                        },
                        "subTotalAfterCartDiscount": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "29.15"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "45.75"
                            }
                        },
                        "cartDiscountAttribution": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "0.00"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "0.00"
                            }
                        },
                        "subTotal": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "26.50"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "41.59"
                            }
                        },
                        "uplift": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "0.00"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "0.00"
                            }
                        },
                        "delivery": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "11.58"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "18.18"
                            }
                        },
                        "deliveryDuty": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "0.00"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "0.00"
                            }
                        },
                        "deliveryTaxes": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "1.16"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "1.82"
                            }
                        },
                        "taxes": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "2.65"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "4.16"
                            }
                        },
                        "otherTaxes": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "0.00"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "0.00"
                            }
                        },
                        "administration": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "0.00"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "0.00"
                            }
                        },
                        "duty": {
                            "retailer": {
                                "currency": "USD",
                                "amount": "0.00"
                            },
                            "shopper": {
                                "currency": "AUD",
                                "amount": "0.00"
                            }
                        }
                    },
                    "metadataItems": []
                }
            ],
            "deliveryCountryIso": "AU",
            "shopperCheckoutExperience": {
                "shopperCultureLanguageIso": "en-IE",
                "emailMarketingOptIn": true,
                "saveAddressForNextPurchase": true,
                "metadataItems": [],
                "smsMarketingOptIn": true
            },
            "deliveryOption": {
                "deliveryOption": "POST",
                "isPriceOverrideFromRetailer": false,
                "deliveryOptionPriceInfo": {
                    "price": {
                        "retailer": {
                            "currency": "USD",
                            "amount": "12.74"
                        },
                        "shopper": {
                            "currency": "AUD",
                            "amount": "20.00"
                        }
                    },
                    "discounts": []
                },
                "metadataItems": []
            },
            "charges": {
        "cashOnDelivery": {
              "retailer": {
                "currency": "AUD",
                "amount": "100.00"
              },
              "shopper": {
                "currency": "AUD",
                "amount": "100.00"
              }
            },
                "totalBeforeTaxesAndCartDiscountsApplied": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "29.15"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "45.75"
                    }
                },
                "totalAfterCartDiscount": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "29.15"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "45.75"
                    }
                },
                "totalCartDiscount": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "0.00"
                    }
                },
                "total": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "26.50"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "41.59"
                    }
                },
                "delivery": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "11.58"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "18.18"
                    }
                },
                "deliveryDuty": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "0.00"
                    }
                },
                "deliveryTaxes": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "1.16"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "1.82"
                    }
                },
                "taxes": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "2.65"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "4.16"
                    }
                },
                "otherTaxes": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "0.00"
                    }
                },
                "administration": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "0.00"
                    }
                },
                "duty": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "0.00"
                    }
                },
                "uplift": {
                    "retailer": {
                        "currency": "USD",
                        "amount": "0.00"
                    },
                    "shopper": {
                        "currency": "AUD",
                        "amount": "0.00"
                    }
                }
            },
            "contactDetails": [
                {
                    "contactDetailType": "fake",
                    "contactDetailsNickName": "",
                    "firstName": "Muhammad",
                    "lastName": "Akram",
                    "gender": "None",
                    "address1": "fake address",
                    "address2": "",
                    "city": "Lahore",
                    "postalCode": "5000",
                    "region": "SA",
                    "country": "AU",
                    "email": "fake@eshopworld.com",
                    "telephone": "fake",
                    "metadataItems": []
                },
                {
                    "contactDetailType": "IsPayment",
                    "contactDetailsNickName": "",
                    "firstName": "Muhammad",
                    "lastName": "Akram",
                    "gender": "None",
                    "address1": "fake address",
                    "address2": "",
                    "city": "Lahore",
                    "postalCode": "5000",
                    "region": "SA",
                    "country": "AU",
                    "email": "fake@eshopworld.com",
                    "telephone": "+61412389728",
                    "metadataItems": []
                }
            ]
        };
    }
}