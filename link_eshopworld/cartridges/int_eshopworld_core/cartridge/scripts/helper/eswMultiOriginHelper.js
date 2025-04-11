'use strict';
const ProductMgr = require('dw/catalog/ProductMgr');

/**
 * Function to get the master product from a variant product
 * @param {dw.catalog.Product} dwProduct - The product
 * @returns {string|null} - product origin or null
 */
function getOriginFromProductAttribute(dwProduct) {
    let masterProduct = null;
    let productOrigin = dwProduct.custom.eswFulfilmentCountryIso;
    // Check if the product is a variant
    if (dwProduct.isVariant() && empty(productOrigin)) {
        // Get the master product
        masterProduct = dwProduct.getMasterProduct();
        productOrigin = masterProduct.custom.eswFulfilmentCountryIso;
    }
    return productOrigin;
}


/**
 * Get non origin product IDs from the multi-origin response object.
 * @param {Object[]} multiOriginResponseObj - The multi-origin response object.
 * @return {string[]} - An array of product IDs.
 */
function getNonOriginProductIds(multiOriginResponseObj) {
    let productIds = [];
    for (let i = 0; i < multiOriginResponseObj.length; i++) {
        if (!empty(multiOriginResponseObj[i].productId)
            && !productIds.includes(multiOriginResponseObj[i].productId)
            && empty(multiOriginResponseObj[i].originIso)) {
            productIds.push(multiOriginResponseObj[i].productId);
        }
    }
    return productIds;
}

/**
 * Update multiOriginResponse based on productId variant, fallback to master if attribute not found.
 * @param {Array} multiOriginResponse - The array of multi-origin response objects.
 * @param {dw.catalog.Product} product - The product.
 * @param {Object} originIsoValue - The originIso to be update.
 * @return {Array} - The updated multiOriginResponse array.
 */
function updateMultiOriginIsoInFromProductAttribute(multiOriginResponse, product, originIsoValue) {
    for (let i = 0; i < multiOriginResponse.length; i++) {
        if (multiOriginResponse[i].productId === product.getID()) {
            multiOriginResponse[i].originIso = originIsoValue;
            // As product is not availble in multi origin so check and get quantity from SFCC inventory
            multiOriginResponse[i].quantity = Math.min(multiOriginResponse[i].quantity, product.availabilityModel.inventoryRecord.ATS.value);
        }
    }
    return multiOriginResponse;
}

/**
 * Generate a random alpha string.
 * @returns {string} - The generated random alpha string.
 */
function generateRandomAlphaString() {
    let sampleOriginIso = ['GB', 'FR', 'IE'];
    const randomIndex = Math.floor(Math.random() * sampleOriginIso.length);
    return sampleOriginIso[randomIndex];
}

/**
 * Get the test output from a file.
 * @returns {dw.io.FileReader} - The FileReader object.
 */
function getTestOutputFromFile() {
    const FileReader = require('dw/io/FileReader');
    const File = require('dw/io/File');
    try {
        let testingScenario = new FileReader(new File(File.IMPEX + '/src/ESW/mo_tests.json'), 'UTF-8').readString();
        return testingScenario;
    } catch (e) {
        return null;
    }
}

/**
  * Return the origin and inventory information against products
  * @param {Object} productWithQuantities - productWithQuantities - { productId: productId, quantity: totalQtyRequested }
  * @param {string} shopperCountryIso - shopperCountryIso e.g. "IE"
  * @return {Object} - productOriginDetails object
  */
