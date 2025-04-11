'use strict';

/* API Includes */
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Site = require('dw/system/Site').getCurrent();
const Status = require('dw/system/Status');

const asnUtils = {
    /**
     * Helper to prepare the consignee info
     * @param {Object} shipment - The order shipment to transmit data for
     * @param {string} consigneeEmail - The email id of order consignee
     * @returns {Object} - The request object piece representing the information of consignee
     */
    getConsigneeInfo: function (shipment, consigneeEmail) {
        let consigneeInfo = shipment.shippingAddress;
        return {
            firstName: consigneeInfo.firstName,
            lastName: consigneeInfo.lastName,
            address1: consigneeInfo.address1,
            address2: consigneeInfo.address2,
            city: consigneeInfo.city,
            postalCode: consigneeInfo.postalCode,
            country: consigneeInfo.countryCode.value,
            email: consigneeEmail,
            telephone: consigneeInfo.phone,
            address3: '',
            poBox: '',
            region: '',
            gender: '',
            unit: ''
        };
    },
    /**
     * Helper to prepare the package weight
     *
     * @returns {Object} - The request object piece representing the package weight
     */
    getWeightInfo: function () {
        return {
            weight: 1.0,
            weightUnit: 'LB'
        };
    },
    /**
     * Helper to prepare the dimension data
     *
     * @returns {Object} - The request object piece representing the product dimensions
     */
    getDimensionInfo: function () {
        return {
            dimHeight: '',
            dimLength: '',
            dimWidth: '',
            dimWeight: '',
            dimMeasurementUnit: 'INCH'
        };
    },
    /**
     * Helper to prepare the shipping cost object
     *
     * @param {dw.order.Order} order - The order to transmit data for
     * @returns {Object} - The request object piece representing the shipping cost
     */
    getShippingInfo: function (order) {
        return {
            amount: Number(order.custom.eswShopperCurrencyDeliveryPriceInfo),
            currency: order.custom.eswShopperCurrencyCode
        };
    },
    /**
     * Helper to prepare the package items
     *
     * @param {Object} shipment - The order shipment to transmit data for
     * @param {Object} orderShopperCurrency - The order shopper currency
     * @param {number} lineItemCtnr - The line item counter
     * @returns {Object} - The request object piece representing the product line items
     */
    getPackageItems: function (shipment, orderShopperCurrency, lineItemCtnr) {
        let packageItems = [];
        let productLineItems = shipment.productLineItems.iterator();

        while (productLineItems.hasNext()) {
            let productLineItem = productLineItems.next();

            let itemObj = {
                productCode: productLineItem.productID,
                lineItemId: lineItemCtnr++,
                Quantity: productLineItem.quantity.value,
                productDescription: productLineItem.productName,
                weight: this.getWeightInfo(productLineItem),
                unitPrice: {
                    amount: productLineItem.custom.eswShopperCurrencyItemPriceInfo,
                    currency: orderShopperCurrency
                },
                hSCode: productLineItem.custom.eswHSCode,
                fta: false,
                dangerousGoods: false,
                productCustomsDescription: '',
                countryOfOrigin: '',
                serialNumber: '',
                warrantyId: ''
            };

            packageItems.push(itemObj);
        }

        return { packageItems, lineItemCtnr };
    },
    /**
     * Helper to prepare the ASN request object
     *
     * @param {dw.order.Order} order The order to transmit data for
     * @param {Object} shipment - The tracking number and shipment info to use
     * @param {number} lineItemCtnr - The line item counter
     * @returns {Object} The request object to send to Esw Package API
     */
    prepareAdvancedShippingNotification: function (order, shipment, lineItemCtnr) {
        let packageItemsResult = this.getPackageItems(shipment, order.custom.eswShopperCurrencyCode, lineItemCtnr);
        let requestObj = {
            brandCode: Site.getCustomPreferenceValue('eswRetailerBrandCode'),
            orderReference: order.orderNo,
            packageReference: !empty(shipment.trackingNumber) ? shipment.trackingNumber : shipment.ID,
            parentOrderReference: order.orderNo,
            consignee: this.getConsigneeInfo(shipment, order.customerEmail),
            shippingInfo: this.getShippingInfo(order),
            packageItems: packageItemsResult.packageItems,
            weight: this.getWeightInfo(order),
            dimensions: this.getDimensionInfo(order),
            serviceLevel: order.custom.eswDeliveryOption,
            orderType: 'CHECKOUT',
            shippingStatus: 'Shipped',
            isBackOrder: false,
            dangerousGoods: false,
            shippingDocumentationRequested: false,
            returnDocumentationRequested: false,
            additionalImportInformation: '',
            goodsDescription: '',
            carrierId: 123,
            carrierReference: '',
            distributionCentre: '',
            additionalCarrierData: {},
            palletId: '',
            metadata: {}
        };
        return { requestObj, lineItemCtnr: packageItemsResult.lineItemCtnr };
    },
    /**
     * Sends the Advanced Shipping Notification to eShopworld
     *
     * @param {dw.order.Order} order The order to transmit data for
     * @param {Object} shipment The shipment info to send
     * @param {number} lineItemCtnr - The line item counter
     * @returns {Array<Object>} Results of each tracking number exported.
     */
    sendASNForPackage: function (order, shipment, lineItemCtnr) {
        try {
            let eswServices = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
                eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper,
                oAuthObj = eswServices.getOAuthService(),
                asnService = eswServices.getPackageServiceV4();

            let formData = {
                grant_type: 'client_credentials',
                scope: 'logistics.package.api.all'
            };
            formData.client_id = eswHelper.getClientID();
            formData.client_secret = eswHelper.getClientSecret();

            let oAuthResult = oAuthObj.call(formData);
            if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
                Logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
                return new Status(Status.ERROR);
            }

            let shipmentParameter = !empty(shipment) ? shipment : order.defaultShipment;
            let requestBodyResult = this.prepareAdvancedShippingNotification(order, shipmentParameter, lineItemCtnr);

            let response = asnService.call({
                eswOAuthToken: JSON.parse(oAuthResult.object).access_token,
                requestBody: JSON.stringify(requestBodyResult.requestObj)
            });
            return { response, lineItemCtnr: requestBodyResult.lineItemCtnr };
        } catch (e) {
            Logger.error('ASN service call error: {0}', e.message);
            return new Status(Status.ERROR);
        }
    }
};

