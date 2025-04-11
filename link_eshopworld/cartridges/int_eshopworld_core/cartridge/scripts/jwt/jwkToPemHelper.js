/* eslint-disable camelcase */
/**
 * Highly custom logic to create public key.
 * Return public key as DER
 * https://stackoverflow.com/questions/18835132/xml-to-pem-in-node-js
 * https://github.com/tracker1/node-rsa-pem-from-mod-exp
 */
const Encoding = require('dw/crypto/Encoding');

/**
 * Prepends a '00' to the hex string if the most significant bit is set.
 * @param {string} hexStr - The hexadecimal string to be pre-padded.
 * @returns {string} The pre-padded hexadecimal string.
 */
function prepadSigned(hexStr) {
    let msb = hexStr[0];
    if (
    (msb >= '8' && msb <= '9') ||
    (msb >= 'a' && msb <= 'f') ||
    (msb >= 'A' && msb <= 'F')
  ) {
        return '00' + hexStr;
    } else {
        return hexStr;
    }
}

/**
 * Converts a number to a hexadecimal string.
 * @param {number} number - The number to be converted.
 * @returns {string} The hexadecimal representation of the number.
 */
function toHex(number) {
    let nstr = number.toString(16);
    if (nstr.length % 2 === 0) return nstr;
    return '0' + nstr;
}

/**
 * Encodes the length in hexadecimal format for ASN.1 DER.
 * @param {number} n - The length to be encoded.
 * @returns {string} The hexadecimal representation of the length.
 */
function encodeLengthHex(n) {
  // encode ASN.1 DER length field
  // if <=127, short form
  // if >=128, long form
    if (n <= 127) return toHex(n);
    else {
        let n_hex = toHex(n);
        let length_of_length_byte = 128 + (n_hex.length / 2); // 0x80+numbytes
        return toHex(length_of_length_byte) + n_hex;
    }
}

/**
 * Generates an RSA public key in DER format from base64 encoded modulus and exponent.
 * @param {string} modulus_b64 - The base64 encoded modulus.
 * @param {string} exponent_b64 - The base64 encoded exponent.
 * @returns {string} The DER encoded public key in base64 format.
 */
function getRSAPublicKey(modulus_b64, exponent_b64) {
    let modulus = Encoding.fromBase64(modulus_b64);
    let exponent = Encoding.fromBase64(exponent_b64);

    let modulus_hex = Encoding.toHex(modulus);
    let exponent_hex = Encoding.toHex(exponent);

    modulus_hex = prepadSigned(modulus_hex);
    exponent_hex = prepadSigned(exponent_hex);

    let modlen = modulus_hex.length / 2;
    let explen = exponent_hex.length / 2;

    let encoded_modlen = encodeLengthHex(modlen);
    let encoded_explen = encodeLengthHex(explen);
    let encoded_pubkey =
    '30' +
    encodeLengthHex(
      modlen +
        explen +
        (encoded_modlen.length / 2) +
        (encoded_explen.length / 2) +
        2
    ) +
    '02' +
    encoded_modlen +
    modulus_hex +
    '02' +
    encoded_explen +
    exponent_hex;

    let seq2 =
    '30 0d ' +
    '06 09 2a 86 48 86 f7 0d 01 01 01' +
    '05 00 ' +
    '03' +
    encodeLengthHex((encoded_pubkey.length / 2) + 1) +
    '00' +
    encoded_pubkey;

    seq2 = seq2.replace(/ /g, '');

    let der_hex = '30' + encodeLengthHex(seq2.length / 2) + seq2;

    der_hex = der_hex.replace(/ /g, '');

    let der_b64 = Encoding.toBase64(Encoding.fromHex(der_hex));

  // let pem = '-----BEGIN PUBLIC KEY-----\n'
  //     + der_b64.match(/.{1,64}/g).join('\n')
  //     + '\n-----END PUBLIC KEY-----\n';

    return der_b64;
}

module.exports.getRSAPublicKey = getRSAPublicKey;
