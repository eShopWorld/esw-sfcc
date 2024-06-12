/* eslint-disable no-param-reassign */
/**
* Helper script for order confirmation back into SFCC from ESW Checkout
**/
const Constants = require('*/cartridge/scripts/util/Constants');
const Site = require('dw/system/Site').getCurrent();
const CustomerMgr = require('dw/customer/CustomerMgr');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');

const Money = require('dw/value/Money');
const PaymentMgr = require('dw/order/PaymentMgr');

/* Script Modules */
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const collections = require('*/cartridge/scripts/util/collections');

const getEswOcHelper = {
    /**
    * Set override price books if applicable
    * @param {string} deliveryCountry - Delivery Country ISO
    * @param {string} shopperCurrency - Shopper Currency ISO
    * @param {Object} req - Request object
    */
    setOverridePriceBooks: function (deliveryCountry, shopperCurrency, req) {
        if (req && !eswHelper.overridePriceCore(req, deliveryCountry, shopperCurrency)) {
            eswHelper.setAllAvailablePriceBooks();
            eswHelper.setBaseCurrencyPriceBook(req, shopperCurrency);
        } else if (!req && !eswHelper.overridePriceCore(deliveryCountry)) {
            eswHelper.setAllAvailablePriceBooks();
            eswHelper.setBaseCurrencyPriceBook(shopperCurrency);
        }
    },
    /**
    * Set applicable shipping methods
    * @param {Object} order - SFCC order object
    * @param {string} deliveryOption - Delivery Options POST/EXP2
    * @param {string} deliveryCountry - Delivery Country ISO
    * @param {Object} req - Request object
    * @param {string} currentMethodID - Current Shipping Method ID
    */
    setApplicableShippingMethods: function (order, deliveryOption, deliveryCountry, req, currentMethodID) {
        let eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
        let appliedShipping = eswServiceHelper.applyShippingMethod(order, deliveryOption, deliveryCountry, false, currentMethodID);
        if (appliedShipping == null) {
            if (req) {
                eswHelper.setBaseCurrencyPriceBook(req, Site.defaultCurrency);
            } else {
                eswHelper.setBaseCurrencyPriceBook(Site.defaultCurrency);
            }
            appliedShipping = eswServiceHelper.applyShippingMethod(order, deliveryOption, deliveryCountry, false, currentMethodID);
        }
    },
    /**
    * get Item Discounts in shopper or retailer currency
    * @param {Object} deliveryOptions - Delivery options
    * @param {string} currency - string for currency
    * @returns {obj}  - Discounts
    */
    getDeliveryDiscountsInfo: function (deliveryOptions, currency) {
        if (empty(deliveryOptions)) {
            return [];
        }
        let obj = {},
            refined = [];
        if (deliveryOptions.deliveryOptionPriceInfo.discounts.length > 0) {
            obj.deliveryOption = deliveryOptions.deliveryOption;
            obj.deliveryOptionsPriceInfo = {
                discounts: []
            };
            for (let i = 0; i < deliveryOptions.deliveryOptionPriceInfo.discounts.length; i++) {
                if (typeof obj.deliveryOptionsPriceInfo.discounts[i] === 'undefined') {
                    obj.deliveryOptionsPriceInfo.discounts[i] = [];
                }
                if (currency === 'shopper') {
                    obj.deliveryOptionsPriceInfo.discounts[i].push({
                        title: deliveryOptions.deliveryOptionPriceInfo.discounts[i].title,
                        description: deliveryOptions.deliveryOptionPriceInfo.discounts[i].description,
                        discount: {
                            shopper: deliveryOptions.deliveryOptionPriceInfo.discounts[i].discount.shopper
                        },
                        beforeDiscount: {
                            shopper: deliveryOptions.deliveryOptionPriceInfo.discounts[i].beforeDiscount.shopper
                        }
                    });
                } else if (currency === 'retailer') {
                    obj.deliveryOptionsPriceInfo.discounts[i].push({
                        title: deliveryOptions.deliveryOptionPriceInfo.discounts[i].title,
                        description: deliveryOptions.deliveryOptionPriceInfo.discounts[i].description,
                        discount: {
                            retailer: deliveryOptions.deliveryOptionPriceInfo.discounts[i].discount.retailer
                        },
                        beforeDiscount: {
                            retailer: deliveryOptions.deliveryOptionPriceInfo.discounts[i].beforeDiscount.retailer
                        }
                    });
                }
                refined[i] = obj;
            }
        }
        return refined;
    },
    /**
    * get Item Discounts in shopper or retailer currency
    * @param {Object} discounts - Item Discounts
    * @param {string} currency - string for currency
    * @param {string} DiscountType - type of discount
    * @returns {obj}  - Discounts
    */
    getItemDiscountsInfo: function (discounts, currency, DiscountType) {
        if (empty(discounts)) {
            return [];
        }
        let refined = [],
            obj = {};
        if (discounts.length > 0) {
            let j = 0;
            for (let i = 0; i < discounts.length; i++) {
                if ((DiscountType === 'ProductLevelDiscount') || (DiscountType === 'OrderLevelDiscount')) {
                    if (currency === 'retailer') {
                        obj.title = discounts[i].title;
                        obj.description = discounts[i].description;
                        obj.discount = {};
                        obj.discount.retailer = discounts[i].discount.retailer;
                        obj.beforeDiscount = {};
                        obj.beforeDiscount.retailer = discounts[i].beforeDiscount.retailer;
                    } else if (currency === 'shopper') {
                        obj.title = discounts[i].title;
                        obj.description = discounts[i].description;
                        obj.discount = {};
                        obj.discount.shopper = discounts[i].discount.shopper;
                        obj.beforeDiscount = {};
                        obj.beforeDiscount.shopper = discounts[i].beforeDiscount.shopper;
                    }
                    refined[j] = obj;
                    j++;
                    obj = {};
                }
            }
        }
        return refined;
    },
    /**
    * Update ESW Order level custom attibutes for OC V3
    * @param {Object} obj - ESW OC response object
    * @param {Object} order - SFCC order object
    */
    updateEswOrderAttributesV3: function (obj, order) {
        order.custom.eswShopperCurrencyDeliveryTaxes = Number(obj.charges.deliveryTaxes.shopper.amount);
        order.custom.eswRetailerCurrencyDeliveryTaxes = Number(obj.charges.deliveryTaxes.retailer.amount);
        order.custom.eswShopperCurrencyDeliveryDuty = Number(obj.charges.deliveryDuty.shopper.amount);
        order.custom.eswRetailerCurrencyDeliveryDuty = Number(obj.charges.deliveryDuty.retailer.amount);
        order.custom.eswShopperCurrencyDuty = Number(obj.charges.duty.shopper.amount);
        order.custom.eswRetailerCurrencyDuty = Number(obj.charges.duty.retailer.amount);
        order.custom.eswShopperCurrencyDelivery = Number(obj.charges.delivery.shopper.amount);
        order.custom.eswRetailerCurrencyDelivery = Number(obj.charges.delivery.retailer.amount);
        order.custom.eswShopperCurrencyTaxes = Number(obj.charges.taxes.shopper.amount);
        order.custom.eswRetailerCurrencyTaxes = Number(obj.charges.taxes.retailer.amount);
        order.custom.eswShopperCurrencyOtherTaxes = Number(obj.charges.otherTaxes.shopper.amount);
        order.custom.eswRetailerCurrencyOtherTaxes = Number(obj.charges.otherTaxes.retailer.amount);
        order.custom.eswShopperCurrencyAdministration = Number(obj.charges.administration.shopper.amount);
        order.custom.eswRetailerCurrencyAdministration = Number(obj.charges.administration.retailer.amount);
        order.custom.eswShopperCurrencyUplift = Number(obj.charges.uplift.shopper.amount);
        order.custom.eswRetailerCurrencyUplift = Number(obj.charges.uplift.retailer.amount);
        order.custom.eswRetailerCurrencyCode = obj.checkoutTotal.retailer.currency;
        order.custom.eswShopperCurrencyCode = obj.checkoutTotal.shopper.currency;
        order.custom.eswOrderNo = obj.eShopWorldOrderNumber;
        order.custom.eswShopperCurrencyTotal = Number(obj.charges.total.shopper.amount);
        order.custom.eswRetailerCurrencyTotal = Number(obj.charges.total.retailer.amount);
        order.custom.eswShopperCurrencyPaymentAmount = Number(obj.checkoutTotal.shopper.amount);
        order.custom.eswRetailerCurrencyPaymentAmount = Number(obj.checkoutTotal.retailer.amount);
        order.custom.eswEmailMarketingOptIn = obj.shopperCheckoutExperience.emailMarketingOptIn;
        order.custom.eswDeliveryOption = obj.deliveryOption.deliveryOption;
        order.custom.eswSMSMarketingOptIn = !empty(obj.shopperCheckoutExperience.smsMarketingOptIn) ? obj.shopperCheckoutExperience.smsMarketingOptIn : false;

        let shoppercurrencyAmount = Number(obj.checkoutTotal.shopper.amount);
        let retailercurrencyAmount = Number(obj.checkoutTotal.retailer.amount);

        order.custom.eswFxrateOc = (shoppercurrencyAmount / retailercurrencyAmount).toFixed(Constants.DECIMAL_LENGTH);
        order.custom.eswRetailerCurrencyTotalOrderDiscount = order.custom.eswShopperCurrencyTotalOrderDiscount / order.custom.eswFxrateOc;
        order.custom.eswShopperCurrencyDeliveryPriceInfo = Number(obj.deliveryOption.deliveryOptionPriceInfo.price.shopper.amount);
        order.custom.eswRetailerCurrencyDeliveryPriceInfo = Number(obj.deliveryOption.deliveryOptionPriceInfo.price.retailer.amount);

        order.custom.eswPaymentMethod = (obj.paymentDetails && obj.paymentDetails != null) ? obj.paymentDetails.method : null;
        order.custom.eswFraudHold = (obj.fraudHold && obj.fraudHold != null) ? obj.fraudHold : null;

        let eswRetailerCurrencyDeliveryDiscountsInfo = this.getDeliveryDiscountsInfo(obj.deliveryOption, 'retailer');
        let eswShopperCurrencyDeliveryDiscountsInfo = this.getDeliveryDiscountsInfo(obj.deliveryOption, 'shopper');
        let orderCashOnDeliveryObj = (!empty(obj.charges) && !empty(obj.charges.cashOnDelivery)) ? obj.charges.cashOnDelivery : '';
        if (!empty(orderCashOnDeliveryObj)) {
            order.custom.eswRetailerCashOnDeliveryFee = Number(orderCashOnDeliveryObj.retailer.amount);
            order.custom.eswRetailerCashOnDeliveryFeeCurrency = orderCashOnDeliveryObj.retailer.currency;
            order.custom.eswShopperCashOnDeliveryFee = Number(orderCashOnDeliveryObj.shopper.amount);
            order.custom.eswShopperCashOnDeliveryFeeCurrency = orderCashOnDeliveryObj.shopper.currency;
        }
        let orderCashOnDeliveryTaxesObj = (!empty(obj.charges) && !empty(obj.charges.cashOnDeliveryTaxes)) ? obj.charges.cashOnDeliveryTaxes : '';
        if (!empty(orderCashOnDeliveryTaxesObj)) {
            order.custom.eswRetailerCashOnDeliveryTaxFee = Number(orderCashOnDeliveryTaxesObj.retailer.amount);
            order.custom.eswRetailerCashOnDeliveryTaxFeeCurrency = orderCashOnDeliveryTaxesObj.retailer.currency;
            order.custom.eswShopperCashOnDeliveryTaxFee = Number(orderCashOnDeliveryTaxesObj.shopper.amount);
            order.custom.eswShopperCashOnDeliveryTaxFeeCurrency = orderCashOnDeliveryTaxesObj.shopper.currency;
        }

        order.custom.eswRetailerCurrencyDeliveryDiscountsInfo = !empty(eswRetailerCurrencyDeliveryDiscountsInfo) ? JSON.stringify(eswRetailerCurrencyDeliveryDiscountsInfo) : '';
        order.custom.eswShopperCurrencyDeliveryDiscountsInfo = !empty(eswShopperCurrencyDeliveryDiscountsInfo) ? JSON.stringify(eswShopperCurrencyDeliveryDiscountsInfo) : '';

        let CountryCO = CustomObjectMgr.getCustomObject('ESW_COUNTRIES', obj.deliveryCountryIso);
        if (!empty(CountryCO) && !empty(CountryCO.custom.hubAddress)) {
            order.custom.eswHubAddress = CountryCO.custom.hubAddress;
            order.custom.eswHubState = CountryCO.custom.hubAddressState;
            order.custom.eswHubCity = CountryCO.custom.hubAddressCity;
            order.custom.eswHubPostalCode = CountryCO.custom.hubAddressPostalCode;
        }

        if (!empty(order.customer) && !empty(order.customer.profile)) {
            order.customer.profile.custom.eswMarketingOptIn = obj.shopperCheckoutExperience.emailMarketingOptIn;
            if (!empty(obj.shopperCheckoutExperience.smsMarketingOptIn)) {
                order.customer.profile.custom.eswSMSMarketingOptIn = obj.shopperCheckoutExperience.smsMarketingOptIn;
            }
        } else {
            let existedCustomer = CustomerMgr.getCustomerByLogin(!empty(obj.contactDetails[0].email) ? obj.contactDetails[0].email : obj.contactDetails[1].email);
            if (!empty(existedCustomer) && obj.shopperCheckoutExperience.emailMarketingOptIn === true) {
                existedCustomer.profile.custom.eswMarketingOptIn = obj.shopperCheckoutExperience.emailMarketingOptIn;
            }
            if (!empty(existedCustomer) && obj.shopperCheckoutExperience.smsMarketingOptIn === true) {
                existedCustomer.profile.custom.eswSMSMarketingOptIn = obj.shopperCheckoutExperience.smsMarketingOptIn;
            }
        }
    },
    /**
    * Update ESW Order Item level custom attibutes for OC V3
    * @param {Object} obj - ESW OC response object
    * @param {Object} lineItem - SFCC Product Line Item object
    * @param {Object} cartItem - Found cart object from OC response
    * @returns {Object} orderDiscountsObj - Order level Discounts
    */
    updateEswOrderItemAttributesV3: function (obj, lineItem, cartItem) {
        let discounts = cartItem[0].product.productUnitPriceInfo.discounts;
        lineItem.custom.eswShopperCurrencyItemPriceInfoBeforeDiscount = (discounts.length > 0) ? Number(discounts[0].beforeDiscount.shopper.amount) : Number(cartItem[0].product.productUnitPriceInfo.price.shopper.amount);
        lineItem.custom.eswRetailerCurrencyItemPriceInfoBeforeDiscount = (discounts.length > 0) ? Number(discounts[0].beforeDiscount.retailer.amount) : Number(cartItem[0].product.productUnitPriceInfo.price.retailer.amount);

        lineItem.custom.eswRetailerCurrencyItemAdministration = Number(cartItem[0].charges.administration.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemAdministration = Number(cartItem[0].charges.administration.shopper.amount);
        lineItem.custom.eswRetailerCurrencyItemDuty = Number(cartItem[0].charges.duty.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemDuty = Number(cartItem[0].charges.duty.shopper.amount);
        lineItem.custom.eswHSCode = cartItem[0].product.hsCode;
        lineItem.custom.eswRetailerCurrencyItemOtherTaxes = Number(cartItem[0].charges.otherTaxes.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemOtherTaxes = Number(cartItem[0].charges.otherTaxes.shopper.amount);
        lineItem.custom.eswRetailerCurrencyItemSubTotal = Number(cartItem[0].charges.subTotal.retailer.amount);
        lineItem.custom.eswRetailerCurrencyItemPriceInfo = Number(cartItem[0].product.productUnitPriceInfo.price.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemSubTotal = Number(cartItem[0].charges.subTotal.shopper.amount);
        lineItem.custom.eswShopperCurrencyItemPriceInfo = Number(cartItem[0].product.productUnitPriceInfo.price.shopper.amount);
        lineItem.custom.eswRetailerCurrencyItemDelivery = Number(cartItem[0].charges.delivery.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemDelivery = Number(cartItem[0].charges.delivery.shopper.amount);
        lineItem.custom.eswRetailerCurrencyItemDeliveryDuty = Number(cartItem[0].charges.deliveryDuty.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemDeliveryDuty = Number(cartItem[0].charges.deliveryDuty.shopper.amount);
        lineItem.custom.eswRetailerCurrencyItemDeliveryTaxes = Number(cartItem[0].charges.deliveryTaxes.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemDeliveryTaxes = Number(cartItem[0].charges.deliveryTaxes.shopper.amount);
        lineItem.custom.eswRetailerCurrencyItemUplift = Number(cartItem[0].charges.uplift.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemUplift = Number(cartItem[0].charges.uplift.shopper.amount);
        lineItem.custom.eswRetailerCurrencyItemTaxes = Number(cartItem[0].charges.taxes.retailer.amount);
        lineItem.custom.eswShopperCurrencyItemTaxes = Number(cartItem[0].charges.taxes.shopper.amount);
        lineItem.custom.eswReturnProhibited = cartItem[0].product.isReturnProhibited;

        let shopperLineItemDiscounts = this.getItemDiscountsInfo(cartItem[0].product.productUnitPriceInfo.discounts, 'shopper', 'ProductLevelDiscount');
        let retailerLineItemDiscounts = this.getItemDiscountsInfo(cartItem[0].product.productUnitPriceInfo.discounts, 'retailer', 'ProductLevelDiscount');
        lineItem.custom.eswShopperCurrencyItemDiscountsInfo = !empty(shopperLineItemDiscounts) ? JSON.stringify(shopperLineItemDiscounts) : '';
        lineItem.custom.eswRetailerCurrencyItemDiscountsInfo = !empty(retailerLineItemDiscounts) ? JSON.stringify(retailerLineItemDiscounts) : '';

        let itemCashOnDeliveryObj = (!empty(cartItem[0].charges) && !empty(cartItem[0].charges.cashOnDelivery)) ? cartItem[0].charges.cashOnDelivery : '';
        if (!empty(itemCashOnDeliveryObj)) {
            lineItem.custom.eswRetailerCashOnDeliveryFee = Number(itemCashOnDeliveryObj.retailer.amount);
            lineItem.custom.eswRetailerCashOnDeliveryFeeCurrency = itemCashOnDeliveryObj.retailer.currency;
            lineItem.custom.eswShopperCashOnDeliveryFee = Number(itemCashOnDeliveryObj.shopper.amount);
            lineItem.custom.eswShopperCashOnDeliveryFeeCurrency = itemCashOnDeliveryObj.shopper.currency;
        }
        let itemCashOnDeliveryTaxesObj = (!empty(cartItem[0].charges) && !empty(cartItem[0].charges.cashOnDeliveryTaxes)) ? cartItem[0].charges.cashOnDeliveryTaxes : '';
        if (!empty(itemCashOnDeliveryTaxesObj)) {
            lineItem.custom.eswRetailerCashOnDeliveryTaxFee = Number(itemCashOnDeliveryTaxesObj.retailer.amount);
            lineItem.custom.eswRetailerCashOnDeliveryTaxFeeCurrency = itemCashOnDeliveryTaxesObj.retailer.currency;
            lineItem.custom.eswShopperCashOnDeliveryTaxFee = Number(itemCashOnDeliveryTaxesObj.shopper.amount);
            lineItem.custom.eswShopperCashOnDeliveryTaxFeeCurrency = itemCashOnDeliveryTaxesObj.shopper.currency;
        }

        return {
            ShopperDiscount: [],
            RetailerDiscount: []
        };
    },
    /**
    * Update Shopper Billing and shipping address in order object
    * @param {Object} contactDetails - contact details from ESW OC response
    * @param {Object} order - SFCC order object
    */
    updateShopperAddressDetails: function (contactDetails, order) {
        let shippingCustomer = contactDetails.filter(function (details) {
            return details.contactDetailType === 'IsDelivery';
        });
        let billingCustomer = contactDetails.filter(function (details) {
            return details.contactDetailType === 'IsPayment';
        });
        order.customerEmail = !empty(billingCustomer[0].email) ? billingCustomer[0].email : shippingCustomer[0].email;
        order.customerName = billingCustomer[0].firstName + ' ' + billingCustomer[0].lastName;
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (let detail in contactDetails) {
            if (contactDetails[detail].contactDetailType.equalsIgnoreCase('IsDelivery')) {
                order.shipments[0].shippingAddress.firstName = contactDetails[detail].firstName;
                order.shipments[0].shippingAddress.lastName = contactDetails[detail].lastName;
                order.shipments[0].shippingAddress.address1 = contactDetails[detail].address1;
                order.shipments[0].shippingAddress.address2 = contactDetails[detail].address2;
                order.shipments[0].shippingAddress.city = contactDetails[detail].city;
                order.shipments[0].shippingAddress.countryCode = contactDetails[detail].country;
                order.shipments[0].shippingAddress.postalCode = contactDetails[detail].postalCode;
                order.shipments[0].shippingAddress.phone = contactDetails[detail].telephone;
                if (!empty(contactDetails[detail].region)) {
                    order.shipments[0].shippingAddress.stateCode = contactDetails[detail].region;
                }
            } else if (contactDetails[detail].contactDetailType.equalsIgnoreCase('IsPayment')) {
                order.billingAddress.firstName = contactDetails[detail].firstName;
                order.billingAddress.lastName = contactDetails[detail].lastName;
                order.billingAddress.address1 = contactDetails[detail].address1;
                order.billingAddress.address2 = contactDetails[detail].address2;
                order.billingAddress.city = contactDetails[detail].city;
                order.billingAddress.countryCode = contactDetails[detail].country;
                order.billingAddress.postalCode = contactDetails[detail].postalCode;
                if (!empty(contactDetails[detail].region)) {
                    order.billingAddress.stateCode = contactDetails[detail].region;
                }
            }
        }
        order.billingAddress.phone = !empty(billingCustomer[0].telephone) ? billingCustomer[0].telephone : shippingCustomer[0].telephone;
    },
    /**
    * Save Customer Address in AddressBook
    * @param {Object} contactDetails - contact details from ESW OC response
    * @param {string} customerID - Registered customer Number
    */
    saveAddressinAddressBook: function (contactDetails, customerID) {
        try {
            let addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
            let addressBook = CustomerMgr.getCustomerByCustomerNumber(customerID).getAddressBook();
            let addressList = addressBook.getAddresses();

            if (!empty(addressList)) {
                // eslint-disable-next-line no-restricted-syntax, guard-for-in
                for (let i in addressList) {
                    if (addressList[i].ID === addressHelpers.generateAddressName(contactDetails[0])) {
                        return;
                    }
                }
            }
            let newAddress = addressBook.createAddress(addressHelpers.generateAddressName(contactDetails[0]));
            if (contactDetails[0].contactDetailType.equalsIgnoreCase('IsDelivery')) {
                newAddress.setFirstName(contactDetails[0].firstName);
                newAddress.setLastName(contactDetails[0].lastName);
                newAddress.setAddress1(contactDetails[0].address1);
                newAddress.setAddress2(contactDetails[0].address2);
                newAddress.setCity(contactDetails[0].city);
                newAddress.setCountryCode(contactDetails[0].country);
                newAddress.setPostalCode(contactDetails[0].postalCode);
                newAddress.setPhone(contactDetails[0].telephone);
                if (!empty(contactDetails[0].region)) {
                    newAddress.setStateCode(contactDetails[0].region);
                }
                addressBook.setPreferredAddress(newAddress);
            }
        } catch (error) {
            eswHelper.eswInfoLogger('error on adding new address to customer addressbook' + error);
        }
    },
    /**
    * Update ESW Payment instrument custom attributes
    * @param {Object} order - SFCC order object
    * @param {string} eswPaymentAmount - Total shopper currency amount of order
    * @param {string} cardBrand - Delivery Country ISO
    * @param {Object} ocPayload - Complete order confirmation payload
    */
    updateEswPaymentAttributes: function (order, eswPaymentAmount, cardBrand, ocPayload) {
        let splitPaymentsArr = this.getSplitPaymentDetails(ocPayload);
        if (!empty(splitPaymentsArr) && splitPaymentsArr.length > 0) {
            this.updateSplitPaymentInOrder(order, splitPaymentsArr, ocPayload);
        } else {
            order.paymentInstruments[0].paymentTransaction.custom.eswPaymentAmount = Number(eswPaymentAmount);
            order.paymentInstruments[0].paymentTransaction.custom.eswPaymentMethodCardBrand = cardBrand;
        }
    },
    /**
     * Update order payments with split payments
     * @param {dw.Order} order - DW order
     * @param {Object} splitPaymentsArr - Split Payment Details
     * @param {Object} ocPayload - OC Payload
     * @returns {boolean} - true/false
     */
    updateSplitPaymentInOrder: function (order, splitPaymentsArr, ocPayload) {
        if (splitPaymentsArr.length === 0) return false;
        try {
            let shopperCurrency = null;
            let paymentMethod = 'ESW_PAYMENT';
            let pis = order.getPaymentInstruments().iterator();

            if ('lineItems' in ocPayload) { // OC v3
                shopperCurrency = ocPayload.checkoutTotal.shopper.currency;
            } else {
                shopperCurrency = ocPayload.shopperCurrencyPaymentAmount.substring(0, 3);
            }

            // Remove previously binded payment instruments
            while (pis.hasNext()) {
                order.removePaymentInstrument(pis.next());
            }
            // Attach PI availble in OC payload
            for (let i = 0; i < splitPaymentsArr.length; i++) {
                let currentPI = splitPaymentsArr[i];
                let paymentInst = order.createPaymentInstrument(paymentMethod, new Money(Number(currentPI.amountPaid), shopperCurrency));
                paymentInst.paymentTransaction.custom.eswPaymentMethodCardBrand = currentPI.methodCardBrand || currentPI.method;
                paymentInst.paymentTransaction.setPaymentProcessor(PaymentMgr.getPaymentMethod(paymentMethod).getPaymentProcessor());
            }
        } catch (e) {
            return false;
        }
        return true;
    },
    /**
     * Returns all aplit payments from OC payload; v2 and v3
     * @param {Object} ocPayload - OC complete payload
     * @returns {Object} - Split Payment Details
     */
    getSplitPaymentDetails: function (ocPayload) {
        let splitPayments = null;
        if (empty(ocPayload)) {
            return splitPayments;
        }

        if (ocPayload && !empty(ocPayload)
            && ('lineItems' in ocPayload || 'cartItems' in ocPayload)
            && ocPayload.paymentRecords
            && ocPayload.paymentRecords.length > 0) {
            splitPayments = ocPayload.paymentRecords;
        }

        return splitPayments;
    },
    /**
    * Update ESW Order level custom attibutes for OC V2
    * @param {Object} obj - ESW OC response object
    * @param {Object} order - SFCC order object
    */
    updateEswOrderAttributesV2: function (obj, order) {
        order.custom.eswShopperCurrencyDeliveryTaxes = Number(obj.charges.shopperCurrencyDeliveryTaxes.substring(3));
        order.custom.eswRetailerCurrencyDeliveryTaxes = Number(obj.charges.retailerCurrencyDeliveryTaxes.substring(3));
        order.custom.eswShopperCurrencyDeliveryDuty = Number(obj.charges.shopperCurrencyDeliveryDuty.substring(3));
        order.custom.eswRetailerCurrencyDeliveryDuty = Number(obj.charges.retailerCurrencyDeliveryDuty.substring(3));
        order.custom.eswShopperCurrencyDuty = Number(obj.charges.shopperCurrencyDuty.substring(3));
        order.custom.eswRetailerCurrencyDuty = Number(obj.charges.retailerCurrencyDuty.substring(3));
        order.custom.eswShopperCurrencyDelivery = Number(obj.charges.shopperCurrencyDelivery.substring(3));
        order.custom.eswRetailerCurrencyDelivery = Number(obj.charges.retailerCurrencyDelivery.substring(3));
        order.custom.eswShopperCurrencyTaxes = Number(obj.charges.shopperCurrencyTaxes.substring(3));
        order.custom.eswRetailerCurrencyTaxes = Number(obj.charges.retailerCurrencyTaxes.substring(3));
        order.custom.eswShopperCurrencyOtherTaxes = Number(obj.charges.shopperCurrencyOtherTaxes.substring(3));
        order.custom.eswRetailerCurrencyOtherTaxes = Number(obj.charges.retailerCurrencyOtherTaxes.substring(3));
        order.custom.eswShopperCurrencyAdministration = Number(obj.charges.shopperCurrencyAdministration.substring(3));
        order.custom.eswRetailerCurrencyAdministration = Number(obj.charges.retailerCurrencyAdministration.substring(3));
        order.custom.eswShopperCurrencyUplift = Number(obj.charges.shopperCurrencyUplift.substring(3));
        order.custom.eswRetailerCurrencyUplift = Number(obj.charges.retailerCurrencyUplift.substring(3));
        order.custom.eswRetailerCurrencyCode = obj.retailerCurrencyPaymentAmount.substring(0, 3);
        order.custom.eswShopperCurrencyCode = obj.shopperCurrencyPaymentAmount.substring(0, 3);
        order.custom.eswOrderNo = obj.eShopWorldOrderNumber;
        order.custom.eswShopperCurrencyTotal = Number(obj.charges.shopperCurrencyTotal.substring(3));
        order.custom.eswRetailerCurrencyTotal = Number(obj.charges.retailerCurrencyTotal.substring(3));
        order.custom.eswShopperCurrencyPaymentAmount = Number(obj.shopperCurrencyPaymentAmount.substring(3));
        order.custom.eswRetailerCurrencyPaymentAmount = Number(obj.retailerCurrencyPaymentAmount.substring(3));
        order.custom.eswEmailMarketingOptIn = obj.shopperCheckoutExperience.emailMarketingOptIn;
        order.custom.eswSMSMarketingOptIn = !empty(obj.shopperCheckoutExperience.smsMarketingOptIn) ? obj.shopperCheckoutExperience.smsMarketingOptIn : false;
        order.custom.eswDeliveryOption = obj.deliveryOption.deliveryOption;
        // Storing CoD attributes
        if (obj.charges && !empty(obj.charges.retailerCurrencyCashOnDelivery)) {
            order.custom.eswRetailerCashOnDeliveryFeeCurrency = !empty(obj.charges.retailerCurrencyCashOnDelivery) ? obj.charges.retailerCurrencyCashOnDelivery.substring(0, 3) : '';
            order.custom.eswRetailerCashOnDeliveryFee = !empty(obj.charges.retailerCurrencyCashOnDelivery) ? Number(obj.charges.retailerCurrencyCashOnDelivery.substring(3)) : '';
            order.custom.eswShopperCashOnDeliveryFeeCurrency = !empty(obj.charges.shopperCurrencyCashOnDelivery) ? obj.charges.shopperCurrencyCashOnDelivery.substring(0, 3) : '';
            order.custom.eswShopperCashOnDeliveryFee = !empty(obj.charges.shopperCurrencyCashOnDelivery) ? Number(obj.charges.shopperCurrencyCashOnDelivery.substring(3)) : '';
        }
        // storing COD Taxes
        if (obj.charges && !empty(obj.charges.retailerCurrencyCashOnDeliveryTaxes)) {
            order.custom.eswRetailerCashOnDeliveryTaxFeeCurrency = !empty(obj.charges.retailerCurrencyCashOnDeliveryTaxes) ? obj.charges.retailerCurrencyCashOnDeliveryTaxes.substring(0, 3) : '';
            order.custom.eswRetailerCashOnDeliveryTaxFee = !empty(obj.charges.retailerCurrencyCashOnDeliveryTaxes) ? Number(obj.charges.retailerCurrencyCashOnDeliveryTaxes.substring(3)) : '';
            order.custom.eswShopperCashOnDeliveryTaxFeeCurrency = !empty(obj.charges.shopperCurrencyCashOnDeliveryTaxes) ? obj.charges.shopperCurrencyCashOnDeliveryTaxes.substring(0, 3) : '';
            order.custom.eswShopperCashOnDeliveryTaxFee = !empty(obj.charges.shopperCurrencyCashOnDeliveryTaxes) ? Number(obj.charges.shopperCurrencyCashOnDeliveryTaxes.substring(3)) : '';
        }

        let shoppercurrencyAmount = Number(obj.shopperCurrencyPaymentAmount.substring(3));
        let retailercurrencyAmount = Number(obj.retailerCurrencyPaymentAmount.substring(3));

        order.custom.eswFxrateOc = (shoppercurrencyAmount / retailercurrencyAmount).toFixed(Constants.DECIMAL_LENGTH);
        order.custom.eswRetailerCurrencyTotalOrderDiscount = order.custom.eswShopperCurrencyTotalOrderDiscount / order.custom.eswFxrateOc;
        if ('shopperCurrencyDeliveryPriceInfo' in obj.deliveryOption) {
            order.custom.eswShopperCurrencyDeliveryPriceInfo = Number(obj.deliveryOption.shopperCurrencyDeliveryPriceInfo.price.substring(3));
        } else {
            order.custom.eswShopperCurrencyDeliveryPriceInfo = Number(obj.charges.shopperCurrencyDelivery.substring(3)) + Number(obj.charges.shopperCurrencyDeliveryDuty.substring(3)) + Number(obj.charges.shopperCurrencyDeliveryTaxes.substring(3));
        }
        if ('retailerCurrencyDeliveryPriceInfo' in obj.deliveryOption) {
            order.custom.eswRetailerCurrencyDeliveryPriceInfo = Number(obj.deliveryOption.retailerCurrencyDeliveryPriceInfo.price.substring(3));
        } else {
            order.custom.eswRetailerCurrencyDeliveryPriceInfo = Number(obj.charges.retailerCurrencyDelivery.substring(3)) + Number(obj.charges.retailerCurrencyDeliveryDuty.substring(3)) + Number(obj.charges.retailerCurrencyDeliveryTaxes.substring(3));
        }

        order.custom.eswPaymentMethod = (obj.paymentMethod && obj.paymentMethod != null) ? obj.paymentMethod : null;
        order.custom.eswFraudHold = (obj.fraudHold && obj.fraudHold != null) ? obj.fraudHold : null;

        if (!empty(order.customer) && !empty(order.customer.profile)) {
            order.customer.profile.custom.eswMarketingOptIn = obj.shopperCheckoutExperience.emailMarketingOptIn;
            if (!empty(obj.shopperCheckoutExperience.smsMarketingOptIn)) {
                order.customer.profile.custom.eswSMSMarketingOptIn = obj.shopperCheckoutExperience.smsMarketingOptIn;
            }
        } else {
            let existedCustomer = CustomerMgr.getCustomerByLogin(!empty(obj.contactDetails[0].email) ? obj.contactDetails[0].email : obj.contactDetails[1].email);
            if (!empty(existedCustomer) && obj.shopperCheckoutExperience.emailMarketingOptIn === true) {
                existedCustomer.profile.custom.eswMarketingOptIn = obj.shopperCheckoutExperience.emailMarketingOptIn;
            }
            if (!empty(existedCustomer) && obj.shopperCheckoutExperience.smsMarketingOptIn === true) {
                existedCustomer.profile.custom.eswSMSMarketingOptIn = obj.shopperCheckoutExperience.smsMarketingOptIn;
            }
        }
    },
    /**
    * Update ESW Order Item level custom attibutes for OC V2
    * @param {Object} obj - ESW OC response object
    * @param {Object} lineItem - SFCC Product Line Item object
    * @param {Object} cartItem - Found cart object from OC response
    */
    updateEswOrderItemAttributesV2: function (obj, lineItem, cartItem) {
        lineItem.custom.eswShopperCurrencyItemPriceInfoBeforeDiscount = Number(('beforeDiscount' in cartItem[0].product.shopperCurrencyProductPriceInfo) ? cartItem[0].product.shopperCurrencyProductPriceInfo.beforeDiscount.substring(3) : cartItem[0].product.shopperCurrencyProductPriceInfo.price.substring(3));
        lineItem.custom.eswRetailerCurrencyItemPriceInfoBeforeDiscount = Number(('beforeDiscount' in cartItem[0].product.retailerCurrencyProductPriceInfo) ? cartItem[0].product.retailerCurrencyProductPriceInfo.beforeDiscount.substring(3) : cartItem[0].product.retailerCurrencyProductPriceInfo.price.substring(3));

        lineItem.custom.eswShopperCurrencyItemDiscountsInfo = Number(('discountAmount' in cartItem[0].product.shopperCurrencyProductPriceInfo) ? cartItem[0].product.shopperCurrencyProductPriceInfo.discountAmount.substring(3) : '');
        lineItem.custom.eswRetailerCurrencyItemDiscountsInfo = Number(('discountAmount' in cartItem[0].product.retailerCurrencyProductPriceInfo) ? cartItem[0].product.retailerCurrencyProductPriceInfo.discountAmount.substring(3) : '');

        lineItem.custom.eswRetailerCurrencyItemAdministration = Number(cartItem[0].retailerCurrencyItemAdministration.substring(3));
        lineItem.custom.eswShopperCurrencyItemAdministration = Number(cartItem[0].shopperCurrencyItemAdministration.substring(3));
        lineItem.custom.eswRetailerCurrencyItemDuty = Number(cartItem[0].retailerCurrencyItemDuty.substring(3));
        lineItem.custom.eswShopperCurrencyItemDuty = Number(cartItem[0].shopperCurrencyItemDuty.substring(3));
        lineItem.custom.eswHSCode = cartItem[0].product.hsCode;
        lineItem.custom.eswRetailerCurrencyItemOtherTaxes = Number(cartItem[0].retailerCurrencyItemOtherTaxes.substring(3));
        lineItem.custom.eswShopperCurrencyItemOtherTaxes = Number(cartItem[0].shopperCurrencyItemOtherTaxes.substring(3));
        lineItem.custom.eswRetailerCurrencyItemSubTotal = Number(cartItem[0].retailerCurrencyItemSubTotal.substring(3));
        lineItem.custom.eswRetailerCurrencyItemPriceInfo = Number(cartItem[0].product.retailerCurrencyProductPriceInfo.price.substring(3));
        lineItem.custom.eswShopperCurrencyItemSubTotal = Number(cartItem[0].shopperCurrencyItemSubTotal.substring(3));
        lineItem.custom.eswShopperCurrencyItemPriceInfo = Number(cartItem[0].product.shopperCurrencyProductPriceInfo.price.substring(3));
        lineItem.custom.eswRetailerCurrencyItemDelivery = Number(cartItem[0].retailerCurrencyItemDelivery.substring(3));
        lineItem.custom.eswShopperCurrencyItemDelivery = Number(cartItem[0].shopperCurrencyItemDelivery.substring(3));
        lineItem.custom.eswRetailerCurrencyItemDeliveryDuty = Number(cartItem[0].retailerCurrencyItemDeliveryDuty.substring(3));
        lineItem.custom.eswShopperCurrencyItemDeliveryDuty = Number(cartItem[0].shopperCurrencyItemDeliveryDuty.substring(3));
        lineItem.custom.eswRetailerCurrencyItemDeliveryTaxes = Number(cartItem[0].retailerCurrencyItemDeliveryTaxes.substring(3));
        lineItem.custom.eswShopperCurrencyItemDeliveryTaxes = Number(cartItem[0].shopperCurrencyItemDeliveryTaxes.substring(3));
        lineItem.custom.eswRetailerCurrencyItemUplift = Number(cartItem[0].retailerCurrencyItemUplift.substring(3));
        lineItem.custom.eswShopperCurrencyItemUplift = Number(cartItem[0].shopperCurrencyItemUplift.substring(3));
        lineItem.custom.eswRetailerCurrencyItemTaxes = Number(cartItem[0].retailerCurrencyItemTaxes.substring(3));
        lineItem.custom.eswShopperCurrencyItemTaxes = Number(cartItem[0].shopperCurrencyItemTaxes.substring(3));
        lineItem.custom.eswReturnProhibited = cartItem[0].product.isReturnProhibited;
        // Storing CoD attributes
        if (!empty(cartItem[0].retailerCurrencyItemCashOnDelivery)) {
            lineItem.custom.eswRetailerCashOnDeliveryFeeCurrency = !empty(cartItem[0].retailerCurrencyItemCashOnDelivery) ? cartItem[0].retailerCurrencyItemCashOnDelivery.substring(0, 3) : '';
            lineItem.custom.eswRetailerCashOnDeliveryFee = !empty(cartItem[0].retailerCurrencyItemCashOnDelivery) ? Number(cartItem[0].retailerCurrencyItemCashOnDelivery.substring(3)) : '';
            lineItem.custom.eswShopperCashOnDeliveryFeeCurrency = !empty(cartItem[0].shopperCurrencyItemCashOnDelivery) ? cartItem[0].shopperCurrencyItemCashOnDelivery.substring(0, 3) : '';
            lineItem.custom.eswShopperCashOnDeliveryFee = !empty(cartItem[0].shopperCurrencyItemCashOnDelivery) ? Number(cartItem[0].shopperCurrencyItemCashOnDelivery.substring(3)) : '';
        }
        // Storing CoD Tax attributes
        if (!empty(cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes)) {
            lineItem.custom.eswRetailerCashOnDeliveryTaxFeeCurrency = !empty(cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes) ? cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes.substring(0, 3) : '';
            lineItem.custom.eswRetailerCashOnDeliveryTaxFee = !empty(cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes) ? Number(cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes.substring(3)) : '';
            lineItem.custom.eswShopperCashOnDeliveryTaxFeeCurrency = !empty(cartItem[0].shopperCurrencyItemCashOnDeliveryTaxes) ? cartItem[0].shopperCurrencyItemCashOnDeliveryTaxes.substring(0, 3) : '';
            lineItem.custom.eswShopperCashOnDeliveryTaxFee = !empty(cartItem[0].shopperCurrencyItemCashOnDeliveryTaxes) ? Number(cartItem[0].shopperCurrencyItemCashOnDeliveryTaxes.substring(3)) : '';
        }
    },
    /**
    * Update ESW Order Item level custom attibutes for OC V2
    * @param {Object} order - SFCC order object
    * @return {boolean} - true/ false
    */
    validateEswOrderInventory: function (order) {
        let Logger = require('dw/system/Logger');
        let hasInventory = true;
        try {
            collections.forEach(order.productLineItems, function (item) {
                let availabilityLevels = item.product.availabilityModel.getAvailabilityLevels(item.quantityValue);
                if (item.product === null || !item.product.online || availabilityLevels.notAvailable.value !== 0) {
                    hasInventory = false;
                    return;
                }
            });
        } catch (e) {
            Logger.error('Error in getting product inventory: {0} {1}', e.message, e.stack);
        }
        return hasInventory;
    },
    /**
     * Update order level object in v3, function must be wrap in Transaction
     * @param {Object} obj - API object to update order for v3
     * @param {dw.Order} order - DW Order Object
     * @returns {Object} - updated values
     */
    updateOrderLevelAttrV3: function (obj, order) {
        let eswShopperCurrencyOrderDiscountsInfo = (!empty(obj.cartDiscountPriceInfo) && !empty(obj.cartDiscountPriceInfo.discounts)) ? JSON.stringify(this.getItemDiscountsInfo(obj.cartDiscountPriceInfo.discounts, 'shopper', 'OrderLevelDiscount')) : '';
        let eswRetailerCurrencyOrderDiscountsInfo = (!empty(obj.cartDiscountPriceInfo) && !empty(obj.cartDiscountPriceInfo.discounts)) ? JSON.stringify(this.getItemDiscountsInfo(obj.cartDiscountPriceInfo.discounts, 'retailer', 'OrderLevelDiscount')) : '';
        order.custom.eswShopperCurrencyOrderDiscountsInfo = eswShopperCurrencyOrderDiscountsInfo;
        order.custom.eswRetailerCurrencyOrderDiscountsInfo = eswRetailerCurrencyOrderDiscountsInfo;
        return {
            eswShopperCurrencyOrderDiscountsInfo: eswShopperCurrencyOrderDiscountsInfo,
            eswRetailerCurrencyOrderDiscountsInfo: eswRetailerCurrencyOrderDiscountsInfo
        };
    }
};

module.exports = {
    getEswOcHelper: function () {
        return getEswOcHelper;
    }
};
