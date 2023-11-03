/* eslint-disable require-jsdoc */
'use strict';

const collections = require('*/cartridge/scripts/util/collections');

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

exports.applyCache = applyCache;
exports.getFilterObject = getFilterObject;
exports.filterProductHits = filterProductHits;
exports.filterSearchProductHits = filterSearchProductHits;
