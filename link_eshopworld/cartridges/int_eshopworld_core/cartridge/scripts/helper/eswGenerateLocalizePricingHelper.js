'use strict';

let localizePriceHelpers = {
    /**
     * Get ESW Country Adjustments for localize country
     * @param {string} deliveryCountryIso - localize country code
     * @returns {array} returns selected country adjustment
     */
    getESWCountryAdjustments: function (deliveryCountryIso) {
        let eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        let countryAdjustment = eswHelper.getPricingAdvisorData().countryAdjustment,
            selectedCountryAdjustment = [];
        if (!empty(countryAdjustment)) {
            selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
                return adjustment.deliveryCountryIso === deliveryCountryIso;
            });
        }
        return selectedCountryAdjustment;
    },
    /**
     * Get Fx Rate of shopper currency
     * @param {string} shopperCurrencyIso - getting from site preference
     * @param {string} localizeCountry - shopper local country getting from site preference
     * @returns {array} returns selected fx rate
     */
    getESWCurrencyFXRate: function (shopperCurrencyIso, localizeCountry) {
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
    },
    /**
     * Get Rounding Model for localize country
     * @param {Object} localizeObj configured in site preference
     * @returns {array} returns selected rounding rule
     */
    getESWRoundingModel: function (localizeObj) {
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
    },
    /**
     * Get local price books details mentioned in site prefrence.
     * @param {Object} localizeObj configured in site preference
     * @returns {array} returns price books detail in array
     */
    getLocalPriceBooksDetails: function (localizeObj) {
        let PriceBookMgr = require('dw/catalog/PriceBookMgr');
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
    },
    /**
     * Check product price calculation allowed in local currency for localize country
     * @param {Object} product object
     * @param {string} localizeCountry - Localize country ISO
     * @returns {boolean} returns price calculation allowed or not
     */
    noPriceCalculationAllowed: function (product, localizeCountry) {
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
    },
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
    localizePricingConversion: function (product, basePriceBook, localizeObj, selectedFxRate, selectedCountryAdjustments, selectedRoundingRule) {
        let eswCalculationHelper = require('*/cartridge/scripts/helper/eswCalculationHelper').getEswCalculationHelper;
        let productPriceModel = product.getPriceModel(),
            localizePrice = null;
        if (!productPriceModel.priceInfo || this.noPriceCalculationAllowed(product, localizeObj.localizeCountryObj.countryCode)) {
            return localizePrice;
        }
        let baseProductPrice = productPriceModel.getPriceBookPrice(basePriceBook.getID());
        if ((baseProductPrice.valueOrNull !== null)) {
            if (!empty(selectedFxRate)) {
                localizePrice = eswCalculationHelper.getMoneyObject(baseProductPrice, false, false, localizeObj.applyRoundingModel.toLowerCase() !== 'true', {
                    selectedCountry: selectedCountryAdjustments[0].deliveryCountryIso,
                    selectedFxRate: selectedFxRate[0],
                    selectedCountryAdjustments: selectedCountryAdjustments[0],
                    selectedRoundingRule: selectedRoundingRule[0]
                });
            }
        }
        return localizePrice;
    },
    buildPriceBookSchema: function (writeDirPath, priceBook, localizeObj) {
        let thisObj = this;
        let PriceBookMgr = require('dw/catalog/PriceBookMgr');
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
        let selectedFxRate = this.getESWCurrencyFXRate(localizeObj.localizeCountryObj.currencyCode, localizeObj.localizeCountryObj.countryCode);
        if (empty(selectedFxRate)) {
            return totalAssignedProducts;
        }
        let selectedCountryAdjustments = this.getESWCountryAdjustments(localizeObj.localizeCountryObj.countryCode);
        let selectedRoundingRule = this.getESWRoundingModel(localizeObj);

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
                    let localizedPrice = thisObj.localizePricingConversion(product, basePriceBook, localizeObj, selectedFxRate, selectedCountryAdjustments, selectedRoundingRule);
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

};

module.exports = localizePriceHelpers;
