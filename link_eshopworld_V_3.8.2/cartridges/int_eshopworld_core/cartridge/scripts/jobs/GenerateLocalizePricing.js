'use strict';

/* API Includes */
const Logger = require('dw/system/Logger');
const PriceBookMgr = require('dw/catalog/PriceBookMgr');
const Status = require('dw/system/Status');

/**
 * Get local price books details mentioned in site prefrence.
 * @param {Object} localizeObj configured in site preference
 * @returns {array} returns price books detail in array
 */
function getLocalPriceBooksDetails(localizeObj) {
    let currencyCode = localizeObj.localizeCountryObj.currencyCode,
        localListPriceBook = localizeObj.localizeCountryObj.localListPriceBook,
        localSalePriceBook = localizeObj.localizeCountryObj.localSalePriceBook,
        localizePriceBooks = [];

    if (!empty(localListPriceBook)) {
        let listPriceBookObj = PriceBookMgr.getPriceBook(localListPriceBook);
        if ((empty(listPriceBookObj)) || (!empty(listPriceBookObj) && listPriceBookObj.getCurrencyCode() === currencyCode)) {
            localizePriceBooks.push({
                localPriceBook: listPriceBookObj,
                type: 'list',
                id: localListPriceBook
            });
        }
    }
    if (!empty(localSalePriceBook)) {
        let salePriceBookObj = PriceBookMgr.getPriceBook(localSalePriceBook);
        if ((empty(salePriceBookObj)) || (!empty(salePriceBookObj) && salePriceBookObj.getCurrencyCode() === currencyCode)) {
            localizePriceBooks.push({
                localPriceBook: salePriceBookObj,
                type: 'sale',
                id: localSalePriceBook
            });
        }
    }
    return localizePriceBooks;
}

/**
 * Get Fx Rate of shopper currency
 * @param {string} shopperCurrencyIso - getting from site preference
 * @param {string} localizeCountry - shopper local country getting from site preference
 * @returns {array} returns selected fx rate
 */
function getESWCurrencyFXRate(shopperCurrencyIso, localizeCountry) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let fxRates = eswHelper.getPricingAdvisorData().fxRates,
        baseCurrency = eswHelper.getBaseCurrencyPreference(localizeCountry),
        selectedFxRate = [];
    if (!empty(fxRates)) {
        selectedFxRate = fxRates.filter(function (rates) {
            return rates.toShopperCurrencyIso === shopperCurrencyIso && rates.fromRetailerCurrencyIso === baseCurrency;
        });
    }
    return selectedFxRate;
}

/**
 * Get localized price after applying country adjustment
 * @param {number} localizePrice - after applying fx rate
 * @param {array} selectedCountryAdjustment - getting from site preference for specific local country
 * @returns {number} returns calculated localized price
 */
function applyESWCountryAdjustments(localizePrice, selectedCountryAdjustment) {
    /* eslint-disable no-mixed-operators */
    /* eslint-disable no-new-wrappers */
    /* eslint-disable no-param-reassign */
    if (!empty(selectedCountryAdjustment)) {
        // applying adjustment
        localizePrice += new Number((selectedCountryAdjustment[0].retailerAdjustments.priceUpliftPercentage / 100 * localizePrice));
        // applying duty
        localizePrice += new Number((selectedCountryAdjustment[0].estimatedRates.dutyPercentage / 100 * localizePrice));
        // applying tax
        localizePrice += new Number((selectedCountryAdjustment[0].estimatedRates.taxPercentage / 100 * localizePrice));
    }
    return localizePrice;
}

/**
 * Get ESW Country Adjustments for localize country
 * @param {string} deliveryCountryIso - localize country code
 * @returns {array} returns selected country adjustment
 */
function getESWCountryAdjustments(deliveryCountryIso) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let countryAdjustment = eswHelper.getPricingAdvisorData().countryAdjustment,
        selectedCountryAdjustment = [];
    if (!empty(countryAdjustment)) {
        selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
            return adjustment.deliveryCountryIso === deliveryCountryIso;
        });
    }
    return selectedCountryAdjustment;
}

/**
 * Get localized price after applying rounding model
 * @param {number} localizePrice - price after applying fx rate & country adjustment
 * @param {array} selectedRoundingRule - selected rounding rule
 * @returns {number} returns calculated localized price
 */
function applyESWRoundingRule(localizePrice, selectedRoundingRule) {
    if (!empty(selectedRoundingRule)) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        localizePrice = eswHelper.applyRoundingModel(localizePrice, selectedRoundingRule[0]);
    }
    return localizePrice;
}

