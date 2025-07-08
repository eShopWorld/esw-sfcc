'use strict';
const base = module.superModule;


const collections = require('*/cartridge/scripts/util/collections');
const ShippingMgr = require('dw/order/ShippingMgr');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

/**
 * Sets the shipping method of the basket's default shipment
 * @param {dw.order.Shipment} shipment - Any shipment for the current basket
 * @param {string} shippingMethodID - The shipping method ID of the desired shipping method
 * @param {dw.util.Collection} shippingMethods - List of applicable shipping methods
 * @param {Object} address - the address
 */
function selectShippingMethod(shipment, shippingMethodID, shippingMethods, address) {
    let BasketMgr = require('dw/order/BasketMgr');
    let currentBasket = BasketMgr.getCurrentBasket();
    let applicableShippingMethods;
    let defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
    let shippingAddress;

    if (address && shipment) {
        shippingAddress = shipment.shippingAddress;

        if (shippingAddress) {
            if (address.stateCode && shippingAddress.stateCode !== address.stateCode) {
                shippingAddress.stateCode = address.stateCode;
            }
            if (address.postalCode && shippingAddress.postalCode !== address.postalCode) {
                shippingAddress.postalCode = address.postalCode;
            }
        }
    }

    let isShipmentSet = false;

    if (shippingMethods) {
        applicableShippingMethods = shippingMethods;
    } else {
        let shipmentModel = ShippingMgr.getShipmentShippingModel(shipment);
        applicableShippingMethods = address ? shipmentModel.getApplicableShippingMethods(address) :
            shipmentModel.applicableShippingMethods;
    }

    if (shippingMethodID) {
        // loop through the shipping methods to get shipping method
        let iterator = applicableShippingMethods.iterator();
        while (iterator.hasNext()) {
            let shippingMethod = iterator.next();
            if (shippingMethod.ID === shippingMethodID) {
                shipment.setShippingMethod(shippingMethod);
                isShipmentSet = true;
                /* Custom Start: esw customization */
                eswHelper.adjustThresholdDiscounts(currentBasket);
                /* Custom End: esw customization */
                break;
            }
        }
    }

    if (!isShipmentSet) {
        if (collections.find(applicableShippingMethods, function (sMethod) {
            return sMethod.ID === defaultShippingMethod.ID;
        })) {
            shipment.setShippingMethod(defaultShippingMethod);
            /* Custom Start: esw customization */
            eswHelper.adjustThresholdDiscounts(currentBasket);
            /* Custom End: esw customization */
        } else if (applicableShippingMethods.length > 0) {
            let firstMethod = base.getFirstApplicableShippingMethod(applicableShippingMethods, true);
            shipment.setShippingMethod(firstMethod);
            /* Custom Start: esw customization */
            eswHelper.adjustThresholdDiscounts(currentBasket);
            /* Custom End: esw customization */
        } else {
            shipment.setShippingMethod(null);
        }
    }
}

base.selectShippingMethod = selectShippingMethod;
module.exports = base;
