/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    extends: [require.resolve('@salesforce/pwa-kit-dev/configs/eslint')],
    rules: {
        // https://github.com/MelvinVermeer/eslint-plugin-no-relative-import-paths
        'prettier/prettier': ['error', {endOfLine: 'auto'}],
        semi: [0, 'never']
    },
    ignorePatterns: [
        'overrides/app/routes.jsx',
        'overrides/app/ssr.js',
        'overrides/app/request-processor.js',
        'overrides/app/pages/my-new-route/index.jsx',
        'overrides/app/pages/home/index.jsx',
        'overrides/app/main.jsx',
        'overrides/app/static/*'
    ]
}