/**
 * Checks if ASN (Advanced Shipping Notice) export is enabled for the country associated with the order.
 * @param {dw.order.Order} order - The order object to check.
 * @returns {boolean} - Returns true if ASN export is enabled for the country, false otherwise.
 */
function isAsnExportEnabledForCountry(order) {
    try {
        let CustomObjectMgr = require('dw/object/CustomObjectMgr');
        let shippingAddress = order.defaultShipment.shippingAddress;
        let CountryCO = CustomObjectMgr.getCustomObject('ESW_COUNTRIES', shippingAddress.countryCode);
        if (!empty(CountryCO) && !empty(CountryCO.custom)) {
            let eswSynchronizePkgModel = Object.prototype.hasOwnProperty.call(CountryCO.custom, 'eswSynchronizePkgModel') ? CountryCO.custom.eswSynchronizePkgModel.value : 'sfccToEsw';
            return (eswSynchronizePkgModel === 'sfccToEsw');
        }
    } catch (error) {
        Logger.error('Error while fetching order country info error {0} {1}', error.message, error.stack);
    }
    return false;
}

/**
 * Script file for executing Package Feed and
 * Send Advanced Shipping Notification of shipped orders to ESW
 * @return {boolean} - returns execute result
 */
function execute() {
    let orders = OrderMgr.searchOrders(
        'shippingStatus = {0} AND (custom.eswShopperCurrencyCode != null) AND (custom.eswReceivedASN = null OR custom.eswReceivedASN = false) AND (custom.eswCreateOutboundShipment = null OR custom.eswCreateOutboundShipment = false)',
        'creationDate desc',
        dw.order.Order.SHIPPING_STATUS_SHIPPED
    );
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let order;
    let result;
    let isAsnExportEnabledOnCountry = false;
    try {
        while (orders.hasNext()) {
            order = orders.next();
            isAsnExportEnabledOnCountry = isAsnExportEnabledForCountry(order);
            if (!empty(order.orderNo)) {
                let lineItemCtnr = 1;
                if (eswHelper.isEswSplitShipmentEnabled() && order.shipments.length > 1) {
                    let packageJsonPayload = [];
                    let shipmentsItr = order.getShipments().iterator();
                    while (shipmentsItr.hasNext()) {
                        let shipment = shipmentsItr.next();
                        result = asnUtils.sendASNForPackage(order, shipment, lineItemCtnr);
                        lineItemCtnr = result.lineItemCtnr;
                        if (result.response && result.response.status === 'OK') {
                            let responseObj = JSON.parse(result.response.object);
                            if (responseObj.outcome && !empty(responseObj.outcome) && responseObj.outcome.toLowerCase() === 'packagecreated') {
                                Transaction.begin();
                                if (!empty(order.custom.eswPackageJSON)) {
                                    packageJsonPayload = JSON.parse(order.custom.eswPackageJSON);
                                }
                                for (let i = 0; i < responseObj.package.packageItems.length; i++) {
                                    packageJsonPayload.push({
                                        productLineItem: responseObj.package.packageItems[i].productCode,
                                        quantity: responseObj.package.packageItems[i].quantity,
                                        carrierReference: responseObj.package.carrierReference,
                                        trackingUrl: responseObj.package.trackingUrl
                                    });
                                }
                                order.custom.eswPackageJSON = JSON.stringify(packageJsonPayload);
                                order.custom.eswReceivedASN = !shipmentsItr.hasNext(); // set to true only if all shipments are processed successfully
                                Transaction.commit();
                                Logger.info('ASN successfully transmitted for order: {0} - Shipment {1}', order.orderNo, shipment.ID);
                            } else {
                                Logger.error('ASN package not created for order: {0} - Shipment {1} - {2} - Bad Request.', order.orderNo, shipment.ID, responseObj.outcome);
                            }
                        } else {
                            Logger.error('ASN transmission failed for order: {0} - Shipment {1} - {2}.', order.orderNo, shipment.ID, result.response.errorMessage);
                        }
                    }
                } else if (isAsnExportEnabledOnCountry) {
                    result = asnUtils.sendASNForPackage(order, null, lineItemCtnr);
                    if (result && result.response.status === 'OK') {
                        let responseObj = JSON.parse(result.response.object);
                        if (responseObj.outcome && !empty(responseObj.outcome) && responseObj.outcome.toLowerCase() === 'packagecreated') {
                            Transaction.begin();
                            order.custom.eswPackageReference = responseObj.package.eShopPackageReference.toString();
                            order.custom.eswTrackingURL = responseObj.package.trackingUrl;
                            order.custom.eswReceivedASN = true;
                            Transaction.commit();
                            Logger.info('ASN successfully transmitted for order: {0}', order.orderNo);
                        }
                    } else {
                        Logger.error('ASN transmission failed for order: {0}: {1}', order.orderNo, result.response.errorMessage);
                    }
                }
            } else if (!isAsnExportEnabledForCountry(order)) {
                Logger.error('ASN can not be transmitted for order {0} as ASN Exports are not enabled for this country', order.orderNo);
            } else {
                Logger.error('ASN can not be transmitted for order {0} as default shipment tracking number for this order.', order.orderNo);
            }
        }
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('ASN service call failed: {0}: {1}', e.message, e.stack);
        return new Status(Status.ERROR);
    }
}

module.exports = {
    execute: execute,
    getSendASNtoESWUtils: asnUtils
};
