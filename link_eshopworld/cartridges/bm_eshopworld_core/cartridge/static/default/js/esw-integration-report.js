'use strict';

$(document).ready(function () {
    $('#ireport .tab').on('click', function () {
        $('#ireport .header').removeClass('active');
        $('#ireport .esw-ir').removeClass('active').hide();
        $(this).addClass('active');

        const targetId = $(this).data('target');
        if (targetId) {
            $(`#${targetId}`).addClass('active').show();
        }
    });
});

