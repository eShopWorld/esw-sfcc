/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    RETAIL_APP_HOME: process.env.RETAIL_APP_HOME || 'https://esw-pwa-uat.mobify-storefront.com/ie',
    GENERATED_PROJECTS_DIR: '../../esw-pwa-app',
    GENERATE_PROJECTS: ['retail-app-demo', 'retail-app-ext', 'retail-app-no-ext'],
    GENERATOR_CMD: 'node packages/pwa-kit-create-app/scripts/create-mobify-app-dev.js --outputDir',
    CLI_RESPONSES: {
        'retail-app-demo': [
            {
                expectedPrompt: /Choose a project preset to get started:/i,
                response: '2\n'
            }
        ],
        'retail-app-ext': [
            {
                expectedPrompt: /Choose a project preset to get started:/i,
                response: '1\n'
            },
            {
                expectedPrompt: /Do you wish to use template extensibility?/i,
                response: '2\n'
            },
            {
                expectedPrompt: /What is the name of your Project?/i,
                response: 'scaffold-pwa\n'
            }
        ],
        'retail-app-no-ext': [
            {
                expectedPrompt: /Choose a project preset to get started:/i,
                response: '1\n'
            },
            {
                expectedPrompt: /Do you wish to use template extensibility?/i,
                response: '1\n'
            },
            {
                expectedPrompt: /What is the name of your Project?/i,
                response: 'scaffold-pwa\n'
            }
        ],
        'retail-app-private-client': []
    },
    PRESET: {
        'retail-app-private-client': 'retail-react-app-private-slas-client'
    },
    EXPECTED_GENERATED_ARTIFACTS: {
        'retail-app-demo': [
            '.eslintignore',
            '.eslintrc.js',
            '.prettierrc.yaml',
            'babel.config.js',
            'config',
            'node_modules',
            'overrides',
            'package-lock.json',
            'package.json',
            'translations',
            'worker'
        ],
        'retail-app-ext': [
            '.eslintignore',
            '.eslintrc.js',
            '.prettierrc.yaml',
            'babel.config.js',
            'config',
            'node_modules',
            'overrides',
            'package-lock.json',
            'package.json',
            'translations',
            'worker'
        ],
        'retail-app-no-ext': [
            '.eslintignore',
            '.eslintrc.js',
            '.prettierignore',
            '.prettierrc.yaml',
            'CHANGELOG.md',
            'LICENSE',
            'README.md',
            'app',
            'babel.config.js',
            'cache-hash-config.json',
            'config',
            'jest-setup.js',
            'jest.config.js',
            'jsconfig.json',
            'node_modules',
            'package-lock.json',
            'package.json',
            'scripts',
            'tests',
            'translations',
            'worker'
        ]
    },
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '437 Crim Lane',
    postalCode: 'SW1W 0NY',
    city: 'Bellbrook',
    phoneNumber: '7400 464637',
    email: 'test@eshopworld.com',
    cardNumberInput: '4111111111111111',
    cardExpiry: '3/30',
    cvv: '786',
    cardName: 'John Doe'
}
