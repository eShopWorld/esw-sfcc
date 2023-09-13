var ArrayList = require('./dw.util.Collection');

function getCurrentBasket() {
    return {
        defaultShipment: {
            shippingAddress: {
                firstName: 'Amanda',
                lastName: 'Jones',
                address1: '65 May Lane',
                address2: '',
                city: 'Allston',
                postalCode: '02135',
                countryCode: { value: 'us' },
                phone: '617-555-1234',
                stateCode: 'MA',

                setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
                setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
                setAddress1: function (address1Input) { this.address1 = address1Input; },
                setAddress2: function (address2Input) { this.address2 = address2Input; },
                setCity: function (cityInput) { this.city = cityInput; },
                setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
                setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
                setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
                setPhone: function (phoneInput) { this.phone = phoneInput; }
            },
            shippingTotalNetPrice: {
                value: 'some value', currencyCode: 'usd'
            },
            shippingPriceAdjustments: new ArrayList([{
                UUID: 12029384756,
                calloutMsg: 'some call out message',
                basedOnCoupon: false,
                price: { value: 'some value', currencyCode: 'usd' },
                lineItemText: 'someString',
                promotion: { calloutMsg: 'some call out message' }
            }])
        },
        totalGrossPrice: {
            value: 250.00
        },
        productLineItems: new ArrayList([{
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
        }]),
        priceAdjustments: new ArrayList([]),
        getCustomerEmail: function () {
            return "test@this.getCustomerEmail.com"
        }
    };
}

module.exports = {
    getCurrentBasket: getCurrentBasket,
    currentBasket : getCurrentBasket,
    getCurrentOrNewBasket: getCurrentBasket
};
