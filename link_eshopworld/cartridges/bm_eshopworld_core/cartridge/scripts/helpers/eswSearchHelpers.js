/* eslint-disable require-jsdoc */
'use strict';

var collections = require('*/cartridge/scripts/util/collections');

/**
 * Sets the relevant product search model properties, depending on the parameters provided
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - Query params
 * @param {dw.catalog.Category} selectedCategory - Selected category
 * @param {dw.catalog.SortingRule} sortingRule - Product grid sort rule
 * @param {Object} httpParameterMap - Query params
 * @property {Double} [httpParameterMap.pmin] - Minimum Price
 * @property {Double} [httpParameterMap.pmax] - Maximum Price
 */
function setProductProperties(productSearch, httpParams, selectedCategory, sortingRule, httpParameterMap) {
    let searchPhrase;

    if (httpParams.q) {
        searchPhrase = httpParams.q;
        productSearch.setSearchPhrase(searchPhrase + '*');
    }
    if (selectedCategory) {
        productSearch.setCategoryID(selectedCategory.ID);
    }
    if (httpParams.pid) {
        productSearch.setProductIDs([httpParams.pid]);
    }
    if (httpParameterMap) {
        if (httpParameterMap.pmin) {
            productSearch.setPriceMin(httpParameterMap.pmin.doubleValue);
        }
        if (httpParameterMap.pmax) {
            productSearch.setPriceMax(httpParameterMap.pmax.doubleValue);
        }
    }
    if (httpParams.pmid) {
        productSearch.setPromotionID(httpParams.pmid);
    }

    if (sortingRule) {
        productSearch.setSortingRule(sortingRule);
    }

    productSearch.setRecursiveCategorySearch(true);
}

/**
 * Updates the search model with the preference refinement values
 *
 * @param {dw.catalog.SearchModel} search - SearchModel instance
 * @param {Object} preferences - Query params map
 */
function addRefinementValues(search, preferences) {
    Object.keys(preferences).forEach(function (key) {
        search.addRefinementValues(key, preferences[key]);
    });
}

/**
 * Set search configuration values
 *
 * @param {dw.catalog.ProductSearchModel} apiProductSearch - API search instance
 * @param {Object} params - Provided HTTP query parameters
 * @return {dw.catalog.ProductSearchModel} - API search instance
 * @param {Object} httpParameterMap - Query params
 */
function setupSearch(apiProductSearch, params, httpParameterMap) {
    let CatalogMgr = require('dw/catalog/CatalogMgr');

    let sortingRule = params.srule ? CatalogMgr.getSortingRule(params.srule) : null;
    let selectedCategory = CatalogMgr.getCategory(params.cgid);
    selectedCategory = selectedCategory && selectedCategory.online ? selectedCategory : null;

    setProductProperties(apiProductSearch, params, selectedCategory, sortingRule, httpParameterMap);

    if (params.preferences) {
        addRefinementValues(apiProductSearch, params.preferences);
    }

    return apiProductSearch;
}

/**
 * Set the cache values
 *
 * @param {Object} res - The response object
 */
function applyCache(res) {
    res.cachePeriod = 1; // eslint-disable-line no-param-reassign
    res.cachePeriodUnit = 'hours'; // eslint-disable-line no-param-reassign
    res.personalized = true; // eslint-disable-line no-param-reassign
}

// eslint-disable-next-line require-jsdoc
function getFilterObject(FilterID) {
    let filterObj = {};
    switch (FilterID) {
        case 'Unsynced':
            filterObj.ID = 'eswSync';
            filterObj.value = false;
            break;
        case 'Synced':
            filterObj.ID = 'eswSync';
            filterObj.value = true;
            break;
        case 'Internal Validation Error':
            filterObj.ID = 'eswSync';
            filterObj.value = null;
            break;
        case 'External Validation Error':
            filterObj.ID = 'eswSync';
            filterObj.value = false;
            break;
        default:
            filterObj = null;
            break;
    }
    return filterObj;
}

function filterProductHits(hitsIter, paramsObj) {
    let params = paramsObj || {};
    return collections.filter(hitsIter, function (productHit) {
        return productHit.product &&
            ((empty(params.pid) || (productHit.productID.toLowerCase().indexOf(params.pid.toLowerCase()) > -1 || productHit.firstRepresentedProductID.toLowerCase().indexOf(params.pid.toLowerCase()) > -1 || productHit.lastRepresentedProductID.toLowerCase().indexOf(params.pid.toLowerCase()) > -1))
            || (empty(params.name) || productHit.product.name.toLowerCase().indexOf(params.name.toLowerCase()) > -1));
    });
}

function filterSearchProductHits(hitsIter) {
    let eswCatalogHelper = require('*/cartridge/scripts/helper/eswCatalogHelper');
    return collections.filter(hitsIter, function (productHit) {
        return eswCatalogHelper.isValidProduct(productHit.product, true).isError === true;
    });
}

exports.setupSearch = setupSearch;
exports.applyCache = applyCache;
exports.getFilterObject = getFilterObject;
exports.filterProductHits = filterProductHits;
exports.filterSearchProductHits = filterSearchProductHits;
