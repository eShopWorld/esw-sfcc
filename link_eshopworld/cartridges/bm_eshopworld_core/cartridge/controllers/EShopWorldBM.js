/* eslint-disable quote-props */
'use strict';

const server = require('server');
const ArrayList = require('dw/util/ArrayList');
const PagingModel = require('dw/web/PagingModel');
const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');
const Order = require('dw/order/Order');

const Constants = require('*/cartridge/scripts/util/Constants');
const bmHelper = require('*/cartridge/scripts/helpers/eswBmGeneralHelper');
const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const eswSyncHelpers = require('*/cartridge/scripts/helpers/eswSyncHelpers');
const bmOrdersHelper = require('~/cartridge/scripts/helpers/eswBmOrdersHelper.js');
const eswHCTableHelper = require('*/cartridge/scripts/helpers/eswHealthCheckTableHelper');

/**
 * Function to return to cart page after rebuilding cart
 */
server.get('Start', function (req, res, next) {
    if (!eswHelper.isEswCatalogApiMethod()) {
        res.redirect(URLUtils.url('EShopWorldBM-CatalogConfig'));
    } else {
        let syncProducts;
        let parameterMap = request.httpParameterMap;
        let pageSize = parameterMap.sz.intValue || 10;
        let start = parameterMap.start.intValue || 0;

        let prodModel = dw.catalog.ProductMgr.queryAllSiteProducts();
        let prodCount = prodModel.getCount();
        let prodSearchHit = prodModel.asList(0, prodCount).iterator();
        prodModel.close();

        let paging = new PagingModel(prodSearchHit, prodCount);
        paging.setPageSize(pageSize);
        paging.setStart(start);
        if (!empty(request.httpParameterMap.syncProducts.value)) {
            syncProducts = request.httpParameterMap.syncProducts.value;
        }
        res.render('/common/esw-products', {
            productsList: paging,
            syncProducts: syncProducts,
            currentController: 'Start'
        });
    }
    next();
});

