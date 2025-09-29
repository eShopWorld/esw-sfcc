'use strict';

$(document).ready(function () {
    let iframeFailedLogUrl = $('[data-esw-iframe-failed-log-url]').attr('data-esw-iframe-failed-log-url');
    let iframeFallbackUrl = $('[data-esw-iframe-failed-fallback-url]').attr('data-esw-iframe-failed-fallback-url');
    let eswCheckoutUrl = $('[data-esw-checkout-url]').attr('data-esw-checkout-url');
    let iframeContainer = $('.esw-iframe-checkout');
    /**
     * Checks if `iframe` is supported in the browser.
     *
     * @returns {boolean} True if `iframe` is supported, false otherwise.
     */
    function isIframeSupported() {
        let iframe = document.createElement('iframe');
        return typeof iframe !== 'undefined' && iframe !== null;
    }
    /**
     * Checks if a given string is a valid URL.
     *
     * @param {string} url - The URL string to validate.
     * @returns {boolean} True if the string is a valid URL, false otherwise.
     */
    function isValidUrl(url) {
        try {
            // eslint-disable-next-line no-new
            new URL(url); // Attempt to create a URL object
            return true;  // If no error is thrown, the URL is valid
        } catch (e) {
            return false; // If an error is thrown, the URL is invalid
        }
    }
    /**
     * Actions if iframe is not supported or no checkout URL is found
     */
    function handleIframeError() {
        $.ajax({
            type: 'POST',
            url: iframeFailedLogUrl,
            complete: function () {
                if (iframeFallbackUrl
                        && typeof iframeFallbackUrl !== 'undefined'
                        && iframeFallbackUrl.length > 0
                        && isValidUrl(iframeFallbackUrl)) {
                    window.location.href = iframeFallbackUrl;
                }
            }
        });
    }

    /**
     * Function to remove header and footer dropdowns in checkout iframe page
     */
    function removeHeaderFooterWelcomeMatt() {
        // Check if the current URL path matches the target page
        if (window.location.href.includes('/EShopWorld-EswEmbeddedCheckout') || window.location.href.includes('/EShopWorldSG-EswEmbeddedCheckout')) {
            // Select the element and remove it if it exists
            $('.selector-container.headerDropdown').remove();
            $('.selector-container.footerDropdown').remove();
        }
    }

    /**
     * Check if iframe is loaded within 7 seconds
     */
    function checkIframeLoaded() {
        if (iframeContainer) {
            let iframeLoaded = false;
            if (!isIframeSupported && !isValidUrl(eswCheckoutUrl)) {
                handleIframeError();
                return;
            }
        // Use MutationObserver to detect when iframe is added to the DOM
            const observer = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    if (mutation.type === 'childList') {
                        let iframe = iframeContainer.find('iframe'); // Check if iframe exists
                        if (iframe.length > 0) {
                        // Attach load event listener to iframe
                            iframe.on('load', function () {
                                iframeLoaded = true;
                                observer.disconnect(); // Stop observing once iframe is loaded
                            });
                        }

                        setTimeout(function () {
                            if (!iframeLoaded) {
                            // Redirect to fallback URL if iframe is not loaded
                                $.ajax({
                                    type: 'POST',
                                    url: iframeFailedLogUrl,
                                    complete: function () {
                                        if (eswCheckoutUrl &&
                            typeof eswCheckoutUrl !== 'undefined' &&
                            eswCheckoutUrl.length > 0) {
                                            window.location.href = eswCheckoutUrl;
                                        }
                                    }
                                });
                            }
                        }, 7000);
                    }
                });
            });

            // Start observing the parent div for child changes
            if (iframeContainer[0]) {
                observer.observe(iframeContainer[0], { childList: true });
            }
        }
    }

    // Call the function to check iframe not supported
    checkIframeLoaded();
    removeHeaderFooterWelcomeMatt();
});
