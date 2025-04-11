const jwtHelper = require('*/cartridge/scripts/jwt/jwtHelper');
const Encoding = require('dw/crypto/Encoding');
const Bytes = require('dw/util/Bytes');
const Signature = require('dw/crypto/Signature');
const StringUtils = require('dw/util/StringUtils');
const Mac = require('dw/crypto/Mac');

const JWTAlgoToSFCCMapping = jwtHelper.JWTAlgoToSFCCMapping;

/**
 * Signs the input using RSA algorithm.
 * @param {string} input - The input string to sign.
 * @param {string} privateKey - The private key to use for signing.
 * @param {string} algorithm - The algorithm to use for signing.
 * @returns {string} - The base64 encoded signature.
 */
function signWithRSA(input, privateKey, algorithm) {
    let contentToSignInBytes = new Bytes(input);

    let apiSig = new Signature();
    let signedBytes = apiSig.signBytes(contentToSignInBytes, new Bytes(privateKey), JWTAlgoToSFCCMapping[algorithm]);

    return Encoding.toBase64(signedBytes);
}

/**
 * Signs the input using HMAC algorithm.
 * @param {string} input - The input string to sign.
 * @param {string} secret - The secret key to use for signing.
 * @param {string} algorithm - The algorithm to use for signing.
 * @returns {string} - The base64 encoded signature.
 */
function signWithHMAC(input, secret, algorithm) {
    let mac = new Mac(JWTAlgoToSFCCMapping[algorithm]);
    let inputInBytes = new Bytes(input);
    let secretInBytes = new Bytes(secret);

    let output = mac.digest(inputInBytes, secretInBytes);

    return Encoding.toBase64(output);
}

const JWTAlgoToSignMapping = {
    RS256: signWithRSA,
    RS384: signWithRSA,
    RS512: signWithRSA,
    HS256: signWithHMAC,
    HS384: signWithHMAC,
    HS512: signWithHMAC,
    PS256: signWithRSA,
    PS384: signWithRSA
};

/**
 * Signs the JWT payload with the specified options.
 * @param {Object} payload - The payload to sign.
 * @param {Object} options - The options for signing the JWT.
 * @param {string} options.algorithm - The algorithm to use for signing.
 * @param {string} options.kid - The key ID.
 * @param {string} options.privateKeyOrSecret - The private key or secret to use for signing.
 * @returns {string} - The signed JWT token.
 * @throws {Error} - If the payload is invalid or the algorithm is not supported.
 */
function signJWT(payload, options) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload passed to create JWT token');
    }

    let algorithm = options.algorithm;
    let supportedAlgorithms = jwtHelper.SUPPORTED_ALGORITHMS;
    if (supportedAlgorithms.indexOf(algorithm) === -1) {
        throw new Error(StringUtils.format('JWT Algorithm {0} not supported', algorithm));
    }

    let header = {
        alg: options.algorithm,
        type: 'JWT',
        kid: options.kid
    };

    let headerBase64 = Encoding.toBase64(new Bytes(JSON.stringify(header)));
    let headerBase64UrlEncoded = jwtHelper.toBase64UrlEncoded(headerBase64);

    let payloadBase64 = Encoding.toBase64(new Bytes(JSON.stringify(payload)));
    let payloadBase64UrlEncoded = jwtHelper.toBase64UrlEncoded(payloadBase64);

    let signature = headerBase64UrlEncoded + '.' + payloadBase64UrlEncoded;

    let privateKeyOrSecret;
    if (options.privateKeyOrSecret && typeof options.privateKeyOrSecret === 'string') {
        privateKeyOrSecret = options.privateKeyOrSecret;
    }

    if (!privateKeyOrSecret) {
        throw new Error('Cannot sign JWT token as private key or secret not supplied');
    }

    let signFunction = JWTAlgoToSignMapping[algorithm];
    if (!signFunction) {
        throw new Error(StringUtils.format('No sign function found for supplied algorithm {0}', algorithm));
    }

    let jwtSignature = signFunction(signature, privateKeyOrSecret, algorithm);
    let jwtSignatureUrlEncoded = jwtHelper.toBase64UrlEncoded(jwtSignature);

    let jwtToken = headerBase64UrlEncoded + '.' + payloadBase64UrlEncoded + '.' + jwtSignatureUrlEncoded;

    return jwtToken;
}

module.exports.signJWT = signJWT;
