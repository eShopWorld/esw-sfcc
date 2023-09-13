/*---------------------------------------INSTRUCTIONS-------------------------------------------
|                                                                                              |
|   This file is for paths constants only                                                      |
|   Pipe (|) sign is use to identify seo and non-seo path                                      |
|   Left side of pipe sign must be controller path while right must be SEO path                |
|   for example Controller-Path | SeoPath                                                      |
|                                                                                              |
*---------------------------------------------------------------------------------------------*/
module.exports = {
    SFRA: {
        pathPrefix: '/on/demandware.store/Sites-RefArch-Site/en_US | /s/RefArch',
        home: 'Home-Show | home',
        getDefaultCurrency: 'EShopWorld-GetDefaultCurrency',
        getEswHeader: 'EShopWorld-GetEswHeader',
        pdp: 'Product-Show?pid=013742003154M | cluster-drop-earring/013742003154M.html',
        addToCart: "Cart-AddProduct",
        processWebHook: 'EShopWorld-ProcessWebHooks'
    },
    SG: {

    }
}