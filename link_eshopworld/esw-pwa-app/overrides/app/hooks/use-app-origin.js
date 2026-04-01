/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'

export const useAppOrigin = () => {
    const serverContext = useServerContext()

    if (typeof window !== 'undefined') {
        return window.location.origin
    }

    return process.env.APP_ORIGIN || serverContext?.res?.locals?.xForwardedOrigin || ''
}
