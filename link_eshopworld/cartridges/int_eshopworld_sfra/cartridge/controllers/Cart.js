'use strict';

/**
 * @namespace Cart
 */

const server = require('server');
server.extend(module.superModule);

const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswMultiOriginHelper = require('*/cartridge/scripts/helper/eswMultiOriginHelper');
/**
 * Cart-MiniCart : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Base/Cart-MiniCart
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.include
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend('MiniCart', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-AddProduct : The Cart-MiniCart endpoint is responsible for displaying the cart icon in the header with the number of items in the current basket
 * @name Base/Cart-AddProduct
 * @function
 * @memberof Cart
 * @param {httpparameter} - pid - product ID
 * @param {httpparameter} - quantity - quantity of product
 * @param {httpparameter} - options - list of product options
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend('AddProduct', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-Get : The Cart-Get endpoints is responsible for returning the current basket in JSON format
 * @name Base/Cart-Get
 * @function
 * @memberof Cart
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('Get', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-Show : The Cart-Show endpoint renders the cart page with the current basket
 * @name esw/Cart-Show
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend(
    'Show',
    function (req, res, next) {
        eswHelper.setEnableMultipleFxRatesCurrency(req);
        eswHelper.rebuildCartUponBackFromESW();
        let BasketMgr = require('dw/order/BasketMgr'),
            currentBasket = BasketMgr.getCurrentBasket();
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (let lineItemNumber in currentBasket.productLineItems) {
            let cartProduct = currentBasket.productLineItems[lineItemNumber].product;
            if (eswHelper.isProductRestricted(cartProduct.custom)) {
                session.privacy.eswProductRestricted = true;
                session.privacy.restrictedProductID = cartProduct.ID;
            }
        }
        let viewData = res.getViewData();
        if (currentBasket && eswCoreHelper.getEShopWorldModuleEnabled() && request.httpCookies['esw.location'] && eswCoreHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) {
            // Set override shipping methods if configured
            eswCoreHelper.applyShippingOverrideMethod(currentBasket);
        }
        res.setViewData(viewData);
        return next();
    }
);


/**
 * Cart-Show : The Cart-Show endpoint renders the cart page with the current basket
 * @name esw/Cart-Show
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append('Show', function (req, res, next) {
    let viewData = res.getViewData();
    // Group product for multi origin
    if (eswCoreHelper.isEnabledMultiOrigin() && viewData && viewData.items) {
        viewData.items = eswMultiOriginHelper.groupCartPlis(viewData.items);
    }
    res.setViewData(viewData);
    next();
});

/**
 * Cart-SelectShippingMethod : The Cart-SelectShippingMethod endpoint is responsible for assigning a shipping method to the shipment in basket
 * @name Base/Cart-SelectShippingMethod
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {querystringparameter} - methodID - ID of the selected shipping method
 * @param {querystringparameter} - shipmentUUID - UUID of the shipment object
 * @param {httpparameter} - methodID - ID of the selected shipping method
 * @param {httpparameter} - shipmentUUID - UUID of the shipment object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend('SelectShippingMethod', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-MiniCartShow : The Cart-MiniCartShow is responsible for getting the basket and showing the contents when you hover over minicart in header
 * @name Base/Cart-MiniCartShow
 * @function
 * @memberof Cart
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend('MiniCartShow', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-MiniCartShow : The Cart-MiniCartShow is responsible for getting the basket and showing the contents when you hover over minicart in header
 * @name Base/Cart-MiniCartShow
 * @function
 * @memberof Cart
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.append('MiniCartShow', function (req, res, next) {
    let viewData = res.getViewData();
    // Group product for multi origin
    if (eswCoreHelper.isEnabledMultiOrigin() && viewData && viewData.items) {
        viewData.items = eswMultiOriginHelper.groupCartPlis(viewData.items);
    }
    res.setViewData(viewData);
    next();
});

/**
 * Cart-AddCoupon : The Cart-AddCoupon endpoint is responsible for adding a coupon to a basket
 * @name Base/Cart-AddCoupon
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - couponCode - the coupon code to be applied
 * @param {querystringparameter} - csrf_token - hidden input field csrf token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('AddCoupon', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-RemoveCouponLineItem : The Cart-RemoveCouponLineItem endpoint is responsible for removing a coupon from a basket
 * @name Base/Cart-RemoveCouponLineItem
 * @function
 * @memberof Cart
 * @param {querystringparameter} - code - the coupon code
 * @param {querystringparameter} - uuid - the UUID of the coupon line item object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('RemoveCouponLineItem', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-RemoveCouponLineItem : The Cart-RemoveCouponLineItem endpoint is responsible for removing a coupon from a basket
 * @name Base/Cart-RemoveCouponLineItem
 * @function
 * @memberof Cart
 * @param {querystringparameter} - code - the coupon code
 * @param {querystringparameter} - uuid - the UUID of the coupon line item object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.append('RemoveCouponLineItem', function (req, res, next) {
    let viewData = res.getViewData();
    // Group product for multi origin
    if (eswCoreHelper.isEnabledMultiOrigin() && viewData && viewData.items) {
        viewData.items = eswMultiOriginHelper.groupCartPlis(viewData.items);
    }
    res.setViewData(viewData);
    next();
});

/**
 * Cart-AddBonusProducts : The Cart-AddBonusProducts endpoint handles adding bonus products to basket
 * @name Base/Cart-AddBonusProducts
 * @function
 * @memberof Cart
 * @param {querystringparameter} - pids - an object containing: 1. totalQty (total quantity of total bonus products) 2. a list of bonus products with each index being an object containing pid (product id of the bonus product), qty (quantity of the bonus product), a list of options of the bonus product
 * @param {querystringparameter} - uuid - UUID of the mian product
 * @param {querystringparameter} - pliuud - UUID of the bonus product line item
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.prepend('AddBonusProducts', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-EditBonusProduct : The Cart-EditBonusProduct endpoint is responsible for editing the bonus products in a basket
 * @name Base/Cart-EditBonusProduct
 * @function
 * @memberof Cart
 * @param {querystringparameter} - duuid - discount line item UUID
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('EditBonusProduct', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-GetProduct : The Cart-GetProduct endpoint handles showing the product details in a modal/quickview for editing a product in basket on cart page
 * @name Base/Cart-GetProduct
 * @function
 * @memberof Cart
 * @param {querystringparameter} - uuid - UUID of the product line item (to edit)
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.prepend('GetProduct', function (req, res, next) {
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    next();
});

/**
 * Cart-AddCoupon : The Cart-AddCoupon endpoint is responsible for adding a coupon to a basket
 * @name Base/Cart-AddCoupon
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - couponCode - the coupon code to be applied
 * @param {querystringparameter} - csrf_token - hidden input field csrf token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.append(
    'AddCoupon',
    function (req, res, next) {
        let BasketMgr = require('dw/order/BasketMgr');
        let Transaction = require('dw/system/Transaction');
        let CartModel = require('*/cartridge/models/cart');
        let cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        let currentBasket = BasketMgr.getCurrentBasket();
        Transaction.wrap(function () {
            if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                currentBasket.updateCurrency();
            }
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);

            basketCalculationHelpers.calculateTotals(currentBasket);
            eswHelper.removeThresholdPromo(currentBasket);
        });
        let basketModel = new CartModel(currentBasket);
        if (eswCoreHelper.isEnabledMultiOrigin() && basketModel && basketModel.items) {
            basketModel.items = eswMultiOriginHelper.groupCartPlis(basketModel.items);
        }
        res.json(basketModel);
        return next();
    }
);

