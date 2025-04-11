/* eslint-disable new-cap */
/* eslint-disable re */
'use strict';

const jwtHelper = require('*/cartridge/scripts/jwt/jwtHelper');
const jwtDecode = require('*/cartridge/scripts/jwt/decode');

const Bytes = require('dw/util/Bytes');
const Encoding = require('dw/crypto/Encoding');
const Signature = require('dw/crypto/Signature');
const StringUtils = require('dw/util/StringUtils');
const Mac = require('dw/crypto/Mac');

const JWTAlgoToSFCCMapping = jwtHelper.JWTAlgoToSFCCMapping;

/**
 * Verifies the RSA signature of the JWT.
 * @param {string} signature - The JWT signature.
 * @param {string} input - The input string to verify.
 * @param {string} publicKey - The public key to use for verification.
 * @param {string} algorithm - The algorithm to use for verification.
 * @returns {boolean} - True if the signature is valid, false otherwise.
 */
function createRSAVerifier(signature, input, publicKey, algorithm) {
    let jwtSignatureInBytes = new Encoding.fromBase64(signature);
    let contentToVerifyInBytes = new Bytes(input);

    let apiSig = new Signature();
    let verified = apiSig.verifyBytesSignature(jwtSignatureInBytes, contentToVerifyInBytes, new Bytes(publicKey), JWTAlgoToSFCCMapping[algorithm]);
    return verified;
}

/**
 * Verifies the HMAC signature of the JWT.
 * @param {string} signature - The JWT signature.
 * @param {string} input - The input string to verify.
 * @param {string} secret - The secret key to use for verification.
 * @param {string} algorithm - The algorithm to use for verification.
 * @returns {boolean} - True if the signature is valid, false otherwise.
 */
function createHMACVerifier(signature, input, secret, algorithm) {
    let mac = new Mac(JWTAlgoToSFCCMapping[algorithm]);
    let inputInBytes = new Bytes(input);
    let secretInBytes = new Bytes(secret);

    // create digest of input & compare against jwt signature
    let outputInBytes = mac.digest(inputInBytes, secretInBytes);
    let outputInString = Encoding.toBase64(outputInBytes);

    // signature is base64UrlEncoded so convert input to same
    let urlEncodedOutput = jwtHelper.toBase64UrlEncoded(outputInString);

    return signature === urlEncodedOutput;
}

const JWTAlgoToVerifierMapping = {
    RS256: createRSAVerifier,
    RS384: createRSAVerifier,
    RS512: createRSAVerifier,
    HS256: createHMACVerifier,
    HS384: createHMACVerifier,
    HS512: createHMACVerifier,
    PS256: createRSAVerifier,
    PS384: createRSAVerifier
};

/**
 * Verifies the JWT token.
 * @param {string} jwt - The JWT token to verify.
 * @param {Object} options - The options for verification.
 * @param {string} [options.publicKeyOrSecret] - The public key or secret to use for verification.
 * @param {boolean} [options.ignoreExpiration] - Whether to ignore the expiration date.
 * @param {string} [options.audience] - The expected audience of the token.
 * @param {string} [options.issuer] - The expected issuer of the token.
 * @returns {boolean} - True if the token is valid, false otherwise.
 */
function verifyJWT(jwt, options) {
    options = options || {};

    if (!jwtHelper.isValidJWT(jwt)) {
        return false;
    }

    let decodedToken = jwtDecode.decodeJWT(jwt);
    if (!decodedToken) {
        return false;
    }

    let algorithm = decodedToken.header.alg;
    let parts = jwt.split('.');

    let supportedAlgorithms = jwtHelper.SUPPORTED_ALGORITHMS;
    if (supportedAlgorithms.indexOf(algorithm) === -1) {
        throw new Error(StringUtils.format('JWT Algorithm {0} not supported', algorithm));
    }

    let header = parts[0];
    let payload = parts[1];
    let jwtSig = parts[2];

    let contentToVerify = header + '.' + payload;

    let publicKeyOrSecret;
    if (options.publicKeyOrSecret && typeof options.publicKeyOrSecret === 'string') {
        publicKeyOrSecret = options.publicKeyOrSecret;
    } else if (options.publicKeyOrSecret && typeof options.publicKeyOrSecret === 'function') {
        let jsonWebKey = options.publicKeyOrSecret(decodedToken);
        if (jsonWebKey && jsonWebKey.n && jsonWebKey.e) {
            let keyHelper = require('*/cartridge/scripts/jwt/jwkToPemHelper');
            publicKeyOrSecret = keyHelper.getRSAPublicKey(jsonWebKey.n, jsonWebKey.e);
        }
    }

    if (!publicKeyOrSecret) {
        throw new Error('Cannot verify JWT token as public key or secret not supplied');
    }

    let verifier = JWTAlgoToVerifierMapping[algorithm];
    if (!verifier) {
        throw new Error(StringUtils.format('No verifier function found for supplied algorithm {0}', algorithm));
    }

    let verified = verifier(jwtSig, contentToVerify, publicKeyOrSecret, algorithm);
    if (!verified) {
        return false;
    }

    payload = decodedToken.payload;
    if (!options.ignoreExpiration) {
        let jwtExp = payload.exp;
        // seconds to ms
        let expirationDate = new Date(jwtExp * 1000);
        let currentDate = new Date();
        // expired
        if (expirationDate < currentDate) {
            return false;
        }
    }

    if (options.audience) {
        let aud = payload.aud;
        if (options.audience !== aud) {
            return false;
        }
    }

    if (options.issuer) {
        let iss = payload.iss;
        if (iss !== options.issuer) {
            return false;
        }
    }

    return true;
}

module.exports.verifyJWT = verifyJWT;