server.get('Search', function (req, res, next) {
    if (!eswHelper.isEswCatalogApiMethod()) {
        res.redirect(URLUtils.url('EShopWorldBM-CatalogConfig'));
    } else {
        let searchQuery = null;
        let filterValue = null;
        let sortingValue = null;
        let idBasedSearch = null;
        let isMultiIdSearch = false;
        let nlSeparatorOnly = false;

        let prodModel = dw.catalog.ProductMgr.queryAllSiteProducts();
        let prodSearchHit = prodModel.asList(0, prodModel.getCount()).iterator();
        prodModel.close();

        let productSearchHits = prodSearchHit;

        let productsInSearch = new ArrayList([]);
        while (productSearchHits.hasNext()) {
            let currentProductInSearchHit = productSearchHits.next();
            // Simple Search
            if (req.querystring.submittedFrom === Constants.SIMPLE_FORM) {
                searchQuery = req.querystring.q ? req.querystring.q.toLowerCase().trim() : null;
                if (!empty(searchQuery) &&
                    ((!empty(currentProductInSearchHit.name) && currentProductInSearchHit.name.toLowerCase().indexOf(searchQuery) !== -1) ||
                    currentProductInSearchHit.ID.toLowerCase().indexOf(searchQuery) !== -1)) {
                    productsInSearch.add(currentProductInSearchHit);
                }
                // Handling empty form submit
                if (empty(searchQuery)) {
                    productsInSearch.add(currentProductInSearchHit);
                }
            }
            // Advance Search
            if (req.querystring.submittedFrom === Constants.ADVANCE_FORM) {
                filterValue = req.querystring.filterAttribute;
                if (filterValue === 'synced') {
                    if (eswSyncHelpers.getSyncStatusInfo(currentProductInSearchHit) === 'synced') {
                        productsInSearch.add(currentProductInSearchHit);
                    }
                }
                if (filterValue === 'unsynced') {
                    if (currentProductInSearchHit.custom.eswSync !== true || eswSyncHelpers.getSyncStatusInfo(currentProductInSearchHit) === 'apiError') {
                        productsInSearch.add(currentProductInSearchHit);
                    }
                }
                if (filterValue === 'none') {
                    productsInSearch.add(currentProductInSearchHit);
                }
            }
            // By ID
            if (req.querystring.submittedFrom === Constants.By_ID_FORM) {
                isMultiIdSearch = true;
                idBasedSearch = req.querystring.WFSimpleSearch_IDList;
                if (!empty(req.querystring.WFSimpleSearch_IDList)) {
                    let searchRegex = /[\r\n\s\t]+/g;
                    if (req.querystring.WFSimpleSearch_IDList_NewlineSeparatorOnly) {
                        nlSeparatorOnly = true;
                        searchRegex = /[\n]/g;
                    }
                    let productIds = req.querystring.WFSimpleSearch_IDList.toLowerCase().replace(searchRegex, ',');
                    if (productIds.indexOf(currentProductInSearchHit.ID.toLowerCase()) !== -1) {
                        productsInSearch.add(currentProductInSearchHit);
                    }
                }
                // Handling empty form submit
                if (empty(req.querystring.WFSimpleSearch_IDList)) {
                    productsInSearch.add(currentProductInSearchHit);
                }
            }
        }

        // Sorting
        if (req.querystring.submittedFrom === Constants.ADVANCE_FORM) {
            sortingValue = req.querystring.SortingDirection;
            if (sortingValue === 'eswSyncDescending') {
                productsInSearch.reverse();
            }
        }

        let parameterMap = request.httpParameterMap;
        let pageSize = !empty(req.querystring.sz) ? req.querystring.sz : req.querystring.InitialPageSize || 10;
        let selectedPageResultNumber = !empty(req.querystring.InitialPageSize) ? req.querystring.InitialPageSize : pageSize;
        let start = parameterMap.start.intValue || 0;
        let paging = new PagingModel(productsInSearch.iterator(), productsInSearch.size());
        paging.setPageSize(pageSize);
        paging.setStart(start);
        res.render('/common/esw-products', {
            filterValue: filterValue,
            productsList: paging,
            isProductSearch: true,
            query: searchQuery,
            idBasedSearch: idBasedSearch,
            isMultiIdSearch: isMultiIdSearch,
            sortingValue: sortingValue,
            selectedPageResultNumber: selectedPageResultNumber,
            currentController: 'Search',
            submittedFrom: req.querystring.submittedFrom,
            nlSeparatorOnly: nlSeparatorOnly
        });
    }
    next();
});

server.post('SyncProduct', function (req, res, next) {
    let requestObj = request.httpParameterMap;
    let syncArray = [];
    let status;
    let ProductMgr = require('dw/catalog/ProductMgr');
    let catalogFeed = require('*/cartridge/scripts/jobs/CatalogFeed');
    if (('SyncAll' in requestObj && !empty(requestObj.SyncAll.value))) {
        // running job to sync all site catalog products
        status = catalogFeed.execute();
    } else if (('pageSize' in requestObj && !empty(requestObj.pageSize.value))) {
        for (let i = 1; i <= requestObj.pageSize.value; i++) {
            if (!empty(requestObj['product' + i].value)) {
                let apiProduct = ProductMgr.getProduct(requestObj['product' + i].value);
                if (apiProduct) {
                    syncArray.push(apiProduct);
                }
            }
        }
        if (syncArray && syncArray.length > 0) {
            // Syncing selcoded products
            status = eswSyncHelpers.syncSelectedProducts(syncArray);
        }
    }
    if (status && status.message === 'OK') {
        res.redirect(URLUtils.url('EShopWorldBM-Start', 'syncProducts', Resource.msg('label.sync.products.true', 'eswbm', null)));
    } else {
        res.redirect(URLUtils.url('EShopWorldBM-Start', 'syncProducts', Resource.msg('label.sync.products.false', 'eswbm', null)));
    }
    next();
});

