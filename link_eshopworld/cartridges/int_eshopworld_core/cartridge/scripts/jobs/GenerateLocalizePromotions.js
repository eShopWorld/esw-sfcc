'use strict';
/* global XML */

/* API Includes */
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');

/**
 * Get Fx Rate of shopper currency
 * @param {string} shopperCurrencyIso - getting from promotion configuration
 * @returns {array} returns selected FX rate
 */
function getESWCurrencyFXRate(shopperCurrencyIso) {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let fxRates = eswHelper.getPricingAdvisorData().fxRates,
        selectedFxRate = [];
    if (!empty(fxRates)) {
        selectedFxRate = fxRates.filter(function (rates) {
            return rates.toShopperCurrencyIso === shopperCurrencyIso;
        });
    }
    return selectedFxRate;
}

let extractMoney = function (string) {
    // eslint-disable-next-line
    let arrayString = string.split(" "),
        filteredArray = [];
    arrayString.forEach(function (item) {
        if (item.match(/\$[0-9]+(. [0-9]+)?/) && item.replace(/[0-9]+([,.][0-9]+)?/)) {
            // eslint-disable-next-line
            filteredArray.push({amount: item.replace(/[!@#$%^&*,+]/g, '')});
        }
    });
    if (filteredArray.length > 0) {
        return filteredArray;
    }
    return null;
};

/**
 * Calculate localized promotion callout message value based on FX rate calculated through selected currency.
 * @param {Object} xmlObject object
 * @param {array} selectedFxRate - select FX rate of local country
 * @param {array} storeFrontCurrencyCode - storeFrontCurrencyCode
 */
function localizePromotionCalloutMessgaeConversion(xmlObject, selectedFxRate, storeFrontCurrencyCode) {
    try {
        let iterator = xmlObject.elements();
        for (let i = 0, len = iterator.length(); i < len; i++) {
            let element = iterator[i];
            let elementName = iterator[i].localName();
            if (elementName === 'callout-msg') {
                let calloutMessageObj = element.children().toXMLString();
                if (calloutMessageObj.includes('esw-price')) {
                    let PromotionMessageWithoutHtml = calloutMessageObj.replace(/<[^>]*(>|$)|&nbsp;|&zwnj;|&raquo;|&laquo;|&gt;/g, '');
                    let discountCurrency = (!empty(PromotionMessageWithoutHtml) && PromotionMessageWithoutHtml && PromotionMessageWithoutHtml.match(/\$[0-9]+(. [0-9]+)?/)) ? '$' : '';
                    /* eslint-disable no-useless-escape */
                    let eswPrices = extractMoney(PromotionMessageWithoutHtml);
                    if (!empty(eswPrices) && discountCurrency) {
                        let priceElement;
                        // eslint-disable-next-line no-loop-func
                        eswPrices.forEach(function (eswPrice, index) {
                            let storeFrontCurrencySymbol = require('dw/util/Currency').getCurrency(storeFrontCurrencyCode).symbol;
                            let amount = Number(eswPrice.amount.replace(/\D+\.?\D+/g, ''));
                            if (index === 0) {
                                priceElement = element.children() ? element.children().toString()
                                .replace(discountCurrency + amount, storeFrontCurrencySymbol + Number((amount * selectedFxRate[0].rate).toFixed(2))) : '';
                            } else {
                                priceElement = priceElement
                                .replace(discountCurrency + amount, storeFrontCurrencySymbol + Number((amount * selectedFxRate[0].rate).toFixed(2)));
                            }
                        });
                        if (element.children() && !empty(priceElement)) {
                            element.setChildren(priceElement);
                        }
                    }
                }
                break;
            }
        }
    } catch (e) {
        Logger.error('ESW Localize Promotions Job error:', e.message, e.stack);
    }
}

/**
 * Script to get promotion id attribute
 * @param {Object} xmlObj The argument object
 * @param {string} attributeName The argument string
 * @param {string} defaultVal The argument string
 * @returns {string} - returns execute result
 */
function getAttributeStringValue(xmlObj, attributeName, defaultVal) {
    let val = xmlObj.attribute(attributeName);
    return !empty(val) ? val.toString() : defaultVal;
}

/**
 * Calculate localized promotion discount value based on FX rate calculated through selected currency.
 * @param {Object} xmlObject object
 * @param {array} selectedFxRate - select FX rate of local country
 * @param {string} conditionType parameter related to discounts element
 * @param {boolean} recursive parameter
 */
function localizePromotionDiscountConversion(xmlObject, selectedFxRate, conditionType, recursive) {
    let iterator = (recursive) ? xmlObject : xmlObject.elements();
    let conditionParam = conditionType;
    for (let i = 0, len = iterator.length(); i < len; i++) {
        let element = iterator[i];
        let elementName = iterator[i].localName();
        if (element.elements().length() > 0) {
            if (elementName === 'discounts') {
                conditionParam = (!conditionType) ? getAttributeStringValue(element, 'condition-type', null) : false;
            }
            localizePromotionDiscountConversion(element.elements(), selectedFxRate, conditionParam, true);
        } else if ((elementName === 'amount' || elementName === 'total-fixed-price' || elementName === 'fixed-price') && !empty(selectedFxRate)) {
            element = element.replace(0, Number((element * selectedFxRate[0].rate).toFixed(2)));
        } else if (elementName === 'currency') {
            element = element.replace(0, selectedFxRate[0].toShopperCurrencyIso);
        } else if (elementName === 'threshold' && (conditionType === 'product-amount' || conditionType === 'order-total' || conditionType === 'shipment-total')) {
            element = element.replace(0, Number((element * selectedFxRate[0].rate).toFixed(2)));
        }
    }
}

/**
  * Write promotion schema XML to IMPEX.
  * @param {Object} localizePromotion - selected local promotion
  * @param {Object} promotionCampaignAssignmentObject - selected local promotion
  * @param {string} filename - IMPEX path
  */
function writePromotionSchema(localizePromotion, promotionCampaignAssignmentObject, filename) {
    let xsw = new dw.io.XMLIndentingStreamWriter(new dw.io.FileWriter(new dw.io.File(filename)));
    xsw.writeRaw('<promotions xmlns="http://www.demandware.com/xml/impex/promotion/2008-01-31">');
    xsw.writeRaw(localizePromotion.toXMLString());
    xsw.writeRaw(promotionCampaignAssignmentObject.toXMLString());
    xsw.writeRaw('</promotions>');
    xsw.close();
}

/**
 * Get allowed currencies.
 * @param {Object} excludedCurrencies - excluded currencies config object
 * @returns {Object} returns allowed currencies object
 */
function getAllowedCurrencies(excludedCurrencies) {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    let allowedCurrencies = eswHelper.getAllowedCurrencies();
    if (!empty(excludedCurrencies)) {
        allowedCurrencies = allowedCurrencies.filter(function (obj) {
            return excludedCurrencies.indexOf(obj.value) === -1;
        });
    }
    return allowedCurrencies;
}

/**
 * Get promotion campaign assignment object
 * @param {string} basePromotionID promotion id in base promotion xml object
 * @param {string} campaignId campaign id from custom preference
 * @param {string} CurrencyCode currency code from allowed currencies
 * @param {Object} args job argument parameters
 * @returns {Object} returns promotionCampaignAssignmentObject
 */
function getPromotionCampaignAssignmentObject(basePromotionID, campaignId, CurrencyCode, args) {
    let promotionCampaignAssignmentObject = '';
    let basePromotionsFilePath = new dw.io.File(args.impexDirPath + '/base_promotions.xml');
    let fileReader = new dw.io.FileReader(basePromotionsFilePath, 'UTF-8');
    let xmlStreamReader = new dw.io.XMLStreamReader(fileReader);
    while (xmlStreamReader.hasNext()) {
        if (xmlStreamReader.next() === dw.io.XMLStreamConstants.START_ELEMENT) {
            let localElementName = xmlStreamReader.getLocalName();
            if (localElementName === 'promotion-campaign-assignment') {
                let basePromotionCampaignAssignmentXmlObj = xmlStreamReader.readXMLObject();
                let promotionId = getAttributeStringValue(basePromotionCampaignAssignmentXmlObj, 'promotion-id', null);
                let basePromotionCampaignId = getAttributeStringValue(basePromotionCampaignAssignmentXmlObj, 'campaign-id', null);
                // eslint-disable-next-line eqeqeq
                if (promotionId == basePromotionID) {
                    promotionCampaignAssignmentObject = new XML(basePromotionCampaignAssignmentXmlObj);
                    promotionCampaignAssignmentObject.attribute('promotion-id').replace(0, basePromotionID + '_' + CurrencyCode);
                    // eslint-disable-next-line eqeqeq
                    if (!empty(campaignId) && campaignId != basePromotionCampaignId) {
                        promotionCampaignAssignmentObject.attribute('campaign-id').replace(0, campaignId);
                    }
                }
            }
        }
    }
    xmlStreamReader.close();
    fileReader.close();
    return promotionCampaignAssignmentObject;
}

/**
 * Build promotion schema XML.
 * @param {string} writeDirPath - IMPEX path
 * @param {Object} basePromotionObj - selected local promotion
 * @param {Object} localizeObj configured in site preference
 * @param {Object} args object
 * @returns {Integer} returns totalAssignedPromotions after schema build
 */
function buildPromotionSchema(writeDirPath, basePromotionObj, localizeObj, args) {
    let File = require('dw/io/File');
    let Site = require('dw/system/Site').getCurrent();
    let campaignId = localizeObj.campaignId;
    // Get currencies to generate promotions
    let excludedCurrencies = localizeObj.excludeCurrencies;
    let allowedCurrencies = getAllowedCurrencies(excludedCurrencies);
    let totalAssignedPromotions = 0;
    allowedCurrencies.forEach(function (currency) {
        let localizePromotion = new XML(basePromotionObj);
        let CurrencyCode = currency.value;
        let writeDir = new File(writeDirPath);
        writeDir.mkdirs();
        if (empty(basePromotionObj)) {
            return totalAssignedPromotions;
        }
        let basePromoId = localizeObj.basePromoId.replace(/[^a-zA-Z0-9 ]/g, '');
        let promotionFile = writeDirPath + 'PromotionExport_' + Site.getID() + '_' + basePromoId + '_' + CurrencyCode + '.xml';
        let selectedFxRate = getESWCurrencyFXRate(CurrencyCode);
        localizePromotion.attribute('promotion-id').replace(0, basePromotionObj.attribute('promotion-id') + '_' + CurrencyCode);
        if (!empty(selectedFxRate[0]) && selectedFxRate[0].rate !== 1) {
            localizePromotionCalloutMessgaeConversion(localizePromotion, selectedFxRate, CurrencyCode);
            localizePromotionDiscountConversion(localizePromotion, selectedFxRate);
            let promotionCampaignAssignmentObject = getPromotionCampaignAssignmentObject(basePromotionObj.attribute('promotion-id'), campaignId, CurrencyCode, args);
            writePromotionSchema(localizePromotion, promotionCampaignAssignmentObject, promotionFile);
            totalAssignedPromotions++;
        }
        return totalAssignedPromotions;
    });
    return totalAssignedPromotions;
}

/**
 * Script to build Promotion schema.
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */
function execute(args) {
    let eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    try {
        let localizedPromotionsConfig = JSON.parse(eswHelper.getLocalizedPromotionsConfig());
        if (!empty(localizedPromotionsConfig)) {
            let writeDirPath = args.impexDirPath;
            let basePromotionsFilePath = new dw.io.File(args.impexDirPath + '/base_promotions.xml');
            let fileReader = new dw.io.FileReader(basePromotionsFilePath, 'UTF-8');
            let xmlStreamReader = new dw.io.XMLStreamReader(fileReader);
            while (xmlStreamReader.hasNext()) {
                if (xmlStreamReader.next() === dw.io.XMLStreamConstants.START_ELEMENT) {
                    let localElementName = xmlStreamReader.getLocalName();
                    if (localElementName === 'promotion') {
                        let basePromotionXmlObj = xmlStreamReader.readXMLObject();
                        let promotionId = getAttributeStringValue(basePromotionXmlObj, 'promotion-id', null);
                        // eslint-disable-next-line no-loop-func
                        localizedPromotionsConfig.forEach(function (localizeObj) {
                            let basePromoId = localizeObj.basePromoId;
                            if (basePromoId === promotionId) {
                                let totalAssignedPromotions = buildPromotionSchema(writeDirPath, basePromotionXmlObj, localizeObj, args);
                                Logger.info('{0} localized promotions generated for base promotion {1}', totalAssignedPromotions, basePromoId);
                            }
                        });
                    }
                }
            }
            xmlStreamReader.close();
            fileReader.close();
        } else {
            Logger.error('ESW Localize Promotions Job error: Missing localize promotions configuration');
            eswHelper.eswInfoLogger('Error', '', 'ESW Localize Promotions Job error', 'Missing localize promotions configuration');
            return new Status(Status.ERROR);
        }
    } catch (e) {
        Logger.error('ESW Localize Promotions Job error: ' + e);
        eswHelper.eswInfoLogger('GenerateLocalizePromotions Error', e, e.message, e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
