/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    extends: [require.resolve('@salesforce/pwa-kit-dev/configs/eslint')],
    rules: {
        'prettier/prettier': 'off',
        indent: 'off',
        'key-spacing': 'off',
        'object-curly-spacing': 'off',
        'array-bracket-spacing': 'off',
        'space-in-parens': 'off',
        'space-before-function-paren': 'off',
        'space-infix-ops': 'off',
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