server.get('CatalogConfig', function (req, res, next) {
    let csrf = request.httpParameterMap.csrf_token.stringValue;
    let sitePrefFields = bmHelper.loadGroups(
        Site.getCurrent().getPreferences(),
        URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
        '#/?preference#site_preference_group_attributes!id!{0}',
        'ESW Catalog Integration Configuration'
    );
    let relatedMethodFields = {
        apiFields: [
            'isEswCatalogInternalValidationEnabled',
            'eswCatalogFeedPriceBookID',
            'eswCatalogFeedTimeStamp',
            'eswCatalogFeedProductCustomAttrFieldMapping'
        ],
        sftpFields: [
            'eswCatalogFeedLocalPath',
            'eswCatalogFeedRemotePath',
            'eswCatalogFeedSFTPService',
            'eswCatalogFeedInstanceID',
            'eswCatalogFeedProductCustomAttrFieldMapping',
            'eswCatalogFeedDelimiter',
            'eswCatalogFeedPriceBookID',
            'eswCatalogFeedTimeStamp'
        ]
    };
    sitePrefFields.attributes = bmHelper.removeElements(sitePrefFields.attributes, relatedMethodFields);
    res.render('/catalog/catalog-config-form', {
        sitePrefFields: sitePrefFields,
        currentController: 'CatalogConfig',
        relatedMethodFields: relatedMethodFields
    });
    next();
});

server.post('SavePostedConfig', function (req, res, next) {
    let reqForm = req.form;
    let formHasPkgAndSelectToMix = false;
    Transaction.wrap(function () {
        Object.keys(req.form).forEach(function (formKey) {
            let formKeyVal = req.form[formKey];
            if (formKey.indexOf('arrInput') === -1) {
                if (!empty(formKeyVal)) {
                    formKeyVal = formKeyVal.trim();
                    // Converting boolean
                    switch (formKeyVal) {
                        case 'true':
                            formKeyVal = true;
                            break;
                        case 'false':
                            formKeyVal = false;
                            break;
                        default:
                        // Do nothing
                    }
                }
                // Store configuration
                Site.getCurrent().setCustomPreferenceValue(formKey, formKeyVal);
                // Check if Package config form submitted with mix config
                if (formKey === 'eswPkgAsnType' && formKeyVal === 'mixed') {
                    formHasPkgAndSelectToMix = true;
                }
            }
        });
        // Storing config in case of mix
        if (formHasPkgAndSelectToMix) {
            bmHelper.storeMixedPkgConf(req.form);
        }
    });
    res.json({ success: true, data: reqForm });
    return next();
});

server.get('LoadReports', function (req, res, next) {
    let imReportJson = bmHelper.getIntegrationResportJson();
    let transformedServices = eswHCTableHelper.transformServiceDataForTable(imReportJson.imReport);
    let excludedKeys = ['services', 'lastModifed']; // Keys to exclude
    let transformedData = Object.keys(imReportJson.imReport)
        .filter(function (key) {
            return !excludedKeys.includes(key);
        })
        .map(function (key) {
            return {
                section: key,
                data: eswHCTableHelper.transformDataForTable(imReportJson.imReport[key], key)
            };
        });
    res.render('/report/esw-Integration-report', {
        currentController: 'LoadReports',
        configReport: eswHelper.beautifyJsonAsString(imReportJson.imReport),
        transformedServices: transformedServices,
        transformedData: transformedData,
        lastModified: imReportJson.lastModifed
    });
    next();
});
server.get('ReturnsConfig', function (req, res, next) {
    let csrf = request.httpParameterMap.csrf_token.stringValue;
    let sitePrefFields = bmHelper.loadGroups(
        Site.getCurrent().getPreferences(),
        URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
        '#/?preference#site_preference_group_attributes!id!{0}',
        'ESW Returns Configuration'
    );
    res.render('/returns/returns-config-form', {
        sitePrefFields: sitePrefFields,
        currentController: 'ReturnsConfig'
    });
    next();
});

