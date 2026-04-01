'use strict';

exports.REGISTERATION_URL_NAME = 'registrationUrl';
exports.REGISTERATION_URL_VALUE = 'EShopWorld-RegisterCustomer';
exports.IS_REGISTERATION_NEEDED_NAME = 'showRegistration';
exports.IS_REGISTERATION_NEEDED_VALUE = 'true';
exports.RANDOM_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ';
exports.RANDOM_LENGTH = 15;
exports.PA_V3 = 'PAv3';
exports.PA_V4 = 'PAv4';
exports.API = 'api';
exports.SFTP = 'sftp';
exports.DEFAULT_PA_CATEGORY = 'default';
exports.PROCESSED = 'Processed';
exports.CATALOG_API_CHUNK = 100;
exports.UNKNOWN = 'Unknown';
exports.SIMPLE_FORM = 'simpleForm';
exports.ADVANCE_FORM = 'advanceForm';
exports.By_ID_FORM = 'searchByIdForm';
exports.REGISTERATION_PWA_URL_VALUE = 'EShopWorld-RegisterCustomer';
exports.EXPORTED = 'EXPORTED';
exports.NOT_EXPORTED = 'NOT_EXPORTED';
exports.EXPORT_FAILED = 'EXPORT_FAILED';
exports.N_A = 'N_A';
exports.PAGE_SIZES = ['10', '50', '100', '500', '1000'];
exports.DECIMAL_LENGTH = 8;
exports.VERSION_2 = 'v2';
exports.VERSION_3 = 'v3';
exports.NOHOLD = 'NoHold';
exports.IS_DELIVERY = 'IsDelivery';
exports.eswPkgOptionMixed = {
    displayValue: 'Mixed - Specific field for country level',
    value: 'mixed'
};
exports.pkgAsnMaxDays = 3;
exports.STR_QUOTA_LIMIT = 999;
exports.NET_TAXATION_MODEL = 'NET';
exports.CUSTOMER_AUTH = 'customers/auth?client_id=';
exports.EMBEDDED_CHECKOUT_QUERY_PARAM = 'eswiframeurl';
exports.EMBEDDED_CHECKOUT_ENDPOINT_HEADLESS = 'EShopWorld-EswEmbeddedCheckout?';
exports.EMBEDDED_CHECKOUT_ENDPOINT_HEADLESS_SITE_GENESIS = 'EShopWorldSG-EswEmbeddedCheckout?';
exports.EQUALS_OPERATOR = '=';
exports.COUNTRY_CODE = '?country-code=';
exports.REGISTERATION_URL_VALUE_SG = 'EShopWorldSG-RegisterCustomer';
exports.SITE_GENESIS_SITE_ID = 'SiteGenesis';
exports.ESW_SERVICES_URLS = {
    ESWSFTP: 'sftp2.eshopworld.com',
    'EswCheckoutV3Service.SFRA': 'https://checkout-api-{tenant}.{environment}.eshopworld.{domainSuffix}/api/{version}/PreOrder',
    'EswCheckoutV2Service.SFRA': 'https://checkout-api-{tenant}.{environment}.eshopworld.{domainSuffix}/api/{version}/PreOrder',
    EswGetJwksService: 'https://security-sts.{environment}.eshopworld.{domainSuffix}/.well-known/openid-configuration/jwks',
    EswPackageV4Service: 'https://package-api.{environment}.eshopworld.{domainSuffix}/api/{version}/Package',
    EswGetAsnPackage: 'https://logistics-package-api.{environment}.eshopworld.{domainSuffix}/api/{version}/Package/GetAsnPackage',
    EswPriceFeedService: 'https://pricing-advisor-api.{environment}.eshopworld.{domainSuffix}/api/{version}/StandardAdvice',
    ESWOrderCreation: 'https://{bmHostname}/s/{siteId}/dw/shop/{ocapiVersion}/',
    EswOcapiBasketService: 'https://{bmHostname}/s/{siteId}/dw/shop/{ocapiVersion}/baskets',
    EswOcapiOrderService: 'https://{bmHostname}/s/{siteId}/dw/shop/{ocapiVersion}/orders',
    EswOAuthService: 'https://security-sts.{environment}.eshopworld.{domainSuffix}/connect/token',
    ESWCatalogService: 'https://logistics-customscatalog-api.{environment}.eshopworld.{domainSuffix}/api/{version}/RetailerCatalog',
    EswMoInventorySync: 'https://{bmHostname}/s/-/dw/data/{ocapiVersion}/inventory_lists/{inventory_ID}/product_inventory_records/{productID}'
};
exports.ESW_V3_PRICING_ADVISOR_SERVICE = 'PricingAdvisor';
exports.ESW_V4_PRICING_ADVISOR_SERVICE = 'StandardAdvice';

exports.REGISTERATION_URL_VALUE_HEADLESS_SG = 'EswHL-RegisterCustomer';
exports.REGISTERATION_URL_VALUE_HEADLESS_SFRA = 'EswRefArchHL-RegisterCustomer';
exports.SELF_HOSTED_OC_URL_SFRA = 'EShopWorld-OrderConfirm';
exports.SELF_HOSTED_OC_URL_SG = 'EShopWorldSG-OrderConfirm';
exports.SELF_HOSTED_OC_URL_PWA = '/checkout/confirmation/';
exports.SELF_HOSTED_OC_URL_SFRA_HEADLESS = 'EswRefArchHL-OrderConfirm';
exports.SELF_HOSTED_OC_URL_SG_HEADLESS = 'EswHL-OrderConfirm';
exports.TXT_PAYMENT_NOT_AUTHORIZED = 'Not Authorized';
exports.TXT_PAYMENT_AUTHORIZED = 'Authorized';
exports.TXT_PAYMENT_SETTLED = 'Settled';
exports.ESW_ORDER_PAYMENT_STATUS_EVENT_NAME = 'Test-fromVirtualEvent-order-order';
exports.LOCALE_QUERY_PARAM = 'locale';
exports.ESW_NO_OPERATION_STATUS = '204';
exports.NO_APPEASEMRNT_PERFORMED_MSG = 'No appeasement performed';
exports.NO_ORDER_RETURN_PERFORMED_MSG = 'No order return performed';
exports.NO_ORDER_CANCEL_PERFORMED_MSG = 'No order cancel performed';
exports.NO_OTC_PAYMENT_PERFORMED_MSG = 'No OTC payment performed';
