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
const Order = require('dw/order/Order');

/* Script Modules */
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const collections = require('*/cartridge/scripts/util/collections');

const getEswOcHelper = {
    /**
    * Set order/lineitem custom attributes
    * @param {Object} order - order
    * @param {Object} attributeName - attributeName
    * @param {Object} attributeValue - attributeValue
    */
    checkAndSetOrderCustomAttribute: function (order, attributeName, attributeValue) {
        // Check if the custom attribute exists
        try {
            order.custom[attributeName] = attributeValue;
        } catch (error) {
            eswHelper.eswInfoLogger('error on adding custom attribute on order' + error + attributeName);
        }
    },
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
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDeliveryTaxes', Number(obj.charges.deliveryTaxes.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDeliveryTaxes', Number(obj.charges.deliveryTaxes.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDeliveryDuty', Number(obj.charges.deliveryDuty.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDeliveryDuty', Number(obj.charges.deliveryDuty.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDuty', Number(obj.charges.duty.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDuty', Number(obj.charges.duty.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDelivery', Number(obj.charges.delivery.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDelivery', Number(obj.charges.delivery.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyTaxes', Number(obj.charges.taxes.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyTaxes', Number(obj.charges.taxes.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyOtherTaxes', Number(obj.charges.otherTaxes.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyOtherTaxes', Number(obj.charges.otherTaxes.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyAdministration', Number(obj.charges.administration.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyAdministration', Number(obj.charges.administration.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyUplift', Number(obj.charges.uplift.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyUplift', Number(obj.charges.uplift.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyCode', obj.checkoutTotal.retailer.currency);
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyCode', obj.checkoutTotal.shopper.currency);
        this.checkAndSetOrderCustomAttribute(order, 'eswOrderNo', obj.eShopWorldOrderNumber);
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyTotal', Number(obj.charges.total.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyTotal', Number(obj.charges.total.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyPaymentAmount', Number(obj.checkoutTotal.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyPaymentAmount', Number(obj.checkoutTotal.retailer.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswEmailMarketingOptIn', obj.shopperCheckoutExperience.emailMarketingOptIn);
        this.checkAndSetOrderCustomAttribute(order, 'eswDeliveryOption', obj.deliveryOption.deliveryOption);
        this.checkAndSetOrderCustomAttribute(order, 'eswSMSMarketingOptIn', obj.shopperCheckoutExperience.smsMarketingOptIn || false);

        let shoppercurrencyAmount = Number(obj.checkoutTotal.shopper.amount);
        let retailercurrencyAmount = Number(obj.checkoutTotal.retailer.amount);

        this.checkAndSetOrderCustomAttribute(order, 'eswFxrateOc', (shoppercurrencyAmount / retailercurrencyAmount).toFixed(Constants.DECIMAL_LENGTH));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyTotalOrderDiscount', order.custom.eswShopperCurrencyTotalOrderDiscount / (shoppercurrencyAmount / retailercurrencyAmount));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDeliveryPriceInfo', Number(obj.deliveryOption.deliveryOptionPriceInfo.price.shopper.amount));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDeliveryPriceInfo', Number(obj.deliveryOption.deliveryOptionPriceInfo.price.retailer.amount));

        this.checkAndSetOrderCustomAttribute(order, 'eswPaymentMethod', (obj.paymentDetails && obj.paymentDetails.method) ? obj.paymentDetails.method : null);
        this.checkAndSetOrderCustomAttribute(order, 'eswFraudHold', (obj.fraudHold && obj.fraudHold) ? obj.fraudHold : null);

        let eswRetailerCurrencyDeliveryDiscountsInfo = this.getDeliveryDiscountsInfo(obj.deliveryOption, 'retailer');
        let eswShopperCurrencyDeliveryDiscountsInfo = this.getDeliveryDiscountsInfo(obj.deliveryOption, 'shopper');
        let orderCashOnDeliveryObj = (!empty(obj.charges) && !empty(obj.charges.cashOnDelivery)) ? obj.charges.cashOnDelivery : '';
        if (!empty(orderCashOnDeliveryObj)) {
            this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCashOnDeliveryFee', Number(orderCashOnDeliveryObj.retailer.amount));
            this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCashOnDeliveryFeeCurrency', orderCashOnDeliveryObj.retailer.currency);
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCashOnDeliveryFee', Number(orderCashOnDeliveryObj.shopper.amount));
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCashOnDeliveryFeeCurrency', orderCashOnDeliveryObj.shopper.currency);
        }
        let orderCashOnDeliveryTaxesObj = (!empty(obj.charges) && !empty(obj.charges.cashOnDeliveryTaxes)) ? obj.charges.cashOnDeliveryTaxes : '';
        if (!empty(orderCashOnDeliveryTaxesObj)) {
            this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCashOnDeliveryTaxFee', Number(orderCashOnDeliveryTaxesObj.retailer.amount));
            this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCashOnDeliveryTaxFeeCurrency', orderCashOnDeliveryTaxesObj.retailer.currency);
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCashOnDeliveryTaxFee', Number(orderCashOnDeliveryTaxesObj.shopper.amount));
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCashOnDeliveryTaxFeeCurrency', orderCashOnDeliveryTaxesObj.shopper.currency);
        }

        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDeliveryDiscountsInfo', !empty(eswRetailerCurrencyDeliveryDiscountsInfo) ? JSON.stringify(eswRetailerCurrencyDeliveryDiscountsInfo) : '');
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDeliveryDiscountsInfo', !empty(eswShopperCurrencyDeliveryDiscountsInfo) ? JSON.stringify(eswShopperCurrencyDeliveryDiscountsInfo) : '');

        let CountryCO = CustomObjectMgr.getCustomObject('ESW_COUNTRIES', obj.deliveryCountryIso);
        if (!empty(CountryCO) && !empty(CountryCO.custom.hubAddress)) {
            this.checkAndSetOrderCustomAttribute(order, 'eswHubAddress', CountryCO.custom.hubAddress);
            this.checkAndSetOrderCustomAttribute(order, 'eswHubState', CountryCO.custom.hubAddressState);
            this.checkAndSetOrderCustomAttribute(order, 'eswHubCity', CountryCO.custom.hubAddressCity);
            this.checkAndSetOrderCustomAttribute(order, 'eswHubPostalCode', CountryCO.custom.hubAddressPostalCode);
        }

        if (!empty(order.customer) && !empty(order.customer.profile)) {
            this.checkAndSetOrderCustomAttribute(order.customer.profile, 'eswMarketingOptIn', obj.shopperCheckoutExperience.emailMarketingOptIn);
            if (!empty(obj.shopperCheckoutExperience.smsMarketingOptIn)) {
                this.checkAndSetOrderCustomAttribute(order.customer.profile, 'eswSMSMarketingOptIn', obj.shopperCheckoutExperience.smsMarketingOptIn);
            }
        } else {
            let existedCustomer = CustomerMgr.getCustomerByLogin(!empty(obj.contactDetails[0].email) ? obj.contactDetails[0].email : obj.contactDetails[1].email);
            if (!empty(existedCustomer) && obj.shopperCheckoutExperience.emailMarketingOptIn === true) {
                this.checkAndSetOrderCustomAttribute(existedCustomer.profile, 'eswMarketingOptIn', obj.shopperCheckoutExperience.emailMarketingOptIn);
            }
            if (!empty(existedCustomer) && obj.shopperCheckoutExperience.smsMarketingOptIn === true) {
                this.checkAndSetOrderCustomAttribute(existedCustomer.profile, 'eswSMSMarketingOptIn', obj.shopperCheckoutExperience.smsMarketingOptIn);
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
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemPriceInfoBeforeDiscount', (discounts.length > 0) ? Number(discounts[0].beforeDiscount.shopper.amount) : Number(cartItem[0].product.productUnitPriceInfo.price.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemPriceInfoBeforeDiscount', (discounts.length > 0) ? Number(discounts[0].beforeDiscount.retailer.amount) : Number(cartItem[0].product.productUnitPriceInfo.price.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemAdministration', Number(cartItem[0].charges.administration.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemAdministration', Number(cartItem[0].charges.administration.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDuty', Number(cartItem[0].charges.duty.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDuty', Number(cartItem[0].charges.duty.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDuty', Number(cartItem[0].charges.duty.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswHSCode', cartItem[0].product.hsCode);
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemOtherTaxes', Number(cartItem[0].charges.otherTaxes.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemOtherTaxes', Number(cartItem[0].charges.otherTaxes.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemSubTotal', Number(cartItem[0].charges.subTotal.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemPriceInfo', Number(cartItem[0].product.productUnitPriceInfo.price.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemSubTotal', Number(cartItem[0].charges.subTotal.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemPriceInfo', Number(cartItem[0].product.productUnitPriceInfo.price.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDelivery', Number(cartItem[0].charges.delivery.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDelivery', Number(cartItem[0].charges.delivery.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDeliveryDuty', Number(cartItem[0].charges.deliveryDuty.retailer.amount));

        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDeliveryDuty', Number(cartItem[0].charges.deliveryDuty.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDeliveryDuty', Number(cartItem[0].charges.deliveryDuty.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDeliveryTaxes', Number(cartItem[0].charges.deliveryTaxes.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDeliveryTaxes', Number(cartItem[0].charges.deliveryTaxes.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemUplift', Number(cartItem[0].charges.uplift.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemUplift', Number(cartItem[0].charges.uplift.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemTaxes', Number(cartItem[0].charges.taxes.retailer.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemTaxes', Number(cartItem[0].charges.taxes.shopper.amount));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswReturnProhibited', cartItem[0].product.isReturnProhibited);

        let shopperLineItemDiscounts = this.getItemDiscountsInfo(cartItem[0].product.productUnitPriceInfo.discounts, 'shopper', 'ProductLevelDiscount');
        let retailerLineItemDiscounts = this.getItemDiscountsInfo(cartItem[0].product.productUnitPriceInfo.discounts, 'retailer', 'ProductLevelDiscount');
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDiscountsInfo', !empty(shopperLineItemDiscounts) ? JSON.stringify(shopperLineItemDiscounts) : '');
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDiscountsInfo', !empty(retailerLineItemDiscounts) ? JSON.stringify(retailerLineItemDiscounts) : '');

        let itemCashOnDeliveryObj = (!empty(cartItem[0].charges) && !empty(cartItem[0].charges.cashOnDelivery)) ? cartItem[0].charges.cashOnDelivery : '';
        if (!empty(itemCashOnDeliveryObj)) {
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCashOnDeliveryFee', Number(itemCashOnDeliveryObj.retailer.amount));
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCashOnDeliveryFeeCurrency', itemCashOnDeliveryObj.retailer.currency);
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCashOnDeliveryFee', Number(itemCashOnDeliveryObj.shopper.amount));
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCashOnDeliveryFeeCurrency', itemCashOnDeliveryObj.shopper.currency);
        }
        let itemCashOnDeliveryTaxesObj = (!empty(cartItem[0].charges) && !empty(cartItem[0].charges.cashOnDeliveryTaxes)) ? cartItem[0].charges.cashOnDeliveryTaxes : '';
        if (!empty(itemCashOnDeliveryTaxesObj)) {
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCashOnDeliveryTaxFee', Number(itemCashOnDeliveryTaxesObj.retailer.amount));
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCashOnDeliveryTaxFeeCurrency', itemCashOnDeliveryTaxesObj.retailer.currency);
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCashOnDeliveryTaxFee', Number(itemCashOnDeliveryTaxesObj.shopper.amount));
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCashOnDeliveryTaxFeeCurrency', itemCashOnDeliveryTaxesObj.shopper.currency);
        }
        lineItem.custom.eswFulfilmentCountryIso = !empty(cartItem[0].fulfilmentCountryIso) ? cartItem[0].fulfilmentCountryIso : '';
        lineItem.custom.eswDeliveryOption = !empty(cartItem[0].deliveryOption) ? cartItem[0].deliveryOption : '';
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
    removeIsSelected: function (addressBook) {
        let addressList = addressBook.getAddresses();
        if (!empty(addressList)) {
            collections.forEach(addressList, function (address) {
                address.custom.eswIsSelected = false;
            });
        }
    },
    /**
     * @param {Object} existingAddress - An existing or new Address
     * @param {Object} updatedAddress - Address from the OC response
     * @param {Object} addressBook - The address book of the customer
     */
    updateAddress: function (existingAddress, updatedAddress, addressBook) {
        existingAddress.setFirstName(updatedAddress.firstName);
        existingAddress.setLastName(updatedAddress.lastName);
        existingAddress.setAddress1(updatedAddress.address1);
        existingAddress.setAddress2(updatedAddress.address2);
        existingAddress.setCity(updatedAddress.city);
        existingAddress.setCountryCode(updatedAddress.country);
        existingAddress.setPostalCode(updatedAddress.postalCode);
        existingAddress.setPhone(updatedAddress.telephone);
        if (!empty(updatedAddress.region)) {
            existingAddress.setStateCode(updatedAddress.region);
        }
        if ('isDefault' in updatedAddress && updatedAddress.isDefault === true) {
            addressBook.setPreferredAddress(existingAddress);
        }
        if ('isSelected' in updatedAddress) {
            if (updatedAddress.isSelected) {
                this.removeIsSelected(addressBook);
            }
            existingAddress.custom.eswIsSelected = updatedAddress.isSelected;
        }
    },
    /**
    * Save Customer Address in AddressBook
    * @param {Object} contactDetails - contact details from ESW OC response
    * @param {string} customerID - Registered customer Number
    * @param {boolean} saveAddress - Save Address in AddressBook
    */
    saveAddressinAddressBook: function (contactDetails, customerID, saveAddress) {
        try {
            let addressBook = CustomerMgr.getCustomerByCustomerNumber(customerID).getAddressBook(),
                addressList = addressBook.getAddresses(),
                isMultiAdrressEnabled = eswHelper.isEswMultiAddressEnabled();
            if (!isMultiAdrressEnabled && !saveAddress) {
                return; // Do not save address in address book
            }
            contactDetails.forEach(contact => {
                let isSaveAddressEnabled = (!empty(contact.saveToProfile) && contact.saveToProfile) || (isMultiAdrressEnabled && saveAddress);
                // Skip iteration if saving address is not enabled
                if (!isSaveAddressEnabled) {
                    return;
                }
                let addressID = !empty(contact.addressId) ? contact.addressId : eswHelper.generateAddressName(contact);
                let existingAddress = null;
                if (!empty(addressList)) {
                    for (let i = 0; i < addressList.length; i++) {
                        if (addressList[i].ID === addressID) {
                            existingAddress = addressList[i];
                            break;
                        }
                    }
                }
                if (!empty(existingAddress)) {
                    if (!empty(contact.status) && contact.status === 'Edited') {
                        addressBook.removeAddress(existingAddress);
                        let newAddress = addressBook.createAddress(eswHelper.generateAddressName(contact));
                        this.updateAddress(newAddress, contact);
                    }
                } else if (contact.contactDetailType.equalsIgnoreCase(Constants.IS_DELIVERY)) {
                    let newAddress = addressBook.createAddress(addressID);
                    this.updateAddress(newAddress, contact, addressBook);
                }
            });
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
            this.updateSplitPaymentInOrder(order, splitPaymentsArr, ocPayload, eswPaymentAmount);
        } else {
            if ('eswPaymentAmount' in order.paymentInstruments[0].paymentTransaction.custom && order.paymentInstruments[0].paymentTransaction.custom.eswPaymentAmount) {
                order.paymentInstruments[0].paymentTransaction.custom.eswPaymentAmount = Number(eswPaymentAmount);
            }
            if ('eswPaymentMethodCardBrand' in order.paymentInstruments[0].paymentTransaction.custom && order.paymentInstruments[0].paymentTransaction.custom.eswPaymentMethodCardBrand) {
                order.paymentInstruments[0].paymentTransaction.custom.eswPaymentMethodCardBrand = cardBrand;
            }
        }
    },
    /**
     * Update order payments with split payments
     * @param {dw.Order} order - DW order
     * @param {Object} splitPaymentsArr - Split Payment Details
     * @param {Object} ocPayload - OC Payload
    * @param {string} eswPaymentAmount - Total shopper currency amount of order
     * @returns {boolean} - true/false
     */
    updateSplitPaymentInOrder: function (order, splitPaymentsArr, ocPayload, eswPaymentAmount) {
        if (splitPaymentsArr && splitPaymentsArr.length === 0) return false;
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
                this.checkAndSetOrderCustomAttribute(paymentInst.paymentTransaction, 'eswPaymentMethodCardBrand', (currentPI.methodCardBrand || currentPI.method));
                this.checkAndSetOrderCustomAttribute(paymentInst.paymentTransaction, 'eswPaymentAmount', Number(eswPaymentAmount));
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
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDeliveryTaxes', Number(obj.charges.shopperCurrencyDeliveryTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDeliveryTaxes', Number(obj.charges.retailerCurrencyDeliveryTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDeliveryDuty', Number(obj.charges.shopperCurrencyDeliveryDuty.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDeliveryDuty', Number(obj.charges.retailerCurrencyDeliveryDuty.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDuty', Number(obj.charges.shopperCurrencyDuty.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDuty', Number(obj.charges.retailerCurrencyDuty.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDelivery', Number(obj.charges.shopperCurrencyDelivery.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyDelivery', Number(obj.charges.retailerCurrencyDelivery.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyTaxes', Number(obj.charges.shopperCurrencyTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyTaxes', Number(obj.charges.retailerCurrencyTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyOtherTaxes', Number(obj.charges.shopperCurrencyOtherTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyOtherTaxes', Number(obj.charges.retailerCurrencyOtherTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyAdministration', Number(obj.charges.shopperCurrencyAdministration.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyAdministration', Number(obj.charges.retailerCurrencyAdministration.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyUplift', Number(obj.charges.shopperCurrencyUplift.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyUplift', Number(obj.charges.retailerCurrencyUplift.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyCode', obj.retailerCurrencyPaymentAmount.substring(0, 3));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyCode', obj.shopperCurrencyPaymentAmount.substring(0, 3));
        this.checkAndSetOrderCustomAttribute(order, 'eswOrderNo', obj.eShopWorldOrderNumber);
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyTotal', Number(obj.charges.shopperCurrencyTotal.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyTotal', Number(obj.charges.retailerCurrencyTotal.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyPaymentAmount', Number(obj.shopperCurrencyPaymentAmount.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyPaymentAmount', Number(obj.retailerCurrencyPaymentAmount.substring(3)));
        this.checkAndSetOrderCustomAttribute(order, 'eswEmailMarketingOptIn', obj.shopperCheckoutExperience.emailMarketingOptIn);
        this.checkAndSetOrderCustomAttribute(order, 'eswSMSMarketingOptIn', !empty(obj.shopperCheckoutExperience.smsMarketingOptIn) ? obj.shopperCheckoutExperience.smsMarketingOptIn : false);
        this.checkAndSetOrderCustomAttribute(order, 'eswDeliveryOption', obj.deliveryOption.deliveryOption);
        // Storing CoD attributes
        if (obj.charges && !empty(obj.charges.retailerCurrencyCashOnDelivery)) {
            this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCashOnDeliveryFeeCurrency', !empty(obj.charges.retailerCurrencyCashOnDelivery) ? obj.charges.retailerCurrencyCashOnDelivery.substring(0, 3) : '');
            this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCashOnDeliveryFee', !empty(obj.charges.retailerCurrencyCashOnDelivery) ? Number(obj.charges.retailerCurrencyCashOnDelivery.substring(3)) : '');
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCashOnDeliveryFeeCurrency', !empty(obj.charges.shopperCurrencyCashOnDelivery) ? obj.charges.shopperCurrencyCashOnDelivery.substring(0, 3) : '');
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCashOnDeliveryFee', !empty(obj.charges.shopperCurrencyCashOnDelivery) ? Number(obj.charges.shopperCurrencyCashOnDelivery.substring(3)) : '');
        }
        // storing COD Taxes
        if (obj.charges && !empty(obj.charges.retailerCurrencyCashOnDeliveryTaxes)) {
            this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCashOnDeliveryTaxFeeCurrency', !empty(obj.charges.retailerCurrencyCashOnDeliveryTaxes) ? obj.charges.retailerCurrencyCashOnDeliveryTaxes.substring(0, 3) : '');
            this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCashOnDeliveryTaxFee', !empty(obj.charges.retailerCurrencyCashOnDeliveryTaxes) ? Number(obj.charges.retailerCurrencyCashOnDeliveryTaxes.substring(3)) : '');
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCashOnDeliveryTaxFeeCurrency', !empty(obj.charges.shopperCurrencyCashOnDeliveryTaxes) ? obj.charges.shopperCurrencyCashOnDeliveryTaxes.substring(0, 3) : '');
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCashOnDeliveryTaxFee', !empty(obj.charges.shopperCurrencyCashOnDeliveryTaxes) ? Number(obj.charges.shopperCurrencyCashOnDeliveryTaxes.substring(3)) : '');
        }

        let shoppercurrencyAmount = Number(obj.shopperCurrencyPaymentAmount.substring(3));
        let retailercurrencyAmount = Number(obj.retailerCurrencyPaymentAmount.substring(3));

        this.checkAndSetOrderCustomAttribute(order, 'eswFxrateOc', (shoppercurrencyAmount / retailercurrencyAmount).toFixed(Constants.DECIMAL_LENGTH));
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyTotalOrderDiscount', order.custom.eswShopperCurrencyTotalOrderDiscount / order.custom.eswFxrateOc);
        if ('shopperCurrencyDeliveryPriceInfo' in obj.deliveryOption) {
            this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyDeliveryPriceInfo', Number(obj.deliveryOption.shopperCurrencyDeliveryPriceInfo.price.substring(3)));
        } else {
            this.checkAndSetOrderCustomAttribute(
                order,
                'eswShopperCurrencyDeliveryPriceInfo',
                Number(obj.charges.shopperCurrencyDelivery.substring(3)) +
                Number(obj.charges.shopperCurrencyDeliveryDuty.substring(3)) +
                Number(obj.charges.shopperCurrencyDeliveryTaxes.substring(3))
            );
        }
        if ('retailerCurrencyDeliveryPriceInfo' in obj.deliveryOption) {
            this.checkAndSetOrderCustomAttribute(
                order,
                'eswRetailerCurrencyDeliveryPriceInfo',
                Number(obj.deliveryOption.retailerCurrencyDeliveryPriceInfo.price.substring(3))
            );
        } else {
            this.checkAndSetOrderCustomAttribute(
                order,
                'eswRetailerCurrencyDeliveryPriceInfo',
                Number(obj.charges.retailerCurrencyDelivery.substring(3)) +
                Number(obj.charges.retailerCurrencyDeliveryDuty.substring(3)) +
                Number(obj.charges.retailerCurrencyDeliveryTaxes.substring(3))
            );
        }

        this.checkAndSetOrderCustomAttribute(order, 'eswPaymentMethod', obj.paymentMethod || null);
        this.checkAndSetOrderCustomAttribute(order, 'eswFraudHold', obj.fraudHold || null);

        if (!empty(order.customer) && !empty(order.customer.profile)) {
            this.checkAndSetOrderCustomAttribute(order.customer.profile, 'eswMarketingOptIn', obj.shopperCheckoutExperience.emailMarketingOptIn);
            if (!empty(obj.shopperCheckoutExperience.smsMarketingOptIn)) {
                this.checkAndSetOrderCustomAttribute(order.customer.profile, 'eswSMSMarketingOptIn', obj.shopperCheckoutExperience.smsMarketingOptIn);
            }
        } else {
            let existedCustomer = CustomerMgr.getCustomerByLogin(!empty(obj.contactDetails[0].email) ? obj.contactDetails[0].email : obj.contactDetails[1].email);
            if (!empty(existedCustomer) && obj.shopperCheckoutExperience.emailMarketingOptIn === true) {
                this.checkAndSetOrderCustomAttribute(existedCustomer.profile, 'eswMarketingOptIn', obj.shopperCheckoutExperience.emailMarketingOptIn);
            }
            if (!empty(existedCustomer) && obj.shopperCheckoutExperience.smsMarketingOptIn === true) {
                this.checkAndSetOrderCustomAttribute(existedCustomer.profile, 'eswSMSMarketingOptIn', obj.shopperCheckoutExperience.smsMarketingOptIn);
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
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemPriceInfoBeforeDiscount', Number(('beforeDiscount' in cartItem[0].product.shopperCurrencyProductPriceInfo) ? cartItem[0].product.shopperCurrencyProductPriceInfo.beforeDiscount.substring(3) : cartItem[0].product.shopperCurrencyProductPriceInfo.price.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemPriceInfoBeforeDiscount', Number(('beforeDiscount' in cartItem[0].product.retailerCurrencyProductPriceInfo) ? cartItem[0].product.retailerCurrencyProductPriceInfo.beforeDiscount.substring(3) : cartItem[0].product.retailerCurrencyProductPriceInfo.price.substring(3)));

        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDiscountsInfo', Number(('discountAmount' in cartItem[0].product.shopperCurrencyProductPriceInfo) ? cartItem[0].product.shopperCurrencyProductPriceInfo.discountAmount.substring(3) : '0'));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDiscountsInfo', Number(('discountAmount' in cartItem[0].product.retailerCurrencyProductPriceInfo) ? cartItem[0].product.retailerCurrencyProductPriceInfo.discountAmount.substring(3) : '0'));

        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemAdministration', Number(cartItem[0].retailerCurrencyItemAdministration.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemAdministration', Number(cartItem[0].shopperCurrencyItemAdministration.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDuty', Number(cartItem[0].retailerCurrencyItemDuty.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDuty', Number(cartItem[0].shopperCurrencyItemDuty.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswHSCode', cartItem[0].product.hsCode);
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemOtherTaxes', Number(cartItem[0].retailerCurrencyItemOtherTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemOtherTaxes', Number(cartItem[0].shopperCurrencyItemOtherTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemSubTotal', Number(cartItem[0].retailerCurrencyItemSubTotal.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemPriceInfo', Number(cartItem[0].product.retailerCurrencyProductPriceInfo.price.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemSubTotal', Number(cartItem[0].shopperCurrencyItemSubTotal.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemPriceInfo', Number(cartItem[0].product.shopperCurrencyProductPriceInfo.price.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDelivery', Number(cartItem[0].retailerCurrencyItemDelivery.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDelivery', Number(cartItem[0].shopperCurrencyItemDelivery.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDeliveryDuty', Number(cartItem[0].retailerCurrencyItemDeliveryDuty.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDeliveryDuty', Number(cartItem[0].shopperCurrencyItemDeliveryDuty.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemDeliveryTaxes', Number(cartItem[0].retailerCurrencyItemDeliveryTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemDeliveryTaxes', Number(cartItem[0].shopperCurrencyItemDeliveryTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemUplift', Number(cartItem[0].retailerCurrencyItemUplift.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemUplift', Number(cartItem[0].shopperCurrencyItemUplift.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCurrencyItemTaxes', Number(cartItem[0].retailerCurrencyItemTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCurrencyItemTaxes', Number(cartItem[0].shopperCurrencyItemTaxes.substring(3)));
        this.checkAndSetOrderCustomAttribute(lineItem, 'eswReturnProhibited', cartItem[0].product.isReturnProhibited);
        // Storing CoD attributes
        if (!empty(cartItem[0].retailerCurrencyItemCashOnDelivery)) {
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCashOnDeliveryFeeCurrency', !empty(cartItem[0].retailerCurrencyItemCashOnDelivery) ? cartItem[0].retailerCurrencyItemCashOnDelivery.substring(0, 3) : '');
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCashOnDeliveryFee', !empty(cartItem[0].retailerCurrencyItemCashOnDelivery) ? Number(cartItem[0].retailerCurrencyItemCashOnDelivery.substring(3)) : 0);
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCashOnDeliveryFeeCurrency', !empty(cartItem[0].shopperCurrencyItemCashOnDelivery) ? cartItem[0].shopperCurrencyItemCashOnDelivery.substring(0, 3) : '');
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCashOnDeliveryFee', !empty(cartItem[0].shopperCurrencyItemCashOnDelivery) ? Number(cartItem[0].shopperCurrencyItemCashOnDelivery.substring(3)) : 0);
        }
        // Storing CoD Tax attributes
        if (!empty(cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes)) {
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCashOnDeliveryTaxFeeCurrency', !empty(cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes) ? cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes.substring(0, 3) : '');
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswRetailerCashOnDeliveryTaxFee', !empty(cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes) ? Number(cartItem[0].retailerCurrencyItemCashOnDeliveryTaxes.substring(3)) : 0);
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCashOnDeliveryTaxFeeCurrency', !empty(cartItem[0].shopperCurrencyItemCashOnDeliveryTaxes) ? cartItem[0].shopperCurrencyItemCashOnDeliveryTaxes.substring(0, 3) : '');
            this.checkAndSetOrderCustomAttribute(lineItem, 'eswShopperCashOnDeliveryTaxFee', !empty(cartItem[0].shopperCurrencyItemCashOnDeliveryTaxes) ? Number(cartItem[0].shopperCurrencyItemCashOnDeliveryTaxes.substring(3)) : 0);
        }
        lineItem.custom.eswFulfilmentCountryIso = !empty(cartItem[0].fulfilmentCountryIso) ? cartItem[0].fulfilmentCountryIso : '';
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
        this.checkAndSetOrderCustomAttribute(order, 'eswShopperCurrencyOrderDiscountsInfo', eswShopperCurrencyOrderDiscountsInfo);
        this.checkAndSetOrderCustomAttribute(order, 'eswRetailerCurrencyOrderDiscountsInfo', eswRetailerCurrencyOrderDiscountsInfo);
        return {
            eswShopperCurrencyOrderDiscountsInfo: eswShopperCurrencyOrderDiscountsInfo,
            eswRetailerCurrencyOrderDiscountsInfo: eswRetailerCurrencyOrderDiscountsInfo
        };
    },
    /**
     * Process order confirmation for Konbini orders, function must be wrap in Transaction
     * @param {Object} ocPayload - Order confirmation payload for v2 and v3
     * @param {dw.order} dwOrder - SFCC Order Object
     * @param {string} totalCheckoutAmount - Total shopper currency amount of order
     * @param {string} paymentCardBrand - Payment Card Brand
     * @returns {boolean} - true/false
     */
    processKonbiniOrderConfirmation: function (ocPayload, dwOrder, totalCheckoutAmount, paymentCardBrand) {
        let isKonbiniOrder = false;
        if (empty(ocPayload)) {
            return false;
        }

        if ('cartItems' in ocPayload) { // OC response for v2
            isKonbiniOrder = !empty(ocPayload.paymentIsOverCounter) && ocPayload.paymentIsOverCounter;
        } else {  // OC response for v3
            isKonbiniOrder = !empty(ocPayload.paymentDetails) && ocPayload.paymentDetails.isOverCounter;
        }

        if (isKonbiniOrder) {
            dwOrder.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
            dwOrder.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
            dwOrder.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            dwOrder.custom.eswOverTheCounterPayloadJson = JSON.stringify(ocPayload);
            this.updateEswPaymentAttributes(dwOrder, totalCheckoutAmount, paymentCardBrand, ocPayload);
        }
        return isKonbiniOrder;
    }
};

module.exports = {
    getEswOcHelper: function () {
        return getEswOcHelper;
    }
};
