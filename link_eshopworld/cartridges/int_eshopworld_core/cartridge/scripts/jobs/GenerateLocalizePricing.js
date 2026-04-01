'use strict';

/* API Includes */
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');

/**
 * Script to build PriceBook schema.
 * If price book exist: Find and update products with missing prices without modifying the existing products prices.
 * If price book does not exist: Generate a Price Book for a required/specified currency in the site preferences
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */
function execute(args) {
    let eswGenerateLocalizePricingHelper = require('*/cartridge/scripts/helper/eswGenerateLocalizePricingHelper');
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    try {
        let localizedPricingCountries = JSON.parse(eswHelper.getLocalizedPricingCountries());
        let writeDirPath = args.impexDirPath;
        let totalAssignedProducts;

        localizedPricingCountries.forEach(function (localizeObj) {
            let localizePriceBooks = eswGenerateLocalizePricingHelper.getLocalPriceBooksDetails(localizeObj);
            if (!empty(localizePriceBooks)) {
                localizePriceBooks.forEach(function (priceBook) {
                    totalAssignedProducts = eswGenerateLocalizePricingHelper.buildPriceBookSchema(writeDirPath, priceBook, localizeObj);
                    Logger.info('{0} products localized prices assigned to new price book {1}', totalAssignedProducts, priceBook.id);
                });
            }
        });
    } catch (e) {
        Logger.error('ESW Localize Pricing Job error: ' + e);
        eswHelper.eswInfoLogger('Localized Pricing Job error', e, e.message, e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
