'use strict';

// Form index count for adding new package resource
let formIndexCount = 0;

$(document).ready(function () {
    // If mixed form has already some data
    formIndexCount = parseInt($('#js-pkgResourceHtmlTemplate').attr('data-count-start'), 10);

    $('.js-form-selection').change(function () {
        if ($(this).val() === 'mixed') {
            $('.js-mixed-selection').removeClass('hidden');
        } else {
            $('.js-mixed-selection').addClass('hidden');
        }
    });

  // Add Row
    $('.js-addPkgResource').click(function () {
        formIndexCount += 1;
        let pkgResourceHtml = $('#js-pkgResourceHtmlTemplate').html().replace(/formIndex/g, formIndexCount);
        // Create a jQuery object from the HTML string
        let $newElement = $(pkgResourceHtml);
        // Append the new element to the container and hide it initially
        $('.js-pkgResourceBody').append($newElement.hide());
        // Fade in the new element
        $newElement.fadeIn(10);
    });

  // Remove Row
    $(document).on('click', '.js-delete', function () {
        $(this)
      .closest('tr')
      .fadeOut(10, function () {
          $(this).remove();
      });
    });
});
