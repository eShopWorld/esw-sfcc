/*
 * Temporary compatibility shim.
 *
 * pwa-kit-dev 3.14 resolves app entrypoint from app/ssr.js first. On Windows,
 * its overridesDir fallback path can fail to resolve correctly, so we forward
 * to the existing overrides implementation.
 */
export * from '../overrides/app/ssr'
