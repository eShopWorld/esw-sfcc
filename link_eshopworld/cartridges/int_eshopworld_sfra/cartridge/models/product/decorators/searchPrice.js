'use strict';

const pricingHelper = require('*/cartridge/scripts/helpers/pricing');
const PriceBookMgr = require('dw/catalog/PriceBookMgr');
const DefaultPrice = require('*/cartridge/models/price/default');
const RangePrice = require('*/cartridge/models/price/range');
const eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * Get list price for a given product
 * @param {dw.catalog.ProductSearchHit} hit - current product returned by Search API.
 * @param {function} getSearchHit - function to find a product using Search API.
 *
 * @returns {Object} - price for a product
 */
function getListPrices(hit, getSearchHit) {
    let priceModel = hit.firstRepresentedProduct.getPriceModel();
    if (!priceModel.priceInfo) {
        return {};
    }
    let rootPriceBook = pricingHelper.getRootPriceBook(priceModel.priceInfo.priceBook);
    if (rootPriceBook.ID === priceModel.priceInfo.priceBook.ID) {
        return { minPrice: hit.minPrice, maxPrice: hit.maxPrice };
    }
    let searchHit;
    let currentApplicablePriceBooks = PriceBookMgr.getApplicablePriceBooks();
    try {
        PriceBookMgr.setApplicablePriceBooks(rootPriceBook);
        searchHit = getSearchHit(hit.product);
    } catch (e) {
        searchHit = hit;
    } finally {
        // Clears price book ID's stored to the session.
        // When switching locales, there is nothing that clears the price book ids stored in the
        // session, so subsequent searches will continue to use the ids from the originally set
        // price books which have the wrong currency.
        let availableCountry = eswHelper.getAvailableCountry(),
            overridePriceBooks = eswHelper.getOverridePriceBooks(availableCountry);

        if (eswHelper.getEShopWorldModuleEnabled() && overridePriceBooks.length > 0 && eswHelper.getSelectedCountryDetail(availableCountry).isFixedPriceModel) {
            let arrPricebooks = [];
            overridePriceBooks.map(function (pricebookId) { // eslint-disable-line array-callback-return
                arrPricebooks.push(PriceBookMgr.getPriceBook(pricebookId));
            });
            PriceBookMgr.setApplicablePriceBooks(arrPricebooks);
        } else {
            /* eslint-disable no-lonely-if */
            if (currentApplicablePriceBooks && currentApplicablePriceBooks.length) {
                PriceBookMgr.setApplicablePriceBooks(currentApplicablePriceBooks.toArray());
            } else {
                PriceBookMgr.setApplicablePriceBooks();
            }
        }
    }

    if (searchHit) {
        if (searchHit.minPrice.available && searchHit.maxPrice.available) {
            return {
                minPrice: searchHit.minPrice,
                maxPrice: searchHit.maxPrice
            };
        }
        return {
            minPrice: hit.minPrice,
            maxPrice: hit.maxPrice
        };
    }

    return {};
}

module.exports = function (object, searchHit, activePromotions, getSearchHit) {
    Object.defineProperty(object, 'price', {
        enumerable: true,
        value: (function () {
            let salePrice = { minPrice: searchHit.minPrice, maxPrice: searchHit.maxPrice };
            let promotions = pricingHelper.getPromotions(searchHit, activePromotions);
            if (promotions.getLength() > 0) {
                let promotionalPrice = pricingHelper.getPromotionPrice(searchHit.firstRepresentedProduct, promotions);
                if (promotionalPrice && promotionalPrice.available) {
                    salePrice = { minPrice: promotionalPrice, maxPrice: promotionalPrice };
                }
            }
            let listPrice = getListPrices(searchHit, getSearchHit);

            if (salePrice.minPrice.value !== salePrice.maxPrice.value) {
                // range price
                return new RangePrice(salePrice.minPrice, salePrice.maxPrice);
            }
            if (listPrice.minPrice && listPrice.minPrice.valueOrNull !== null) {
                if (listPrice.minPrice.value !== salePrice.minPrice.value) {
                    return new DefaultPrice(salePrice.minPrice, listPrice.minPrice);
                }
            }
            return new DefaultPrice(salePrice.minPrice);
        }())
    });
};
