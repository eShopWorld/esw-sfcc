/**
 * Fetch supported countries from SCAPI custom endpoint and write to config/sites.js
 * This is used by the PWA to determine which sites to show in the country selector.
 * Run "npm run fetch-countries" to execute.
 *
 * Note: This script uses a SLAS guest token flow with PKCE, which requires a registered SLAS client.
 */

'use strict'

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Load config from the PWA Kit project
const config = require('../config/default')
const {commerceAPI} = config.app
const {clientId, organizationId, shortCode, siteId} = commerceAPI.parameters

const SCAPI_HOST = `https://${shortCode}.api.commercecloud.salesforce.com`
const SLAS_PATH = `/shopper/auth/v1/organizations/${organizationId}/oauth2`
// This redirect_uri must be registered in your SLAS client configuration
const REDIRECT_URI = 'http://localhost:3000/callback'

// ---------------------------------------------------------------------------
// PKCE helpers (RFC 7636)
// ---------------------------------------------------------------------------
function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url')
}

// ---------------------------------------------------------------------------
// SLAS guest token (public client + PKCE)
// ---------------------------------------------------------------------------
async function getGuestToken() {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Step 1 – Authorize (guest hint) → 303 redirect with ?code=
    const authorizeParams = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        hint: 'guest',
        code_challenge: codeChallenge,
        channel_id: siteId
    })

    const authRes = await fetch(`${SCAPI_HOST}${SLAS_PATH}/authorize?${authorizeParams}`, {
        method: 'GET',
        redirect: 'manual'
    })

    const location = authRes.headers.get('location')
    if (!location) {
        const body = await authRes.text()
        throw new Error(`SLAS authorize failed (${authRes.status}): ${body}`)
    }

    const redirectUrl = new URL(location)
    const code = redirectUrl.searchParams.get('code')
    const usid = redirectUrl.searchParams.get('usid')
    if (!code) {
        throw new Error(`No authorization code in redirect: ${location}`)
    }

    // Step 2 – Exchange code for access token
    const tokenBody = new URLSearchParams({
        grant_type: 'authorization_code_pkce',
        code,
        code_verifier: codeVerifier,
        client_id: clientId,
        channel_id: siteId,
        redirect_uri: REDIRECT_URI,
        ...(usid && {usid})
    })

    const tokenRes = await fetch(`${SCAPI_HOST}${SLAS_PATH}/token`, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: tokenBody
    })

    if (!tokenRes.ok) {
        const body = await tokenRes.text()
        throw new Error(`SLAS token exchange failed (${tokenRes.status}): ${body}`)
    }

    const {access_token} = await tokenRes.json()
    return access_token
}

// ---------------------------------------------------------------------------
// Fetch via SCAPI custom endpoint (primary)
// ---------------------------------------------------------------------------
async function fetchViaScapi(accessToken) {
    const params = new URLSearchParams({
        siteId,
        c_eswShopperTimezone: 'Etc/UTC'
    })
    const url = `${SCAPI_HOST}/custom/product/v1/organizations/${organizationId}/getSupportedCountries?${params}`

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        const body = await res.text()
        throw new Error(`SCAPI getSupportedCountries failed (${res.status}): ${body}`)
    }

    return res.json()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    console.log('[ESW] Fetching supported countries...')
    console.log(`  Site: ${siteId} | Org: ${organizationId}`)

    const token = await getGuestToken()
    console.log('  SLAS guest token obtained.')
    const data = await fetchViaScapi(token)
    console.log('  Fetched via SCAPI custom endpoint.')

    const countries = data.allowedCountries
    if (!countries || !countries.length) {
        console.warn('  WARNING: No countries returned. Keeping existing sites.js.')
        process.exit(0)
    }

    console.log(`  Received ${countries.length} site entries.`)

    // Write to config/sites.js
    const sitesPath = path.resolve(__dirname, '../config/sites.js')
    const content = [
        '/*',
        ' * Auto-generated by scripts/fetch-supported-countries.js',
        ` * Last updated: ${new Date().toISOString()}`,
        ' * Do not edit manually — run "npm run fetch-countries" to regenerate.',
        ' */',
        '',
        `module.exports = ${JSON.stringify(countries, null, 4)}`,
        ''
    ].join('\n')

    fs.writeFileSync(sitesPath, content, 'utf8')
    console.log(`  Written to config/sites.js`)
}

main().catch((err) => {
    console.error('[ESW] Error:', err.message)
    process.exit(1)
})
