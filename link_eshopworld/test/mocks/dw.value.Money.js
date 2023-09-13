'use strict';

function Money(isAvailable, currency) {
    return {
        available: isAvailable,
        value: '10.99',
        getDecimalValue: function () { return '10.99'; },
        getCurrencyCode: function () { return currency; },
        subtract: function () { return new Money(isAvailable); }
    };
}

module.exports = Money;
