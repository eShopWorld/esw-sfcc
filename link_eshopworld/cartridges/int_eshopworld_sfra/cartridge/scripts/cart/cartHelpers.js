'use strict';

const base = module.superModule;

const ProductMgr = require('dw/catalog/ProductMgr');
const Resource = require('dw/web/Resource');

const productHelper = require('app_storefront_base/cartridge/scripts/helpers/productHelpers');
const baseCartHelpers = require('app_storefront_base/cartridge/scripts/cart/cartHelpers');
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswMultiOriginHelper = require('*/cartridge/scripts/helper/eswMultiOriginHelper');
const collections = require('*/cartridge/scripts/util/collections');


/**
 * Find all line items that contain the product specified.  A product can appear in different line
 * items that have different option selections or in product bundles.
 *
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string} originIso - originIso to match
 * @return {Object} properties includes,
 *                  matchingProducts - collection of matching products
 *                  uuid - string value for the last product line item
 * @return {dw.order.ProductLineItem[]} - Filtered list of product line items matching productId
 */
function getMatchingProducts(productId, productLineItems, originIso) {
    let matchingProducts = [];
    let uuid;
    collections.forEach(productLineItems, function (item) {
        if (item.productID === productId && (item.custom.eswFulfilmentCountryIso === originIso || empty(originIso))) {
            matchingProducts.push(item);
            uuid = item.UUID;
        }
    });
    return {
        matchingProducts: matchingProducts,
        uuid: uuid
    };
}

/**
 * Filter all the product line items matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {string} originIso - originIso to match
 * @return {dw.order.ProductLineItem[]} - Filtered all the product line item matching productId and
 *     has the same bundled items or options
 */
function getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options, originIso) {
    let matchingProductsObj = getMatchingProducts(productId, productLineItems, originIso);
    let matchingProducts = matchingProductsObj.matchingProducts;
    let productLineItemsInCart = matchingProducts.filter(function (matchingProduct) {
        return product.bundle
            ? baseCartHelpers.allBundleItemsSame(matchingProduct.bundledProductLineItems, childProducts)
            : baseCartHelpers.hasSameOptions(matchingProduct.optionProductLineItems, options || []);
    });

    return productLineItemsInCart;
}

/**
 * Filter the product line item matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {string} originIso - originIso to match
 * @return {dw.order.ProductLineItem} - get the first product line item matching productId and
 *     has the same bundled items or options
 */
function getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options, originIso) {
    return getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options, originIso)[0];
}

/**
 * Checks if a multi-origin product is already in the cart.
 * @param {string} productId - The ID of the product.
 * @param {string} originIso - The ISO code of the product's origin.
 * @param {dw.order.ProductLineItem[]} productLineItems - The product line items in the cart.
 * @returns {boolean} - Returns true if the multi-origin product is in the cart, false otherwise.
 */
