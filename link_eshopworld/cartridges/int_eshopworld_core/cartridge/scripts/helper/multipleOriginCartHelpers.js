'use strict';
/* eslint-disable */

var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
var eswMultiOriginHelper = require('*/cartridge/scripts/helper/eswMultiOriginHelper');
var collections = require('*/cartridge/scripts/util/collections');
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
var app = require('*/cartridge/scripts/app');

const cartHelpers = {
    /**
     * Returns a value of the first element in the array that satisfies the provided testing function.
     * Otherwise undefined is returned.
     * @param {Array} array - Array of elements to find the match in.
     * @param {Array} matcher - function that returns true if match is found
     * @return {Object|undefined} element that matches provided testing function or undefined.
     */
    find: function (array, matcher) {
        for (let i = 0, l = array.length; i < l; i++) {
            if (matcher(array[i], i)) {
                return array[i];
            }
        }

        return undefined;
    },
    getMatchingProducts: function (productId, productLineItems, originIso) {
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
    },
    getExistingProductLineItemsInCart: function (product, productId, productLineItems, childProducts, options, originIso) {
        let matchingProductsObj = cartHelpers.getMatchingProducts(productId, productLineItems, originIso);
        let matchingProducts = matchingProductsObj.matchingProducts;

        let productLineItemsInCart = matchingProducts.filter(function (matchingProduct) {
            if (product.bundle) {
                return collections.every(matchingProduct.bundledProductLineItems, function (item) {
                    return cartHelpers.find(childProducts, function (childProduct) {
                        return item.productID === childProduct.pid;
                    });
                });
            } else {
                let selected = {};
                for (let i = 0, j = (options || []).length; i < j; i++) {
                    selected[options[i].optionId] = options[i].selectedValueId;
                }
                return collections.every(matchingProduct.optionProductLineItems, function (option) {
                    return option.optionValueID === selected[option.optionID];
                });
            }
        });

        return productLineItemsInCart;
    },
    getExistingProductLineItemInCart: function (product, productId, productLineItems, childProducts, options, originIso) {
        return cartHelpers.getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options, originIso)[0];
    },
    countMultiOriginProductInCart: function (productId, originIso, productLineItems) {
        let moProductCount = 0;
        if (!empty(productLineItems)) {
            collections.forEach(productLineItems, function (item) {
                if (item.productID === productId && item.custom.eswFulfilmentCountryIso === originIso) {
                    moProductCount += item.quantity.value;
                }
            });
        }
        return moProductCount;
    },
    excludeUuid: function (selectedUuid, itemUuid) {
        return selectedUuid
            ? itemUuid !== selectedUuid
            : true;
    },
    getQtyAlreadyInCart: function (productId, lineItems, uuid) {
        let qtyAlreadyInCart = 0;

        collections.forEach(lineItems, function (item) {
            if (item.bundledProductLineItems.length) {
                collections.forEach(item.bundledProductLineItems, function (bundleItem) {
                    if (bundleItem.productID === productId && cartHelpers.excludeUuid(uuid, bundleItem.UUID)) {
                        qtyAlreadyInCart += bundleItem.quantityValue;
                    }
                });
                if (item.productID === productId && cartHelpers.excludeUuid(uuid, item.UUID)) {
                    qtyAlreadyInCart += item.quantityValue;
                }
            } else if (item.productID === productId && cartHelpers.excludeUuid(uuid, item.UUID)) {
                qtyAlreadyInCart += item.quantityValue;
            }
        });
        return qtyAlreadyInCart;
    },
    updateCart: function (productsObj, cart) {
        let error = false;
        const Product = app.getModel('Product');
        for (let index = 0; index < productsObj.length; index++) {
            let element = productsObj[index],
                productId = element.key,
                // eslint-disable-next-line radix
                totalQtyRequested = parseInt(element.value),
                canBeAdded = false,
                ProductMgr = require('dw/catalog/ProductMgr'),
                product = ProductMgr.getProduct(productId),
                productLineItems = cart.object.productLineItems,
                moQtyIssue,
                perpetual = product.availabilityModel.inventoryRecord.perpetual,
                productModel = Product.get(productId),
                inventoryInfo,
                childProducts = [],
                productToAdd,
                productOptionModel,
                addedEswPlis = cart.object.productLineItems,
                productInCart,
                productLineItem,
                quantityToSet,
                availableToSell;

            var moAtsVal = eswMultiOriginHelper.syncSingleProductMoInventoryWithSfcc(product, totalQtyRequested);
            var eswAtsValue = moAtsVal.eswAtsValue < product.availabilityModel.inventoryRecord.ATS.value ?  product.availabilityModel.inventoryRecord.ATS.value : moAtsVal.eswAtsValue;

            if (!perpetual && !empty(eswAtsValue)) {
                if (eswAtsValue < totalQtyRequested) {
                    totalQtyRequested = eswAtsValue;
                    session.privacy.restrictedQtyProductID = productModel.object.ID;
                    session.privacy.restrictedQtyProductMessage = Resource.msgf(
                        'error.alert.selected.quantity.cannot.be.added.for',
                        'product',
                        null,
                        eswAtsValue,
                        productModel.object.name
                    );
                }
            }

            inventoryInfo = eswMultiOriginHelper.getProductOriginDetails({ productId: productId, quantity: totalQtyRequested });
            if (!(perpetual || totalQtyRequested <= eswAtsValue)) {
                moQtyIssue = true;
            }
            eswAtsValue = eswMultiOriginHelper.getInventoryAtsFromMultiOriginResponse(inventoryInfo, productId);
            canBeAdded = (perpetual || totalQtyRequested <= eswAtsValue);

            if (!canBeAdded) {
                error = true;
                if (moQtyIssue) {
                    session.privacy.restrictedQtyProductID = productModel.object.ID;
                    session.privacy.restrictedQtyProductMessage = Resource.msgf(
                        'esw.mo.qty.error.message',
                        'esw',
                        null,
                        productModel.object.name
                    );
                } else {
                    session.privacy.restrictedQtyProductID = productModel.object.ID;
                    session.privacy.restrictedQtyProductMessage = Resource.msgf(
                        'error.alert.selected.quantity.cannot.be.added.for',
                        'product',
                        null,
                        eswAtsValue,
                        productModel.object.name
                    );
                }
            }

            let executeMultiOriginLogic = (eswCoreHelper.isEnabledMultiOrigin() && !empty(inventoryInfo) && inventoryInfo.length > 0);
            if (!executeMultiOriginLogic) {
                inventoryInfo = [{
                    productId: productId,
                    originIso: null,
                    quantity: totalQtyRequested
                }];
            } else {
                if (product.bundle) {
                    for (let q = 0; q < productLineItems.length; q++) {
                        if (productLineItems[q].productID === productId) {
                            productInCart = productLineItems[q];
                            break;
                        }
                    }
                    childProducts = product.bundle && productInCart
                        ? collections.map(productInCart.getBundledProductLineItems(), item => ({
                            pid: item.getProductID(),
                            quantity: item.getQuantity().getValue()
                        }))
                        : [];
                }
                productOptionModel = productModel.object.optionModel;
                let existingLineItemsOfProduct = cartHelpers.getExistingProductLineItemsInCart(product, productId, addedEswPlis, childProducts, productOptionModel.options, null);
                Transaction.wrap(function () {
                    eswMultiOriginHelper.removeProductLineitemFromBasket(existingLineItemsOfProduct, cart.object);
                });
                addedEswPlis = cart.object.productLineItems;
            }
            for (let i = 0; i < inventoryInfo.length; i++) {
                let productQuantityInCart;
                productToAdd = productModel;
                productOptionModel = productModel.object.optionModel;
                productInCart = cartHelpers.getExistingProductLineItemInCart(
                    product, productId, addedEswPlis, childProducts, productOptionModel ? productOptionModel.options : null,
                    (executeMultiOriginLogic) ? inventoryInfo[i].originIso : null
                );
                let moProductCountInCart = cartHelpers.countMultiOriginProductInCart(productId, inventoryInfo[i].originIso, addedEswPlis);
                // If the product is already in the cart, increase the quantity
                if ((!executeMultiOriginLogic && productInCart) || (executeMultiOriginLogic && productInCart && moProductCountInCart > 0)) {
                    productQuantityInCart = (!executeMultiOriginLogic) ? productInCart.quantity.value : moProductCountInCart;
                    if (executeMultiOriginLogic) {
                        quantityToSet = moProductCountInCart + inventoryInfo[i].quantity;
                    } else {
                        quantityToSet = totalQtyRequested ? totalQtyRequested + productQuantityInCart : productQuantityInCart + 1;
                    }

                    availableToSell = eswAtsValue;

                    if (availableToSell >= quantityToSet || perpetual) {
                        // eslint-disable-next-line no-loop-func
                        Transaction.wrap(function () {
                            productInCart.replaceProduct(productToAdd.object);
                            productInCart.setQuantityValue(quantityToSet);
                            cart.calculate();
                        });
                    } else {
                        error = true;
                        session.privacy.restrictedQtyProductID = productModel.object.ID;
                        session.privacy.restrictedQtyProductMessage = availableToSell === productQuantityInCart
                            ? Resource.msg('error.alert.max.quantity.in.cart', 'product', null)
                            : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
                    }
                } else {
                    productToAdd = productModel;
                    let qty = (executeMultiOriginLogic) ? inventoryInfo[i].quantity : totalQtyRequested;
                    // eslint-disable-next-line no-loop-func
                    Transaction.wrap(function () {
                        productLineItem = cart.createProductLineItem(productToAdd.object, productOptionModel, cart.object.defaultShipment);
                        if (qty) {
                            productLineItem.setQuantityValue(qty);
                        }
                        if (executeMultiOriginLogic && !empty(productLineItem)) {
                            productLineItem.custom.eswFulfilmentCountryIso = inventoryInfo[i].originIso;
                        }
                        /**
                         * By default, when a bundle is added to cart, all its child products are added too, but if those products are
                         * variants then the code must replace the master products with the selected variants that get passed in the
                         * HTTP params as childPids along with any options. Params: CurrentHttpParameterMap.childPids - comma separated list of
                         * pids of the bundled products that are variations.
                         */
                        if (request.httpParameterMap.childPids.stringValue && product.bundle) {
                            let childPids = request.httpParameterMap.childPids.stringValue.split(',');

                            for (i = 0; i < childPids.length; i++) {
                                let childProduct = Product.get(childPids[i]).object;

                                if (childProduct) {
                                    childProduct.updateOptionSelection(request.httpParameterMap);

                                    let foundLineItem = cart.getBundledProductLineItemByPID(childProduct, childProduct.isVariant() ? childProduct.masterProduct.ID : childProduct.ID);

                                    if (foundLineItem) {
                                        foundLineItem.replaceProduct(childProduct);
                                    }
                                }
                            }
                        }
                        cart.calculate();
                    });
                    addedEswPlis.add(productLineItem);
                }
            }
        }
    },
    /**
     * Function to combine qty and totals for a line item laying in multiple origins
     * @param {ProductLineItem} lineItem - DW product line item object
     * @returns {Object} - combined object for perticular LI
     */
    moCartPliIno: function (lineItem) {
        var cart = app.getModel('Cart').get();
        var allCartLineItems = cart.object.productLineItems;
        var groupLineItemInfo = {
            quantity: { value: 0 },
            moTotalLiPrice: 0
        };
        var moTotalPriceVal = 0;
        var countryDetail = eswHelper.getSelectedCountryDetail(request.httpCookies['esw.location'].value);
        for (var i = 0; i < allCartLineItems.length; i++) {
            var currentLineItem = allCartLineItems[i];
            if (currentLineItem.productID === lineItem.productID) {
                // Get quantity
                groupLineItemInfo.quantity.value += currentLineItem.quantity;
                // Getting Total Price
                moTotalPriceVal += eswHelper.getSubtotalObject(currentLineItem, false, true);
                groupLineItemInfo.moTotalLiPrice = new dw.value.Money(Number(moTotalPriceVal), countryDetail.defaultCurrencyCode);
            }
        }
        return groupLineItemInfo;
    },

    moOrderPliInfo(orderLineItem, orderObject) {
        var order = orderObject;
        var allOrderProductLineItems = order.productLineItems;
        var groupLineItemInfo = {
            quantity: { value: 0 },
            moTotalLiPrice: 0
        };
        var moTotalPriceVal = 0;
        for (var i = 0; i < allOrderProductLineItems.length; i++) {
            var currentLineItem = allOrderProductLineItems[i];
            if (currentLineItem.productID === orderLineItem.productID) {
                // Get quantity
                groupLineItemInfo.quantity.value += currentLineItem.quantityValue;
                // Getting Total Price
                moTotalPriceVal += !empty(order.custom.eswShopperCurrencyCode)
                                        ? (currentLineItem.custom.eswShopperCurrencyItemPriceInfo * currentLineItem.quantityValue)
                                        : Number((currentLineItem.adjustedPrice));
                groupLineItemInfo.moTotalLiPrice = new dw.value.Money(Number(moTotalPriceVal), order.currencyCode);
            }
        }
        return groupLineItemInfo;
    }
};

module.exports = cartHelpers;