function getProductOriginDetails(productWithQuantities) {
    // Retailer's Logic to retrieve origin country information for each product
    // ...

    /** *******If the required quantity isn’t available at one location*********/
    // In cases where the required quantity exceeds availability in one location,
    // the remainder is sourced from alternative locations (see productId: pid1)

    /** *******If the originIso is not available for a product*********/
    // If a product lacks an origin, retailer will set originIso to NULL
    // ESW cartridge will check product level attribute "eswFulfilmentCountryIso"
    // and Add originIso from this attribute if availble, (See productId: 'pid3')

    /** **************************Function's Output****************************/
    // The function returns an object with product ids, origins and quantities or empty array ([])
    // return [
    //     { productId: 'pid1', originIso: 'IE', quantity: 2 },
    //     { productId: 'pid1', originIso: 'FR', quantity: 3 },
    //     { productId: 'pid2', originIso: 'UK', quantity: 6 },
    //     { productId: 'pid3', originIso: NULL, quantity: 2 }
    // ] | [];

    let multiOriginResponse = [];
    let testingScenario = getTestOutputFromFile();

    switch (testingScenario) {
        case 'MULTI_LOCATION':
            for (let i = 0; i < productWithQuantities.quantity; i++) {
                multiOriginResponse.push({ productId: productWithQuantities.productId, originIso: generateRandomAlphaString(), quantity: 1 });
            }
            break;
        case 'SINGLE_LOCATION':
            multiOriginResponse = [
                    { productId: productWithQuantities.productId, originIso: generateRandomAlphaString(), quantity: productWithQuantities.quantity }
            ];
            break;
        default:
            for (let i = 0; i < productWithQuantities.quantity; i++) {
                multiOriginResponse.push({ productId: productWithQuantities.productId, originIso: null, quantity: 1 });
            }
    }

    // If the originIso is not available for products
    let nonOriginProductIds = getNonOriginProductIds(multiOriginResponse);
    for (let i = 0; i < nonOriginProductIds.length; i++) {
        let nonOriginDwProduct = ProductMgr.getProduct(nonOriginProductIds[i]);
        // Check, If the product has eswFulfilmentCountryIso attribute
        let nonOriginProductOrigin = getOriginFromProductAttribute(nonOriginDwProduct);
        if (nonOriginProductOrigin) {
            multiOriginResponse = updateMultiOriginIsoInFromProductAttribute(multiOriginResponse, nonOriginDwProduct, nonOriginProductOrigin);
        }
    }
    // Since we require fulfilemnt country so if its not available then consider item quantity to be 0
    return multiOriginResponse.map(function (item) {
        if (item.originIso === null) {
            item.quantity = 0;
        }
        return item;
    });
}

/**
 * Calculate the total inventory from a multi-origin response object.
 * @param {Object[]} multiOriginResponseObj - The multi-origin response object.
 * @param {string} productId - product id
 * @return {number} - The inventory sum number.
 */
function getInventoryAtsFromMultiOriginResponse(multiOriginResponseObj, productId) {
    let totalQuantity = 0;
   // Filter the data to include only the objects with the specified product ID
    for (let i = 0; i < multiOriginResponseObj.length; i++) {
        if (multiOriginResponseObj[i].productId === productId) {
            totalQuantity += multiOriginResponseObj[i].quantity;
        }
    }
    return totalQuantity;
}


/**
 * Check if a product is available in the multi-origin response object.
 * @param {Object[]} multiOriginResponseObj - The multi-origin response object.
 * @param {string} productId - The product ID to check.
 * @return {boolean} - True if the product is available, false otherwise.
 */
function isProductAvailableInMultiOrigin(multiOriginResponseObj, productId) {
    return multiOriginResponseObj.some(function (item) {
        return item.productId === productId;
    });
}

/**
 * Get the UUIDs of grouped product line items by product ID.
 * @param {string} productId - The product ID.
 * @param {Object} currentBasketPlis - The current basket PLIs.
 * @returns {string[]} - An array of UUIDs.
 */
function getGroupedPlisUuidByPid(productId, currentBasketPlis) {
    let uuids = [];
    for (let i = 0; i < currentBasketPlis.length; i++) {
        uuids.push(currentBasketPlis[i].UUID);
    }
    return uuids;
}

/**
 * Group the cart product line items.
 * @param {Object[]} productItems - The array of product items.
 * @returns {Object[]} - The grouped product line items.
 */