function countMultiOriginProductInCart(productId, originIso, productLineItems) {
    let moProductCount = 0;
    if (!empty(productLineItems)) {
        collections.forEach(productLineItems, function (item) {
            if (item.productID === productId && item.custom.eswFulfilmentCountryIso === originIso) {
                moProductCount += item.quantity.value;
            }
        });
    }
    return moProductCount;
}
/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {boolean} isUpdateQuantity - product UpdateQuantity
 *  @return {Object} returns an error object
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options, isUpdateQuantity) {
    let availableToSell;
    let defaultShipment = currentBasket.defaultShipment;
    let perpetual;
    let product = ProductMgr.getProduct(productId);
    let productInCart;
    let productLineItems = currentBasket.productLineItems;
    let productQuantityInCart;
    let quantityToSet;
    let optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    let result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    let totalQtyRequested = 0;
    let canBeAdded = false;
    let inventoryInfo = null;
    let moQtyIssue = false;

    let productLineItem;
    let eswAtsValue = product.availabilityModel.inventoryRecord.ATS.value;
    // Use addedEswPlis to keep correct data via getExistingProductLineItemInCart and countMultiOriginProductInCart
    let addedEswPlis = productLineItems;

    if (product.bundle) {
        canBeAdded = baseCartHelpers.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else {
        if (!isUpdateQuantity) {
            totalQtyRequested = quantity + baseCartHelpers.getQtyAlreadyInCart(productId, productLineItems);
        } else {
            // handled in update|EditProductLineItems methods
            totalQtyRequested = quantity;
        }
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        // if multi origin is enabled, get the inventory details from the helper
        if (eswCoreHelper.isEnabledMultiOrigin()) {
            inventoryInfo = eswMultiOriginHelper.getProductOriginDetails({ productId: productId, quantity: totalQtyRequested });
            if (!empty(inventoryInfo) && eswMultiOriginHelper.isProductAvailableInMultiOrigin(inventoryInfo, productId)) {
                // Get value of origin from multi origin response
                eswAtsValue = eswMultiOriginHelper.getInventoryAtsFromMultiOriginResponse(inventoryInfo, productId);
            }
            if (!(perpetual || totalQtyRequested <= eswAtsValue)) {
                moQtyIssue = true;
            }
        }
        canBeAdded = (perpetual || totalQtyRequested <= eswAtsValue);
    }

    if (!canBeAdded) {
        result.error = true;
        if (moQtyIssue) {
            result.message = Resource.msgf(
                'esw.mo.qty.error.message',
                'esw',
                null,
                product.name
            );
        } else {
            result.message = Resource.msgf(
                'error.alert.selected.quantity.cannot.be.added.for',
                'product',
                null,
                eswAtsValue,
                product.name
            );
        }
        return result;
    }

    let executeMultiOriginLogic = (eswCoreHelper.isEnabledMultiOrigin() && !empty(inventoryInfo) && inventoryInfo.length > 0);
    if (!executeMultiOriginLogic) {
        inventoryInfo = [{
            productId: productId,
            originIso: null,
            quantity: quantity
        }];
    } else {
        // We’re getting the full required quantity from getProductOriginDetails(),
        // so we’re removing the already added quantities from the basket.
        let existingLineItemsOfProduct = getExistingProductLineItemsInCart(product, productId, addedEswPlis, childProducts, options, null);
        eswMultiOriginHelper.removeProductLineitemFromBasket(existingLineItemsOfProduct, currentBasket);
        addedEswPlis = currentBasket.productLineItems;
    }
    for (let i = 0; i < inventoryInfo.length; i++) {
        productInCart = getExistingProductLineItemInCart(
            product, productId, addedEswPlis, childProducts, options,
            (executeMultiOriginLogic) ? inventoryInfo[i].originIso : null
        );
        let moProductCountInCart = countMultiOriginProductInCart(productId, inventoryInfo[i].originIso, addedEswPlis);
        // If the product is already in the cart, increase the quantity
        if ((!executeMultiOriginLogic && productInCart) || (executeMultiOriginLogic && productInCart && moProductCountInCart > 0)) {
            productQuantityInCart = (!executeMultiOriginLogic) ? productInCart.quantity.value : moProductCountInCart;
            if (executeMultiOriginLogic) {
                quantityToSet = moProductCountInCart + inventoryInfo[i].quantity;
            } else {
                quantityToSet = quantity ? quantity + productQuantityInCart : productQuantityInCart + 1;
            }
            availableToSell = eswAtsValue;

            if (availableToSell >= quantityToSet || perpetual) {
                productInCart.setQuantityValue(quantityToSet);
                result.uuid = productInCart.UUID;
            } else {
                result.error = true;
                result.message = availableToSell === productQuantityInCart
                    ? Resource.msg('error.alert.max.quantity.in.cart', 'product', null)
                    : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
            }
        } else {
            productLineItem = baseCartHelpers.addLineItem(
                currentBasket,
                product,
                executeMultiOriginLogic ? inventoryInfo[i].quantity : quantity,
                childProducts,
                optionModel,
                defaultShipment
            );
            result.uuid = productLineItem.UUID;
            // Need to add custom attribute only upon new basket item
            if (executeMultiOriginLogic && !empty(productLineItem)) {
                productLineItem.custom.eswFulfilmentCountryIso = inventoryInfo[i].originIso;
            }
            addedEswPlis.add(productLineItem);
        }
    }

    return result;
}

/**
 * update product quantity if existed in origin list otherwise add new lineItem
 * @param {string} productId - productId
 * @param {Integer} totalQtyRequested - totalQtyRequested
 * @param {dw.order.Basket} matchingLineItem - matchingLineItem
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @return {Object} returns added product information
 */
function updateProductIDWithSameOrigin(productId, totalQtyRequested, matchingLineItem, currentBasket) {
    let result = {};
    if (eswCoreHelper.isEnabledMultiOrigin()) {
        let productDetails = matchingLineItem.product.bundle
        ? collections.map(matchingLineItem.getBundledProductLineItems(), item => ({
            pid: item.getProductID(),
            quantity: item.getQuantity().getValue()
        }))
        : [];
        result = addProductToCart(currentBasket, productId, (totalQtyRequested), productDetails, [], true);
        result.lineItemId = matchingLineItem.productID;
    }

    return result;
}

base.addProductToCart = addProductToCart;
base.updateProductIDWithSameOrigin = updateProductIDWithSameOrigin;
module.exports = base;

