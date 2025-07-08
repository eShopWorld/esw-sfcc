$(document).ready(function () {
    let eswLandingPageUrl = $('.headerDropdown, .footerDropdown').attr('data-url');
    let dataObj = {
        eswLandingPageUrl: eswLandingPageUrl,
        dropDownSelection: 'true'
    };
    let ignoreAlert = window.localStorage.getItem('esw.GeoIpChangeIgnore');
    let currentCountry = $('script#eswMattAutoOpen').attr('data-current-geo-location');
    if (typeof ignoreAlert === 'undefined' || ignoreAlert === null || ignoreAlert !== currentCountry) {
        window.openEswCountrySwitcher(dataObj, currentCountry);
    }
});