/**
 * Cart-UpdateQuantity : The Cart-UpdateQuantity endpoint handles updating the quantity of a product line item in the basket
 * @name Base/Cart-UpdateQuantity
 * @function
 * @memberof Cart
 * @param {querystringparameter} - pid - the product id
 * @param {querystringparameter} - quantity - the quantity to be updated for the line item
 * @param {querystringparameter} -  uuid - the universally unique identifier of the product object
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.replace('UpdateQuantity', function (req, res, next) {
    let arrayHelper = require('*/cartridge/scripts/util/array');
    let BasketMgr = require('dw/order/BasketMgr');
    let Resource = require('dw/web/Resource');
    let Transaction = require('dw/system/Transaction');
    let URLUtils = require('dw/web/URLUtils');
    let CartModel = require('*/cartridge/models/cart');
    let collections = require('*/cartridge/scripts/util/collections');
    let cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    let currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    let productId = req.querystring.pid;
    let updateQuantity = parseInt(req.querystring.quantity, 10);
    let productLineItems = currentBasket.productLineItems;
    let matchingLineItem = collections.find(productLineItems, function (item) {
        return item.productID;
    });
    let availableToSell = 0;

    let totalQtyRequested = 0;
    let qtyAlreadyInCart = 0;
    let minOrderQuantity = 0;
    let perpetual = false;
    let canBeUpdated = false;
    let bundleItems;
    let bonusDiscountLineItemCount = currentBasket.bonusDiscountLineItems.length;

    if (matchingLineItem) {
        if (matchingLineItem.product.bundle) {
            bundleItems = matchingLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                let quantityToUpdate = updateQuantity *
                    matchingLineItem.product.getBundledProductQuantity(item.product).value;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                perpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell || perpetual) &&
                    (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            availableToSell = matchingLineItem.product.availabilityModel.inventoryRecord.ATS.value;
            perpetual = matchingLineItem.product.availabilityModel.inventoryRecord.perpetual;
            qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems,
                matchingLineItem.UUID
            );
            totalQtyRequested = updateQuantity + qtyAlreadyInCart;
            minOrderQuantity = matchingLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell || perpetual) &&
                (updateQuantity >= minOrderQuantity);
        }
    }

    let response;
    if (canBeUpdated) {
        Transaction.wrap(function () {
            // Custom Start: esw integration
            if (eswCoreHelper.isEnabledMultiOrigin()) {
                response = cartHelper.updateProductIDWithSameOrigin(productId, updateQuantity, matchingLineItem, currentBasket);
                if ('error' in response && response.error) {
                    canBeUpdated = false;
                }
            } else {
                matchingLineItem.setQuantityValue(updateQuantity);
            }
            // Custom End: esw integration

            let previousBounsDiscountLineItems = collections.map(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                return bonusDiscountLineItem.UUID;
            });

            basketCalculationHelpers.calculateTotals(currentBasket);
            if (currentBasket.bonusDiscountLineItems.length > bonusDiscountLineItemCount) {
                let prevItems = JSON.stringify(previousBounsDiscountLineItems);

                collections.forEach(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                    if (prevItems.indexOf(bonusDiscountLineItem.UUID) < 0) {
                        bonusDiscountLineItem.custom.bonusProductLineItemUUID = matchingLineItem.UUID; // eslint-disable-line no-param-reassign
                        matchingLineItem.custom.bonusProductLineItemUUID = 'bonus';
                        matchingLineItem.custom.preOrderUUID = matchingLineItem.UUID;
                    }
                });
            }
        });
    }

    if (matchingLineItem && canBeUpdated) {
        Transaction.wrap(function () {
            if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                currentBasket.updateCurrency();
            }
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
            basketCalculationHelpers.calculateTotals(currentBasket);
            eswHelper.removeThresholdPromo(currentBasket);
        });
        let basketModel = new CartModel(currentBasket);
        // Custom Start: esw integration
        if (eswCoreHelper.isEnabledMultiOrigin()) {
            basketModel.items = eswMultiOriginHelper.groupCartPlis(basketModel.items);
            var cartItem = arrayHelper.find(basketModel.items, function (item) {
                return item.id === response.lineItemId;
            });
            basketModel.resultResponse = response;
            basketModel.renderedPrice = cartItem.priceTotal.eswMoFormattedTotalPrice || cartItem.priceTotal.price;
        }
        // Custom End: esw integration
        res.json(basketModel);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product.quantity', 'cart', null)
        });
    }

    return next();
});

