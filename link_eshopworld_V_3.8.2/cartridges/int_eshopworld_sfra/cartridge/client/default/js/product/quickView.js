'use strict';

var baseQuickView = require('base/product/quickView');

baseQuickView.updateAttribute = function () {
    $('body').on('product:afterAttributeSelect', function (e, response) {
        if ($('.modal.show .product-quickview>.bundle-items').length) {
            $('.modal.show').find(response.container).data('pid', response.data.product.id);
            $('.modal.show').find(response.container)
                .find('.product-id').text(response.data.product.id);
        } else if ($('.set-items').length) {
            response.container.find('.product-id').text(response.data.product.id);
        } else {
            $('.modal.show .product-quickview').data('pid', response.data.product.id);
            $('.modal.show .full-pdp-link')
                .attr('href', response.data.product.selectedProductUrl);
        }

        if (response.data.product.isProductRestricted) {
            $('.modal.show').find('button.add-to-cart-global').addClass('d-none');
            $('.modal.show').find('.price').addClass('d-none');
            $('.modal.show').find('.product-not-available-msg').removeClass('d-none');
        } else {
            $('.modal.show').find('button.add-to-cart-global').removeClass('d-none');
            $('.modal.show').find('.price').removeClass('d-none');
            $('.modal.show').find('.product-not-available-msg').addClass('d-none');
        }
    });
};

module.exports = baseQuickView;
