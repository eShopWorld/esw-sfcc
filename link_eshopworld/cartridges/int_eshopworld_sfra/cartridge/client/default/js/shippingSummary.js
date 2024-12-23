document.addEventListener('DOMContentLoaded', function () {
    let itemEPJ = document.querySelectorAll('.item_epj');

    itemEPJ.forEach(function (item) {
        let trackingNumber = item.getAttribute('data-tracking-number');
        let tooltipId = 'tooltip-' + trackingNumber;
        let tooltipText = document.getElementById(tooltipId);

        /**
         * Shows the tooltip for the item.
         */
        function showTooltip() {
            if (tooltipText && tooltipText.classList.contains('tooltiptext')) {
                // No need to set the innerHTML dynamically, as it's already set in the ISML template
                tooltipText.style.visibility = 'visible';
                tooltipText.style.opacity = '1';
                tooltipText.setAttribute('aria-hidden', 'false');
                item.setAttribute('aria-describedby', tooltipId);
            }
        }

        /**
         * Hides the tooltip associated with the item.
         */
        function hideTooltip() {
            if (tooltipText && tooltipText.classList.contains('tooltiptext')) {
                tooltipText.style.visibility = 'hidden';
                tooltipText.style.opacity = '0';
                tooltipText.setAttribute('aria-hidden', 'true');
                item.removeAttribute('aria-describedby');
            }
        }

        item.addEventListener('mouseenter', showTooltip);
        item.addEventListener('mouseleave', hideTooltip);
        item.addEventListener('focus', showTooltip);
        item.addEventListener('blur', hideTooltip);
    });
});