server.replace('RemoveProductLineItem', function (req, res, next) {
    let BasketMgr = require('dw/order/BasketMgr');
    let Resource = require('dw/web/Resource');
    let Transaction = require('dw/system/Transaction');
    let URLUtils = require('dw/web/URLUtils');
    let CartModel = require('*/cartridge/models/cart');
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    eswHelper.setEnableMultipleFxRatesCurrency(req);
    let currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    let isProductLineItemFound = false;
    let bonusProductsUUIDs = [];

    Transaction.wrap(function () {
        if (req.querystring.pid && req.querystring.uuid) {
            let productLineItems = currentBasket.getAllProductLineItems(req.querystring.pid);
            // Custom Start: esw integration
            let productGroupUuids = eswMultiOriginHelper.getGroupedPlisUuidByPid(req.querystring.pid, productLineItems);
            let uuids = eswCoreHelper.isEnabledMultiOrigin() ? productGroupUuids : [req.querystring.uuid];
            // Custom End: esw integration

            let bonusProductLineItems = currentBasket.bonusLineItems;
            let mainProdItem;
            for (var i = 0; i < productLineItems.length; i++) {
                let item = productLineItems[i];
                // Custom Start: esw integration
                if (uuids.indexOf(item.UUID) !== -1) {
                // Custom End: esw integration
                    if (bonusProductLineItems && bonusProductLineItems.length > 0) {
                        for (var j = 0; j < bonusProductLineItems.length; j++) {
                            let bonusItem = bonusProductLineItems[j];
                            mainProdItem = bonusItem.getQualifyingProductLineItemForBonusProduct();
                            if (mainProdItem !== null
                                && (mainProdItem.productID === item.productID)) {
                                bonusProductsUUIDs.push(bonusItem.UUID);
                            }
                        }
                    }

                    let shipmentToRemove = item.shipment;
                    currentBasket.removeProductLineItem(item);
                    if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                    isProductLineItemFound = true;
                    // Custom Start: esw integration
                    if (!eswCoreHelper.isEnabledMultiOrigin()) {
                    // Custom End: esw integration
                        break;
                    // Custom Start: esw integration
                    }
                    // Custom End: esw integration
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    if (isProductLineItemFound) {
        let basketModel = new CartModel(currentBasket);
        let basketModelPlus = {
            basket: basketModel,
            toBeDeletedUUIDs: bonusProductsUUIDs
        };
        res.json(basketModelPlus);
    } else {
        res.setStatusCode(500);
        res.json({ errorMessage: Resource.msg('error.cannot.remove.product', 'cart', null) });
    }

    return next();
});

/**
 * Cart-EditProductLineItem : The Cart-EditProductLineItem endpoint edits a product line item in the basket on cart page
 * @name Base/Cart-EditProductLineItem
 * @function
 * @memberof Cart
 * @param {httpparameter} - uuid - UUID of product line item being edited
 * @param {httpparameter} - pid - Product ID
 * @param {httpparameter} - quantity - Quantity
 * @param {httpparameter} - selectedOptionValueId - ID of selected option
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('EditProductLineItem', function (req, res, next) {
    let renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    let arrayHelper = require('*/cartridge/scripts/util/array');
    let BasketMgr = require('dw/order/BasketMgr');
    let ProductMgr = require('dw/catalog/ProductMgr');
    let Resource = require('dw/web/Resource');
    let URLUtils = require('dw/web/URLUtils');
    let Transaction = require('dw/system/Transaction');
    let CartModel = require('*/cartridge/models/cart');
    let collections = require('*/cartridge/scripts/util/collections');
    let cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    let basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    eswHelper.setEnableMultipleFxRatesCurrency(req);

    let currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    let uuid = req.form.uuid;
    let productId = req.form.pid;
    let selectedOptionValueId = req.form.selectedOptionValueId;
    let updateQuantity = parseInt(req.form.quantity, 10);

    let productLineItems = currentBasket.allProductLineItems;
    let requestLineItem = collections.find(productLineItems, function (item) {
        return item.UUID === uuid;
    });

    let uuidToBeDeleted = null;
    let pliToBeDeleted;
    let newPidAlreadyExist = collections.find(productLineItems, function (item) {
        if (item.productID === productId && item.UUID !== uuid) {
            uuidToBeDeleted = item.UUID;
            pliToBeDeleted = item;
            updateQuantity += parseInt(item.quantity, 10);
            return true;
        }
        return false;
    });

    let availableToSell = 0;
    let totalQtyRequested = 0;
    let qtyAlreadyInCart = 0;
    let minOrderQuantity = 0;
    let canBeUpdated = false;
    let perpetual = false;
    let bundleItems;

    if (requestLineItem) {
        if (requestLineItem.product.bundle) {
            bundleItems = requestLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                let quantityToUpdate = updateQuantity *
                    requestLineItem.product.getBundledProductQuantity(item.product).value;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                perpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell || perpetual) &&
                    (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            availableToSell = requestLineItem.product.availabilityModel.inventoryRecord.ATS.value;
            perpetual = requestLineItem.product.availabilityModel.inventoryRecord.perpetual;
            qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems,
                requestLineItem.UUID
            );
            totalQtyRequested = updateQuantity + qtyAlreadyInCart;
            minOrderQuantity = requestLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell || perpetual) &&
                (updateQuantity >= minOrderQuantity);
        }
    }

    let error = false;
    let response;
    if (canBeUpdated) {
        let product = ProductMgr.getProduct(productId);
        try {
            Transaction.wrap(function () {
                if (newPidAlreadyExist) {
                    let shipmentToRemove = pliToBeDeleted.shipment;
                    currentBasket.removeProductLineItem(pliToBeDeleted);
                    if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                }

                if (!requestLineItem.product.bundle) {
                    requestLineItem.replaceProduct(product);
                }

                // If the product has options
                let optionModel = product.getOptionModel();
                if (optionModel && optionModel.options && optionModel.options.length) {
                    let productOption = optionModel.options.iterator().next();
                    let productOptionValue = optionModel.getOptionValue(productOption, selectedOptionValueId);
                    let optionProductLineItems = requestLineItem.getOptionProductLineItems();
                    let optionProductLineItem = optionProductLineItems.iterator().next();
                    optionProductLineItem.updateOptionValue(productOptionValue);
                }

                // Custom Start: esw integration
                if (eswCoreHelper.isEnabledMultiOrigin()) {
                    response = cartHelper.updateProductIDWithSameOrigin(productId, parseInt(req.form.quantity, 10), requestLineItem, currentBasket);
                    if (response.error) {
                        canBeUpdated = false;
                    }
                } else {
                    requestLineItem.setQuantityValue(updateQuantity);
                }
                // Custom End: esw integration
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        } catch (e) {
            error = true;
        }
    }

    if (!error && requestLineItem && canBeUpdated) {
        let cartModel = new CartModel(currentBasket);

        let responseObject = {
            cartModel: cartModel,
            newProductId: productId
        };

        if (uuidToBeDeleted) {
            responseObject.uuidToBeDeleted = uuidToBeDeleted;
        }

        // Custom Start: esw integration
        let cartItem;
        if (eswCoreHelper.isEnabledMultiOrigin()) {
            cartModel.items = eswMultiOriginHelper.groupCartPlis(cartModel.items);
            cartItem = arrayHelper.find(cartModel.items, function (item) {
                return item.id === response.lineItemId;
            });
        } else {
            cartItem = arrayHelper.find(cartModel.items, function (item) {
                return item.UUID === uuid;
            });
        }
        // Custom End: esw integration

        let productCardContext = { lineItem: cartItem, actionUrls: cartModel.actionUrls };
        let productCardTemplate = 'cart/productCard/cartProductCardServer.isml';

        responseObject.renderedTemplate = renderTemplateHelper.getRenderedHtml(
            productCardContext,
            productCardTemplate
        );
        responseObject.resultResponse = response;

        res.json(responseObject);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product', 'cart', null)
        });
    }

    return next();
});

server.append('SelectShippingMethod', function (req, res, next) {
    const BasketMgr = require('dw/order/BasketMgr');
    const Transaction = require('dw/system/Transaction');
    const CartModel = require('*/cartridge/models/cart');
    const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    const PromotionMgr = require('dw/campaign/PromotionMgr');

    let currentBasket = BasketMgr.getCurrentBasket();

    Transaction.wrap(function () {
        eswHelper.adjustThresholdDiscounts(currentBasket);
        PromotionMgr.applyDiscounts(currentBasket);
        basketCalculationHelpers.calculateTotals(currentBasket);
        // Upon applying shipping method, remove threshold promo if it exists
        eswHelper.removeThresholdPromo(currentBasket);
    });

    let updatedBasketModel = new CartModel(currentBasket);
    res.json(updatedBasketModel);

    return next();
});

module.exports = server.exports();
