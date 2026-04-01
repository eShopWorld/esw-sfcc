let isInterceptorAttached = false

const cookieNameMap = {
    'esw.currency': 'esw.currency',
    'esw.location': 'esw.location',
    'esw.languageisocode': 'esw.LanguageIsoCode',
    'esw.internationaluser': 'esw.InternationalUser',
    'esw.sessionid': 'esw.sessionid'
}

const getCookieNameFromHeader = (headerName) => {
    const rawCookieName = headerName.replace('c_eswdot', 'esw.')
    return cookieNameMap[rawCookieName.toLowerCase()] || rawCookieName
}

const getCookieValue = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
}

const clearCookieForAllPaths = (cookieName) => {
    const expire = 'Thu, 01 Jan 1970 00:00:00 GMT'
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    const allPaths = ['/']

    let currentPath = ''
    pathParts.forEach((part) => {
        currentPath += `/${part}`
        allPaths.push(currentPath)
    })

    allPaths.reverse().forEach((path) => {
        document.cookie = `${cookieName}=;path=${path};expires=${expire};secure`
    })
}

const convertHeadersToCookies = (headers) => {
    try {
        if (!headers) return

        headers.forEach((value, name) => {
            if (name && name.startsWith('c_eswdot')) {
                const cookieName = getCookieNameFromHeader(name)
                const currentCookieValue = getCookieValue(cookieName)
                
                // Only clear and regenerate if the value is different
                if (currentCookieValue !== value) {
                    clearCookieForAllPaths(cookieName)
                    document.cookie = `${cookieName}=${value};path=/;secure`
                }
            }
        })
    } catch (err) {
        // Silently fail if headers cannot be processed
    }
}

export const attachResponseInterceptor = () => {
    if (typeof window === 'undefined' || isInterceptorAttached) {
        return
    }

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (...args) => {
        try {
            const response = await originalFetch(...args)
            convertHeadersToCookies(response.headers)
            return response
        } finally {
            console.log('ESW RESPONSe INTERCEPT')
        }
    }

    isInterceptorAttached = true
}
