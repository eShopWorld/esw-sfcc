/* eslint-disable quote-props */
'use strict';


const server = require('server');
const ProductSearchModel = require('dw/catalog/ProductSearchModel');
const ArrayList = require('dw/util/ArrayList');
const PagingModel = require('dw/web/PagingModel');
const CatalogMgr = require('dw/catalog/CatalogMgr');
const Site = require('dw/system/Site');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');

const Constants = require('*/cartridge/scripts/util/Constants');
const bmHelper = require('*/cartridge/scripts/helpers/eswBmGeneralHelper');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
const eswCatalogHelper = require('*/cartridge/scripts/helper/eswCatalogHelper');
/**
 * Function to return to cart page after rebuilding cart
 */
server.get('Start', function (req, res, next) {
    if (!eswHelper.isEswCatalogApiMethod()) {
        res.redirect(URLUtils.url('EShopWorldBM-CatalogConfig'));
    } else {
        let prodModel = new ProductSearchModel();
        let syncProducts;
        prodModel.setCategoryID(CatalogMgr.siteCatalog.root.ID);
        prodModel.setRecursiveCategorySearch(true);
        prodModel.setOrderableProductsOnly(true);
        prodModel.search();
        let parameterMap = request.httpParameterMap;
        let pageSize = parameterMap.sz.intValue || 10;
        let start = parameterMap.start.intValue || 0;
        let paging = new PagingModel(prodModel.getProductSearchHits(), prodModel.count);
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

        let prodModel = new ProductSearchModel();
        prodModel.setCategoryID(CatalogMgr.siteCatalog.root.ID);
        prodModel.setRecursiveCategorySearch(true);
        prodModel.setOrderableProductsOnly(true);
        prodModel.search();
        let productSearchHits = prodModel.getProductSearchHits();
        let productsInSearch = new ArrayList([]);
        while (productSearchHits.hasNext()) {
            let currentProductInSearchHit = productSearchHits.next();
            // Simple Search
            if (req.querystring.submittedFrom === Constants.SIMPLE_FORM) {
                searchQuery = req.querystring.q.toLowerCase().trim() || null;
                if (!empty(searchQuery)
                    && (currentProductInSearchHit.product.name.toLowerCase().indexOf(searchQuery) !== -1
                        || currentProductInSearchHit.product.ID.toLowerCase().indexOf(searchQuery) !== -1)) {
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
                    let productHasInternalError = false;
                    if (eswHelper.isEswCatalogInternalValidationEnabled()) {
                        productHasInternalError = eswCatalogHelper.isValidProduct(currentProductInSearchHit.product).isError;
                    }
                    if (currentProductInSearchHit.product.custom.eswSync === true && !productHasInternalError) {
                        productsInSearch.add(currentProductInSearchHit);
                    }
                }
                if (filterValue === 'unsynced') {
                    if (currentProductInSearchHit.product.custom.eswSync !== true) {
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
                    if (productIds.indexOf(currentProductInSearchHit.product.ID.toLowerCase()) !== -1) {
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
    let eswSyncHelpers = require('*/cartridge/scripts/helpers/eswSyncHelpers');
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
            'eswCatalogFeedTimeStamp'
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
    Transaction.wrap(function () {
        Object.keys(req.form).forEach(function (formKey) {
            let formKeyVal = req.form[formKey];
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
            Site.getCurrent().setCustomPreferenceValue(formKey, formKeyVal);
        });
    });
    res.json({ success: true, data: reqForm });
    return next();
});

module.exports = server.exports();
