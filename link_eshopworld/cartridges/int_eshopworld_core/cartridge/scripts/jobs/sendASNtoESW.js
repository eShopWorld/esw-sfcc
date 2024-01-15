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
     * @returns {Object} - The request object piece representing the product line items
     */
    getPackageItems: function (shipment, orderShopperCurrency) {
        let packageItems = [];
        let lineItemCtnr = 1;
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

        return packageItems;
    },
    /**
     * Helper to prepare the ASN request object
     *
     * @param {dw.order.Order} order The order to transmit data for
     * @param {Object} shipment - The tracking number and shipment info to use
     * @returns {Object} The request object to send to Esw Package API
     */
    prepareAdvancedShippingNotification: function (order, shipment) {
        let requestObj = {
            brandCode: Site.getCustomPreferenceValue('eswRetailerBrandCode'),
            orderReference: order.orderNo,
            packageReference: (shipment.trackingNumber) ? shipment.trackingNumber : order.orderNo,
            parentOrderReference: order.orderNo,
            consignee: this.getConsigneeInfo(shipment, order.customerEmail),
            shippingInfo: this.getShippingInfo(order),
            packageItems: this.getPackageItems(shipment, order.custom.eswShopperCurrencyCode),
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
        return requestObj;
    },
    /**
     * Sends the Advanced Shipping Notification to eShopworld
     *
     * @param {dw.order.Order} order The order to transmit data for
     * @returns {Array<Object>} Results of each tracking number exported.
     */
    sendASNForPackage: function (order) {
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

            let requestBody = this.prepareAdvancedShippingNotification(order, order.defaultShipment);

            let response = asnService.call({
                eswOAuthToken: JSON.parse(oAuthResult.object).access_token,
                requestBody: JSON.stringify(requestBody)
            });
            return response;
        } catch (e) {
            Logger.error('ASN service call error: {0}', e.message);
            return new Status(Status.ERROR);
        }
    }
};

/**
 * Script file for executing Package Feed and
 * Send Advanced Shipping Notification of shipped orders to ESW
 * @return {boolean} - returns execute result
 */
function execute() {
    let orders = OrderMgr.searchOrders(
        'shippingStatus = {0} AND (custom.eswShopperCurrencyCode != null) AND (custom.eswReceivedASN = null OR custom.eswReceivedASN = false)',
        'creationDate desc',
        dw.order.Order.SHIPPING_STATUS_SHIPPED
    );
    try {
        let order;
        while (orders.hasNext()) {
            order = orders.next();
            if (!empty(order.orderNo)) {
                let result = asnUtils.sendASNForPackage(order);
                if (result && result.status === 'OK') {
                    let responseObj = JSON.parse(result.object);
                    if (responseObj.outcome.equalsIgnoreCase('PackageCreated')) {
                        Transaction.begin();
                        order.custom.eswPackageReference = responseObj.package.eShopPackageReference.toString();
                        order.custom.eswTrackingURL = responseObj.package.trackingUrl;
                        order.custom.eswReceivedASN = true;
                        Transaction.commit();
                        Logger.info('ASN successfully transmitted for order: {0}', order.orderNo);
                    } else {
                        Logger.error('ASN package not created for order: {0} - {1} - Bad Request.', order.orderNo, responseObj.outcome);
                    }
                } else {
                    Logger.error('ASN transmission failed for order: {0}: {1}', order.orderNo, result.errorMessage);
                }
            } else {
                Logger.error('ASN can not be transmitted for order {0} as default shipment tracking number for this order is empty.', order.orderNo);
            }
        }
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('ASN service call failed: {0}: {1}', e.message, e.stack);
        return new Status(Status.ERROR);
    }
}

exports.execute = execute;
