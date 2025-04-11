/* eslint-disable no-unused-vars */
'use strict';

const jwtHelper = require('*/cartridge/scripts/jwt/jwtHelper');
const Logger = require('dw/system/Logger');


/**
 * Extracts and decodes the header from a JWT token.
 * @param {string} jwt - The JWT token.
 * @returns {Object|null} The decoded JWT header or null if invalid.
 */
function getHeaderFromJWT(jwt) {
    let encodedHeader = jwt.split('.')[0];
    let Encoding = require('dw/crypto/Encoding');

    let decodedHeader = Encoding.fromBase64(encodedHeader).toString();
    let jwtHeaderObj = {};

    try {
        jwtHeaderObj = JSON.parse(decodedHeader);
    } catch (error) {
        Logger.error('Error parsing jwt token header');
        return null;
    }

    return jwtHeaderObj;
}

/**
 * Extracts and decodes the payload from a JWT token.
 * @param {string} jwt - The JWT token.
 * @returns {Object|null} The decoded JWT payload or null if invalid.
 */
function getPayloadFromJWT(jwt) {
    let encodedPayload = jwt.split('.')[1];
    let Encoding = require('dw/crypto/Encoding');

    let decodedPayload = Encoding.fromBase64(encodedPayload).toString();
    let jwtPayloadObj = {};

    try {
        jwtPayloadObj = JSON.parse(decodedPayload);
    } catch (error) {
        Logger.error('Error parsing jwt token payload');
        return null;
    }

    return jwtPayloadObj;
}

/**
 * Extracts the signature from a JWT token.
 * @param {string} jwt - The JWT token.
 * @returns {string} The JWT signature.
 */
function getSignatureFromJWT(jwt) {
    return jwt.split('.')[2];
}

/**
 * Decodes a JWT token.
 * @param {string} jwt - The JWT token to decode.
 * @param {Object} [options] - Optional parameters.
 * @returns {Object|null} The decoded JWT token or null if invalid.
 */
function decodeJWT(jwt, options) {
    let opts = options || {};

    if (!jwtHelper.isValidJWT(jwt)) {
        return null;
    }

    let header = getHeaderFromJWT(jwt);
    if (!header) {
        return null;
    }

    let payload = getPayloadFromJWT(jwt);
    if (!payload) {
        return null;
    }

    let signature = getSignatureFromJWT(jwt);
    if (!signature) {
        return null;
    }

    return {
        header: header,
        payload: payload,
        signature: signature
    };
}

module.exports.decodeJWT = decodeJWT;