server.get('PkgAsnExport', function (req, res, next) {
    let parameterMap = request.httpParameterMap;
    let submitFromForm = null;

    if (parameterMap.findSimple && !parameterMap.findSimple.empty) {
        submitFromForm = 'findSimple';
    } else if (parameterMap.findAdv && !parameterMap.findAdv.empty) {
        submitFromForm = 'findAdv';
    } else if (parameterMap.findByIds && !parameterMap.findByIds.empty) {
        submitFromForm = 'findByIds';
    }

    let exportStatus = parameterMap.exportStatus || null;
    let searchOrderQuery = 'status != ' + Order.ORDER_STATUS_FAILED + ' AND status != ' + Order.ORDER_STATUS_CANCELLED + ' AND shippingStatus = ' + Order.SHIPPING_STATUS_SHIPPED + ' AND (custom.eswReceivedASN != true OR custom.eswReceivedASN = null) ';
    let sortOrder = 'creationDate desc';
    // simple form
    let orderNumber = parameterMap.q || null;
    if (!empty(submitFromForm) && submitFromForm === 'findSimple') {
        if (!empty(orderNumber) && !empty(orderNumber.value)) {
            searchOrderQuery += ' AND orderNo = \'' + orderNumber.value + '\'';
        }
    } else {
        orderNumber = null;
    }

    // Search by order numbers list
    let orderNumbersList = parameterMap.orderNumbersList || [];
    let pageLimit = 0; // Display all records in case of list search
    if (!empty(submitFromForm) && submitFromForm === 'findByIds') {
        if (!empty(orderNumbersList) && !empty(orderNumbersList.value)) {
            let orderIds = new ArrayList(empty(orderNumbersList) ? orderNumbersList : orderNumbersList.value.split(/[\n,]+/)).iterator();
            searchOrderQuery = ' orderNo = ';
            let orderIdsCounter = 0;
            while (orderIds.hasNext()) {
                let currentOrderId = orderIds.next();
                if (orderIdsCounter === 0) {
                    searchOrderQuery += ' \'' + currentOrderId + '\'';
                } else {
                    searchOrderQuery += ' OR orderNo = \'' + currentOrderId + '\'';
                }
                orderIdsCounter++;
            }
            pageLimit = orderIdsCounter;
        }
    } else {
        orderNumbersList = '';
    }
    let searchedOrders = OrderMgr.queryOrders(searchOrderQuery, sortOrder);
    // Advance form
    let ordersInSearch = new ArrayList([]);
    let sortingDirection = parameterMap.SortingDirection || null;
    if (!empty(submitFromForm) && submitFromForm === 'findAdv') {
        while (searchedOrders.hasNext()) {
            let currentOrder = searchedOrders.next();
            if (!empty(exportStatus) && !empty(exportStatus.value) && exportStatus.value !== 'all') {
                if (bmOrdersHelper.getOrderExportStatus(currentOrder).status === exportStatus.value) {
                    ordersInSearch.add(currentOrder);
                }
            } else {
                ordersInSearch.add(currentOrder);
            }
        }
        if (sortingDirection && sortingDirection.value === 'desc') {
            ordersInSearch.reverse();
        }
    }

    let ordersPagingModel = null;
    if (ordersInSearch.isEmpty() && submitFromForm !== 'findAdv') {
        ordersPagingModel = new PagingModel(searchedOrders, searchedOrders.count);
    } else {
        ordersPagingModel = new PagingModel(ordersInSearch.iterator(), ordersInSearch.size());
    }
    let pageSize = (pageLimit > 0) ? pageLimit : (parameterMap.sz.intValue || 10);
    ordersPagingModel.setPageSize(pageSize);
    let start = parameterMap.start.intValue || 0;
    ordersPagingModel.setStart(start);
    res.render('/returns/pkg-asn-export', {
        currentController: 'PkgAsnExport',
        orders: ordersPagingModel,
        q: orderNumber,
        exportStatus: exportStatus,
        submitFromForm: submitFromForm,
        sz: pageSize,
        start: start,
        sortingDirection: sortingDirection,
        orderNumbersList: orderNumbersList
    });
    next();
});

