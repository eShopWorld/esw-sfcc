const Transaction = require('dw/system/Transaction');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');

const eswHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
const sign = require('*/cartridge/scripts/jwt/sign.js');
const verify = require('*/cartridge/scripts/jwt/verify.js');
const decode = require('*/cartridge/scripts/jwt/decode.js');

/**
 * Fetches JWKS (JSON Web Key Set) from ESW (eShopWorld) and stores it in a custom object.
 * If the JWKS is not empty and contains keys, it removes the existing custom object and creates a new one with the fetched keys.
 *
 * @returns {Array} The public keys fetched from ESW.
 */
const getJwksFromEsw = function () {
    let publickeys = eswHelper.fetchJwksFromEsw();
    if (!empty(publickeys) && publickeys.length > 0) {
        let co = eswHelper.getCustomObjectDetails('ESW_JWKS', 'ESW_JWKS');
        Transaction.wrap(function () {
            if (co) {
                CustomObjectMgr.remove(co);
            }
            co = CustomObjectMgr.createCustomObject('ESW_JWKS', 'ESW_JWKS');
            co.custom.validationKeys = JSON.stringify(publickeys);
        });
    }
    return publickeys;
};

/**
 * Validates a JWT using the JWKS.
 *
 * @param {string} jwtRecieved - The JWT token to be validated.
 * @returns {Object} An object with validation results, where the key is `validated1` and the value is a boolean indicating whether the JWT is valid.
 */
const isValidJwt = function (jwtRecieved) {
    if (empty(jwtRecieved)) {
        return false;
    }
    let jwt = jwtRecieved.replace(/^Bearer\s+/i, '');
    let isJwksRecentlyRenewed = false;
    let jwksCo = eswHelper.getCustomObjectDetails('ESW_JWKS', 'ESW_JWKS');
    let jwks = jwksCo.custom.validationKeys;
    if (empty(jwks)) {
        isJwksRecentlyRenewed = true;
        jwks = getJwksFromEsw();
    } else {
        jwks = JSON.parse(jwks);
    }
    let decodedToken = decode.decodeJWT(jwt);
    if (empty(decodedToken)) {
        return false;
    }
    let keyToValidate = jwks.find(function (jwk) {
        return jwk.kid === decodedToken.header.kid;
    });
    // If JWT kid is not matched and keys are not renewed recently, then fetch the keys again
    if (empty(keyToValidate) && !isJwksRecentlyRenewed) {
        jwks = getJwksFromEsw();
    }
    // get key to validate again
    keyToValidate = jwks.find(function (jwk) {
        return jwk.kid === decodedToken.header.kid;
    });
    if (empty(keyToValidate)) {
        // No matching key found
        return false;
    }
    let options = {};
    options.publicKeyOrSecret = function () {
        return keyToValidate;
    };
    return verify.verifyJWT(jwt, options);
};

module.exports.sign = sign.signJWT;
module.exports.verify = verify.verifyJWT;
module.exports.isValidJwt = isValidJwt;
module.exports.getJwksFromEsw = getJwksFromEsw;
