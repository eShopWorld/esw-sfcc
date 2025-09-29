'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Order = require('dw/order/Order');

const Constants = require('*/cartridge/scripts/util/Constants');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
/**
 * Calculates the number of days between two dates.
 * @param {string} fromDate - The start date in string format.
 * @param {string} toDate - The end date in string format.
 * @returns {number} - The number of days between the two dates.
 */
function countDaysBetween(fromDate, toDate) {
    // Parse the dates
    let startDate = new Date(fromDate);
    let endDate = new Date(toDate);

    // Calculate the difference in milliseconds
    let timeDifference = endDate - startDate;

    // Convert milliseconds to days
    let daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    return daysDifference;
}

/**
 * get mapped service response for getting packages from ESW
 * @param {string} fromDate - start date
 * @param {string} toDate - end date
 * @returns {Object} - response object
 * @throws {Error} - throws error if any
 **/
function getPkgInfoFromEsw(fromDate, toDate) {
    let startDate = fromDate.replace('T', ' ').replace('Z', '');
    let endDate = toDate.replace('T', ' ').replace('Z', '');
    if (countDaysBetween(startDate, endDate) > Constants.pkgAsnMaxDays) {
        throw new Error('Date range should not be more than ' + Constants.pkgAsnMaxDays + ' days');
    }
    let eswServices = require('*/cartridge/scripts/services/EswCoreService').getEswServices();
    let oAuthObj = eswServices.getOAuthService();
    let asnService = eswServices.getAsnServiceForEswToSfcc();

    let formData = {
        grant_type: 'client_credentials',
        scope: 'logistics.package.api.all'
    };
    formData.client_id = eswHelper.getClientID();
    formData.client_secret = eswHelper.getClientSecret();

    let oAuthResult = oAuthObj.call(formData);
    if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
        throw new Error('ESW Service Error: ' + oAuthResult.errorMessage);
    }

    let requestBody = {
        FromDate: (encodeURIComponent(startDate)),
        ToDate: (encodeURIComponent(endDate))
    };
    let asnResponse = asnService.call({
        eswOAuthToken: JSON.parse(oAuthResult.object).access_token,
        requestBody: requestBody
    });
    if (asnResponse.isOk() || !empty(asnResponse.object)) {
        return asnResponse.object.packages;
    }
    return null;
}

/**
 * Sets default dates if startDate or endDate are not provided.
 * @param {string} startDate - The start date.
 * @param {string} endDate - The end date.
 * @returns {Object} - An object containing the startDate and endDate.
 */
function setPkgAsnDates(startDate, endDate) {
    let today = new Date();
    let pkgAsnMaxDays = Constants.pkgAsnMaxDays;

    // If both startDate and endDate are empty
    if (!startDate && !endDate) {
        endDate = today;
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - pkgAsnMaxDays);
    } else if (startDate && !endDate) {
        // If endDate is empty and startDate is not empty
        startDate = new Date(startDate);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + pkgAsnMaxDays);
        if (endDate > today) {
            endDate = today;
        }
    } else if (!startDate && endDate) {
        // If startDate is empty and endDate is not empty
        endDate = new Date(endDate);
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - pkgAsnMaxDays);
    }

    return {
        startDate: startDate,
        endDate: endDate
    };
}
/**
 * Function to map the second object to the desired format
 * @param {Object} packageData - packageData
 * @return {Object} packageData - returns object
 */