function groupCartPlis(productItems) {
    const renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    let template = 'checkout/productCard/productCardProductRenderedTotalPrice';
    let pliInGroup = null;
    let groupedPlis = [];
    let context;
    for (let i = 0; i < productItems.length; i++) {
        let priceTotalVal = !empty(productItems[i].priceTotal.price) ? parseFloat(productItems[i].priceTotal.price.match(/\d+(\.\d+)?/)[0], 10) : 0;
        let nonAdjustedPriceVal = !empty(productItems[i].priceTotal.nonAdjustedPrice) ? productItems[i].priceTotal.nonAdjustedPrice.value : 0;
        let currencySymbol = !empty(productItems[i].priceTotal.price) ? productItems[i].priceTotal.price.match(/[^\d]+/)[0] : '';
        pliInGroup = groupedPlis.find(function (groupedPli) {
            return groupedPli.id === productItems[i].id;
        });
        if (pliInGroup && !empty(pliInGroup)) {
            pliInGroup.eswMoQty += productItems[i].quantity;
            // Price total
            pliInGroup.priceTotal.eswTotalPrice += priceTotalVal;
            pliInGroup.priceTotal.eswMoFormattedTotalPrice = currencySymbol + pliInGroup.priceTotal.eswTotalPrice.toFixed(2);
            // Non adjusted price
            pliInGroup.priceTotal.eswNonAdjustedPrice += nonAdjustedPriceVal;
            pliInGroup.priceTotal.eswMoFormattedNonAdjustedPrice = currencySymbol + pliInGroup.priceTotal.eswNonAdjustedPrice.toFixed(2);

            // Render pricesTotal HTML
            context = { lineItem: { priceTotal: {
                nonAdjustedPrice: pliInGroup.priceTotal.eswNonAdjustedPrice,
                eswMoFormattedNonAdjustedPrice: pliInGroup.priceTotal.eswMoFormattedNonAdjustedPrice,
                eswMoFormattedTotalPrice: pliInGroup.priceTotal.eswMoFormattedTotalPrice
            } } };
            pliInGroup.priceTotal.eswRenderedPrice = renderTemplateHelper.getRenderedHtml(context, template);
        } else {
            productItems[i].eswItemSortingOrder = i;
            productItems[i].eswMoQty = productItems[i].quantity;
            // Price total
            productItems[i].priceTotal.eswTotalPrice = priceTotalVal;
            productItems[i].priceTotal.eswMoFormattedTotalPrice = currencySymbol + productItems[i].priceTotal.eswTotalPrice.toFixed(2);
            // Non adjusted price
            productItems[i].priceTotal.eswNonAdjustedPrice = nonAdjustedPriceVal;
            productItems[i].priceTotal.eswMoFormattedNonAdjustedPrice = currencySymbol + productItems[i].priceTotal.eswNonAdjustedPrice.toFixed(2);

            // Render pricesTotal HTML
            context = { lineItem: { priceTotal: {
                nonAdjustedPrice: productItems[i].priceTotal.eswNonAdjustedPrice,
                eswMoFormattedNonAdjustedPrice: productItems[i].priceTotal.eswMoFormattedNonAdjustedPrice,
                eswMoFormattedTotalPrice: productItems[i].priceTotal.eswMoFormattedTotalPrice
            } } };
            productItems[i].priceTotal.eswRenderedPrice = renderTemplateHelper.getRenderedHtml(context, template);

            // Render unit price
            productItems[i].eswRenderedUnitPrice = renderTemplateHelper.getRenderedHtml({ lineItem: {
                priceTotal: {
                    nonAdjustedPrice: productItems[i].priceTotal.eswNonAdjustedPrice,
                    eswMoFormattedNonAdjustedPrice: productItems[i].priceTotal.eswMoFormattedNonAdjustedPrice,
                    eswMoFormattedTotalPrice: productItems[i].priceTotal.eswMoFormattedTotalPrice
                }
            }
            }, template);
            groupedPlis.push(productItems[i]);
        }
    }
    return groupedPlis.sort(function (a, b) {
        return a.eswItemSortingOrder - b.eswItemSortingOrder;
    });
}

/**
 * remove product line items from basket
 * @param {string} existingLineItemsOfProduct - existingLineItemsOfProduct.
 * @param {Object[]} currentBasket - currentBasket
 */
function removeProductLineitemFromBasket(existingLineItemsOfProduct, currentBasket) {
    for (let i = 0; i < existingLineItemsOfProduct.length; i++) {
        let moPli = existingLineItemsOfProduct[i];
        let shipmentToRemove = moPli.shipment;
        currentBasket.removeProductLineItem(moPli);
        if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
            currentBasket.removeShipment(shipmentToRemove);
        }
    }
}

module.exports = {
    getProductOriginDetails: getProductOriginDetails,
    getInventoryAtsFromMultiOriginResponse: getInventoryAtsFromMultiOriginResponse,
    isProductAvailableInMultiOrigin: isProductAvailableInMultiOrigin,
    getGroupedPlisUuidByPid: getGroupedPlisUuidByPid,
    groupCartPlis: groupCartPlis,
    removeProductLineitemFromBasket: removeProductLineitemFromBasket
};
