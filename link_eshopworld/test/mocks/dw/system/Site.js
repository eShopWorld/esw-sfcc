class Site {
    constructor() {
        this.ID = 'SiteID';
        this.name = 'Site Name';
        this.preferences = {};
        this.customPreferences = {};
        this.getCurrent = function () {
            return new Site();
        }
    }

    static getCurrent() {
        return new Site();
    }
    static getCalendar() {
        return new (require('../util/Calendar'))();
    }

    getCurrencyCode() {
        return this.currencyCode;
    }
    getName() {
        return this.name;
    }
    getID() {
        return this.ID;
    }
    getPreferences() {
        return this.preferences;
    }
    getHttpHostName() {
        return this.httpHostName;
    }
    getHttpsHostName() {
        return this.httpsHostName;
    }
    getCustomPreferenceValue(key) {
        return (this.customPreferences && this.customPreferences[key]) || undefined;
    }
    setCustomPreferenceValue(key, value) {
        this.customPreferences = this.customPreferences || {};
        this.customPreferences[key] = value;
    }
    getDefaultLocale() {
        return this.defaultLocale;
    }
    getAllowedLocales() {
        return this.allowedLocales;
    }
    getAllowedCurrencies() {
        return this.allowedCurrencies;
    }
    getDefaultCurrency() {
        return this.defaultCurrency;
    }
    getTimezone() {
        return this.timezone;
    }
    getTimezoneOffset() {
        return this.timezoneOffset;
    }
    isOMSEnabled() {
        return this.isOMSEnabled;
    }
}

module.exports = Site;