function formatTrackingData(packageData) {
    try {
        return ('packageItems' in packageData && Array.isArray(packageData.packageItems))
            ? packageData.packageItems.map(function (item) {
                let lineItemDetail = {
                    name: 'productDescription' in item && !empty(item.productDescription) ? item.productDescription : '',
                    price: 'unitPrice' in item && !empty(item.unitPrice) ? item.unitPrice : 0,
                    currency: 'unitPriceCurrency' in item && !empty(item.unitPriceCurrency) ? item.unitPriceCurrency : ''
                };

                if ('image' in item && !empty(item.image)) {
                    lineItemDetail.productImage = item.image;
                }
                if ('color' in item && !empty(item.color)) {
                    lineItemDetail.color = item.color;
                }
                if ('size' in item && !empty(item.size)) {
                    lineItemDetail.size = item.size;
                }

                return {
                    productLineItem: 'productCode' in item && !empty(item.productCode) ? item.productCode : '',
                    lineItemDetail: lineItemDetail,
                    carriedReference: 'packageReference' in packageData && !empty(packageData.packageReference) ? packageData.packageReference : '',
                    trackingUrl: 'trackingUrl' in packageData && !empty(packageData.trackingUrl) ? packageData.trackingUrl : '',
                    qty: 'quantity' in item && !empty(item.quantity) ? item.quantity : '',
                    trackingNumber: 'eShopPackageReference' in packageData && !empty(packageData.eShopPackageReference) ? packageData.eShopPackageReference : ''
                };
            })
            : [];
    } catch (error) {
        Logger.error('GET Pkg filtered response failed: {0}: {1}', error.message, error.stack);
    }
    return null;
}
/**
 * update lineitem qty
 * @param {Array} productLineItems - Array of product line items.
 * @param {Array} uniqueKeyQty - uniqueKeyQty.
 * @param {number} qty - qty.
 */
function updateItemQty(productLineItems, uniqueKeyQty, qty) {
    for (let index = 0; index < productLineItems.length; index++) {
        let element = productLineItems[index];
        if (element.carriedReference === uniqueKeyQty) {
            element.qty = qty;
            break;
        }
    }
}
/**
 * Removes duplicate product line items based on the productLineItem property.
 * @param {Array} productLineItems - Array of product line items.
 * @returns {Array} - Array of unique product line items.
 */
function removeDuplicates(productLineItems) {
    let seen = {};
    return productLineItems.filter(function (item) {
        const uniqueKeyQty = item.carriedReference;
        const uniqueKey = item.productLineItem + '_' + item.carriedReference;
        if (seen[uniqueKey]) {
            if (seen[uniqueKeyQty] < item.qty) {
                updateItemQty(productLineItems, uniqueKeyQty, item.qty);
            }
            return false;
        } else {
            seen[uniqueKey] = true;
            seen[uniqueKeyQty] = item.qty;
            return true;
        }
    });
}
/**
 * Retrieves the product line item IDs from an order.
 * @param {dw.order.Order} order - The order object.
 * @returns {Array} - An array of product line item IDs.
 */
function getOrderPliIds(order) {
    let orderPliIds = [];
    let orderPlis = order.getAllProductLineItems();
    if (!empty(orderPlis)) {
        let orderPlisItr = orderPlis.iterator();
        while (orderPlisItr.hasNext()) {
            let orderPli = orderPlisItr.next();
            orderPliIds.push({ id: orderPli.getProductID(), qty: orderPli.getQuantityValue() });
        }
    }
    return orderPliIds;
}
/**
 * Checks if all values from arrayA are present in arrayB.
 * @param {Array} arrayA - The array containing values to check.
 * @param {Array} arrayB - The array to check against.
 * @returns {boolean} - True if all values in arrayA are in arrayB, false otherwise.
 */
function areAllValuesInArray(arrayA, arrayB) {
    let valuesInB = {};
    for (let i = 0; i < arrayB.length; i++) {
        valuesInB[arrayB[i].id] = arrayB[i].qty;
    }

    for (let j = 0; j < arrayA.length; j++) {
        const { id, qty } = arrayA[j];
        if (!valuesInB[id] || valuesInB[id] < qty) {
            return false;
        }
    }

    return true;
}

/**
 * Checks if all values from array object match make them combined
 * @param {Array} array - The array containing values to check.
 * @returns {Array} array - combined array
 */
