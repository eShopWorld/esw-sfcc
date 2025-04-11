/* eslint-disable no-useless-escape */
const JWT_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
const SUPPORTED_ALGORITHMS = ['RS256', 'RS384', 'RS512', 'HS256', 'HS384', 'HS512', 'PS256', 'PS384'];
const Mac = require('dw/crypto/Mac');

/**
 * Checks if the given JWT is valid.
 * @param {string} jwt - The JSON Web Token to validate.
 * @returns {boolean} True if the JWT is valid, false otherwise.
 */
function isValidJWT(jwt) {
    return JWT_REGEX.test(jwt);
}

const JWTAlgoToSFCCMapping = {
    RS256: 'SHA256withRSA',
    RS512: 'SHA512withRSA',
    RS384: 'SHA384withRSA',
    HS256: Mac.HMAC_SHA_256,
    HS384: Mac.HMAC_SHA_384,
    HS512: Mac.HMAC_SHA_512,
    PS256: 'SHA256withRSA/PSS',
    PS384: 'SHA384withRSA/PSS'
};

/**
 * Converts a base64 string to a base64 URL encoded string.
 * @param {string} input - The base64 string to convert.
 * @returns {string} The base64 URL encoded string.
 */
function toBase64UrlEncoded(input) {
    return input.replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/\=+$/m, '');
}

module.exports.isValidJWT = isValidJWT;
module.exports.toBase64UrlEncoded = toBase64UrlEncoded;
module.exports.SUPPORTED_ALGORITHMS = SUPPORTED_ALGORITHMS;
module.exports.JWTAlgoToSFCCMapping = JWTAlgoToSFCCMapping;