/**
 * Get Rounding Model for localize country
 * @param {Object} localizeObj configured in site preference
 * @returns {array} returns selected rounding rule
 */
function getESWRoundingModel(localizeObj) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    let roundingModels = eswHelper.getPricingAdvisorData().roundingModels,
        selectedRoundingModel,
        selectedRoundingRule = [];
    if (localizeObj.applyRoundingModel.toLowerCase() === 'true' && !empty(roundingModels)) {
        selectedRoundingModel = roundingModels.filter(function (rule) {
            return rule.deliveryCountryIso === localizeObj.localizeCountryObj.countryCode;
        });

        selectedRoundingRule = selectedRoundingModel[0].roundingModels.filter(function (rule) {
            return rule.currencyIso === localizeObj.localizeCountryObj.currencyCode;
        });
    }
    return selectedRoundingRule;
}

/**
 * Check product price calculation allowed in local currency for localize country
 * @param {Object} product object
 * @param {string} localizeCountry - Localize country ISO
 * @returns {boolean} returns price calculation allowed or not
 */
function noPriceCalculationAllowed(product, localizeCountry) {
    let priceFreezeCountries = ('eswProductPriceFreezeCountries' in product.custom) ? product.custom.eswProductPriceFreezeCountries : null,
        returnFlag = false;
    if (!empty(priceFreezeCountries)) {
        Object.keys(priceFreezeCountries).forEach(function (key) {
            if (priceFreezeCountries[key].toLowerCase() === 'all' || priceFreezeCountries[key].toLowerCase() === localizeCountry.toLowerCase()) {
                returnFlag = true;
            }
            return returnFlag;
        });
    }
    return returnFlag;
}

/**
 * Calculate localized price of selected product using base price book, FxRate, country adjustment & rounding model
 * @param {Object} product object
 * @param {Object} basePriceBook - tenant base currency price book
 * @param {Object} localizeObj configured in site preference
 * @param {array} selectedFxRate - select FX rate of local country
 * @param {array} selectedCountryAdjustments - selected country adjusment
 * @param {array} selectedRoundingRule - selected rounding model
 * @returns {number} returns calculated localized price
 */
function localizePricingConversion(product, basePriceBook, localizeObj, selectedFxRate, selectedCountryAdjustments, selectedRoundingRule) {
    let productPriceModel = product.getPriceModel(),
        localizePrice = null;
    if (!productPriceModel.priceInfo || noPriceCalculationAllowed(product, localizeObj.localizeCountryObj.countryCode)) {
        return localizePrice;
    }
    let baseProductPrice = productPriceModel.getPriceBookPrice(basePriceBook.getID());
    if ((baseProductPrice.valueOrNull !== null)) {
        localizePrice = new Number(baseProductPrice.value);
        if (!empty(selectedFxRate)) {
            localizePrice = (localizeObj.applyCountryAdjustments.toLowerCase() === 'true') ? applyESWCountryAdjustments(localizePrice, selectedCountryAdjustments) : localizePrice;
            localizePrice = new Number((localizePrice * selectedFxRate[0].rate).toFixed(2));
            localizePrice = (localizeObj.applyRoundingModel.toLowerCase() === 'true') ? applyESWRoundingRule(localizePrice, selectedRoundingRule) : localizePrice;
        }
    }
    return localizePrice;
}

/**
 * Build price book schema XML.
 * @param {string} writeDirPath - IMPEX path
 * @param {Object} priceBook - selected price book
 * @param {Object} localizeObj configured in site preference
 * @returns {boolean} returns boolean after schema build
 */