server.post('ExportOrderShipment', function (req, res, next) {
    let requestObj = request.httpParameterMap;
    let syncArray = [];
    let status;
    let eswRetailerOutboundShippment = require('*/cartridge/scripts/jobs/eswRetailerOutboundShippment');
    if (('SyncAll' in requestObj && !empty(requestObj.SyncAll.value))) {
        // running job to sync all site catalog products
        status = eswRetailerOutboundShippment.execute();
    } else if (('pageSize' in requestObj && !empty(requestObj.pageSize.value))) {
        for (let i = 1; i <= requestObj.pageSize.value; i++) {
            if (!empty(requestObj['orderCheckbox-' + i].value)) {
                let order = OrderMgr.getOrder(requestObj['orderCheckbox-' + i].value);
                if (order) {
                    syncArray.push(order);
                }
            }
        }
        if (syncArray && syncArray.length > 0) {
            // Syncing selcoded products
            status = eswSyncHelpers.exportSelectedOrders(syncArray);
        }
    }
    if (empty(status) && status.message !== 'OK') {
        Logger.error('ESW BM ExportOrderShipment Error: ' + status.message);
    }
    res.redirect(URLUtils.url('EShopWorldBM-PkgAsnExport'));
    next();
});

server.get('RetailerConfiguration', function (req, res, next) {
    let csrf = request.httpParameterMap.csrf_token.stringValue;
    let sitePrefFields = bmHelper.loadGroups(
        Site.getCurrent().getPreferences(),
        URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
        '#/?preference#site_preference_group_attributes!id!{0}',
        'ESW Retailer Display Configuration'
    );
    res.render('/retailer/retailer-config-form', {
        sitePrefFields: sitePrefFields,
        currentController: 'RetailerConfiguration'
    });
    next();
});


server.get('PackageConfigurations', function (req, res, next) {
    let csrf = request.httpParameterMap.csrf_token.stringValue,
        sitePrefFields = bmHelper.loadGroups(
        Site.getCurrent().getPreferences(),
        URLUtils.url('ViewApplication-BM', 'csrf_token', csrf),
        '#/?preference#site_preference_group_attributes!id!{0}',
        'ESW Package Integration Configuration'
    );

    let eswCountrtiesCoItr = eswHelper.queryAllCustomObjects('ESW_COUNTRIES', '', 'custom.name asc');
    let eswCountrtiesCoArr = [];
    let alreadyUpdatedCountries = [];
    let defaultCountryForMixForm = [];
    while (eswCountrtiesCoItr.hasNext()) {
        let currentCountryCo = eswCountrtiesCoItr.next();
        defaultCountryForMixForm.push({
            countryCode: currentCountryCo.custom.countryCode,
            name: currentCountryCo.custom.name,
            pkgModel: null
        });
        eswCountrtiesCoArr.push({
            countryCode: currentCountryCo.custom.countryCode,
            name: currentCountryCo.custom.name
        });
        // For each pkg model, append country seperately to display in view
        if (currentCountryCo.custom && Object.prototype.hasOwnProperty.call(currentCountryCo.custom, 'eswSynchronizePkgModel')) {
            alreadyUpdatedCountries.push({
                countryCode: currentCountryCo.custom.countryCode,
                name: currentCountryCo.custom.name,
                pkgModel: currentCountryCo.custom.eswSynchronizePkgModel.value
            });
        }
    }
    // If no country selected for mix, then populate single country
    if (empty(alreadyUpdatedCountries)) {
        alreadyUpdatedCountries = defaultCountryForMixForm;
    }

    res.render('/package/package-conf', {
        currentController: 'Package',
        eswCountrtiesCoArr: eswCountrtiesCoArr,
        alreadyUpdatedCountries: alreadyUpdatedCountries,
        sitePrefFields: sitePrefFields,
        isPackageConfigPage: true
    });
    next();
});

server.post('SendLogsToEsw', function (req, res, next) {
    let isSuccess = false;
    try {
        let imReportJson = bmHelper.getIntegrationResportJson();
        eswHelper.eswInfoLogger('EswIntegrationLogsInfo', 'ESW Manual Logs', 'N/A', JSON.stringify(imReportJson.imReport), true);
        isSuccess = true;
    } catch (e) {
        isSuccess = false;
    }

    res.json({ success: isSuccess });
    next();
});

module.exports = server.exports();