function combineDuplicateIds(array) {
    let combined = {};
    let result = [];
    let seenIds = [];

    for (let i = 0; i < array.length; i++) {
        let item = array[i];
        if (combined[item.id]) {
            combined[item.id].qty += item.qty;
        } else if ('productLineItem' in item) {
            if (combined[item.productLineItem]) {
                combined[item.productLineItem].qty += item.qty;
            } else {
                combined[item.productLineItem] = item;
            }
        } else {
            combined[item.id] = { id: item.id, qty: item.qty };
        }
    }

    for (let i = 0; i < array.length; i++) {
        let item = array[i];

        if ('productLineItem' in item) {
            if (seenIds.indexOf(item.productLineItem) === -1) {
                if (combined[item.productLineItem]) {
                    result.push(combined[item.productLineItem]);
                    seenIds.push(item.productLineItem);
                    delete combined[item.productLineItem];
                } else {
                    result.push(item);
                    seenIds.push(item.productLineItem);
                }
            }
        } else {
            // eslint-disable-next-line no-lonely-if
            if (seenIds.indexOf(item.id) === -1) {
                if (combined[item.id]) {
                    result.push(combined[item.id]);
                    seenIds.push(item.id);
                    delete combined[item.id];
                } else {
                    result.push(item);
                    seenIds.push(item.id);
                }
            }
        }
    }

    return result;
}
/**
 * Define a named function to extract productLineItem
 * @param {Object} pkgObj - pkgObj
 * @return {string} - id
 */
function getProductLineItem(pkgObj) {
    return { id: pkgObj.productLineItem, qty: pkgObj.qty };
}
/**
 * Job step to get ASN from ESW within a specified date range.
 * @param {Object} args - job parameters
 * @return {boolean} - returns execute result
 */
function execute(args) {
    try {
        let filteredPackageResponseJson = [];
        let startDate = args.startDate;
        let endDate = args.endDate;
        let searchDates = setPkgAsnDates(startDate, endDate);
        startDate = searchDates.startDate;
        endDate = searchDates.endDate;
        let pkgResponse = getPkgInfoFromEsw(startDate.toISOString(), endDate.toISOString());
        if (!empty(pkgResponse)) {
            Transaction.wrap(function () {
                for (let i = 0; i < pkgResponse.length; i++) {
                    let pkg = pkgResponse[i];
                    let filteredPackageResponse = formatTrackingData(pkg);
                    let order = OrderMgr.getOrder(pkg.orderReference);
                    let pkgPliIds = [];
                    if (!empty(order) && !empty(filteredPackageResponse)) {
                        filteredPackageResponse = combineDuplicateIds(filteredPackageResponse);
                        let orderPliIds = getOrderPliIds(order);
                        if ('eswPackageJSON' in order.custom && !empty(order.custom.eswPackageJSON)) {
                            filteredPackageResponseJson = JSON.parse(order.custom.eswPackageJSON);
                        } else {
                            filteredPackageResponseJson = [];
                        }
                        if (Array.isArray(filteredPackageResponse)) {
                            // eslint-disable-next-line no-loop-func
                            filteredPackageResponse.forEach(function (pkgObj) {
                                filteredPackageResponseJson.push(pkgObj);
                            });
                        }
                        let filteredPkgJsonRes = removeDuplicates(filteredPackageResponseJson);
                        order.custom.eswPackageJSON = JSON.stringify(filteredPkgJsonRes);
                        pkgPliIds = filteredPkgJsonRes.map(getProductLineItem);
                        order.custom.eswReceivedASN = areAllValuesInArray(orderPliIds, combineDuplicateIds(pkgPliIds));
                        if ('eswReceivedASN' in order.custom && order.custom.eswReceivedASN === true) {
                            order.shippingStatus = Order.SHIPPING_STATUS_SHIPPED;
                        }
                    }
                }
            });
        }
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('GET Pkg ASN service call failed: {0}: {1}', e.message, e.stack);
        eswHelper.eswInfoLogger('getASNFromESW Error', e, e.message, e.stack);
        return new Status(Status.ERROR);
    }
}

exports.execute = execute;