function buildPriceBookSchema(writeDirPath, priceBook, localizeObj) {
    let File = require('dw/io/File');
    let FileWriter = require('dw/io/FileWriter');
    let XMLStreamWriter = require('dw/io/XMLStreamWriter');
    let Site = require('dw/system/Site').getCurrent();
    let ProductSearchModel = require('dw/catalog/ProductSearchModel'),
        psm = new ProductSearchModel(),
        products;
    psm.setCategoryID('root');
    psm.setRecursiveCategorySearch(true);
    psm.search();

    let salableProducts = psm.getProductSearchHits();

    let writeDir = new File(writeDirPath);
    writeDir.mkdirs();
    let totalAssignedProducts = 0;
    let basePriceBook = (priceBook.type.toLowerCase() === 'list') ? PriceBookMgr.getPriceBook(localizeObj.baseListPriceBook) : PriceBookMgr.getPriceBook(localizeObj.baseSalePriceBook);
    if (empty(basePriceBook)) {
        return totalAssignedProducts;
    }
    let priceBookFile = new File(writeDirPath + 'PriceBookExport_' + Site.getID() + '_' + priceBook.id + '.xml');
    let selectedFxRate = getESWCurrencyFXRate(localizeObj.localizeCountryObj.currencyCode, localizeObj.localizeCountryObj.countryCode);
    if (empty(selectedFxRate)) {
        return totalAssignedProducts;
    }
    let selectedCountryAdjustments = getESWCountryAdjustments(localizeObj.localizeCountryObj.countryCode);
    let selectedRoundingRule = getESWRoundingModel(localizeObj);

    priceBookFile.createNewFile();
    let priceBookFileWriter = new FileWriter(priceBookFile, 'UTF-8');
    let priceBookStreamWriter = new XMLStreamWriter(priceBookFileWriter);
    priceBookStreamWriter.writeStartElement('pricebooks');
    priceBookStreamWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/pricebook/2006-10-31');
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('pricebook');
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('header');
    priceBookStreamWriter.writeAttribute('pricebook-id', priceBook.id);
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('currency');
    priceBookStreamWriter.writeCharacters((!empty(priceBook.localPriceBook)) ? priceBook.localPriceBook.getCurrencyCode() : localizeObj.localizeCountryObj.currencyCode);
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('display-name');
    priceBookStreamWriter.writeAttribute('xml:lang', 'x-default');
    priceBookStreamWriter.writeCharacters((!empty(priceBook.localPriceBook)) ? priceBook.localPriceBook.getDisplayName() : priceBook.id);
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('online-flag');
    priceBookStreamWriter.writeCharacters('true');
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    if (!empty(priceBook.localPriceBook) && !empty(priceBook.localPriceBook.getParentPriceBook())) {
        priceBookStreamWriter.writeStartElement('parent');
        priceBookStreamWriter.writeCharacters(priceBook.localPriceBook.getParentPriceBook().getID());
        priceBookStreamWriter.writeEndElement();
        priceBookStreamWriter.writeCharacters('\n');
    } else if (empty(priceBook.localPriceBook) && priceBook.type.toLowerCase() === 'sale') {
        priceBookStreamWriter.writeStartElement('parent');
        priceBookStreamWriter.writeCharacters(localizeObj.localizeCountryObj.localListPriceBook);
        priceBookStreamWriter.writeEndElement();
        priceBookStreamWriter.writeCharacters('\n');
    }
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeStartElement('price-tables');
    priceBookStreamWriter.writeCharacters('\n');
    if (!empty(selectedFxRate)) {
        while (salableProducts.hasNext()) {
            products = salableProducts.next().getRepresentedProducts().toArray();
            products.forEach(function (product) { // eslint-disable-line no-loop-func
                let localizedPrice = localizePricingConversion(product, basePriceBook, localizeObj, selectedFxRate, selectedCountryAdjustments, selectedRoundingRule);
                if (!empty(localizedPrice)) {
                    priceBookStreamWriter.writeStartElement('price-table');
                    priceBookStreamWriter.writeAttribute('product-id', product.getID());
                    priceBookStreamWriter.writeCharacters('\n');
                    priceBookStreamWriter.writeStartElement('amount');
                    priceBookStreamWriter.writeAttribute('quantity', '1');
                    priceBookStreamWriter.writeCharacters(localizedPrice);
                    priceBookStreamWriter.writeEndElement();
                    priceBookStreamWriter.writeCharacters('\n');
                    priceBookStreamWriter.writeEndElement();
                    totalAssignedProducts++;
                }
            });
        }
    }
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.close();
    priceBookFileWriter.close();
    return totalAssignedProducts;
}

/**
 * Script to build PriceBook schema.
 * If price book exist: Find and update products with missing prices without modifying the existing products prices.
 * If price book does not exist: Generate a Price Book for a required/specified currency in the site preferences
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */
function execute(args) {
    let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    try {
        let localizedPricingCountries = JSON.parse(eswHelper.getLocalizedPricingCountries());
        let writeDirPath = args.impexDirPath;
        let totalAssignedProducts;

        localizedPricingCountries.forEach(function (localizeObj) {
            var	localizePriceBooks = getLocalPriceBooksDetails(localizeObj);
            if (!empty(localizePriceBooks)) {
                localizePriceBooks.forEach(function (priceBook) {
                    totalAssignedProducts = buildPriceBookSchema(writeDirPath, priceBook, localizeObj);
                    Logger.info('{0} products localized prices assigned to new price book {1}', totalAssignedProducts, priceBook.id);
                });
            }
        });
    } catch (e) {
        Logger.error('ESW Localize Pricing Job error: ' + e);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
