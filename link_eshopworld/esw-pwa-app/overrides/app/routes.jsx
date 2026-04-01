/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import loadable from '@loadable/component'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Components
import {Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'
import {routes as _routes} from '@salesforce/retail-react-app/app/routes'

const fallback = <Skeleton height="75vh" width="100%" />

// Create your pages here and add them to the routes array
// Use loadable to split code into smaller js chunks
const Home = loadable(() => import('./pages/home'), {fallback})
const MyNewRoute = loadable(() => import('./pages/my-new-route'))

// ESW Customization
import EswExampleContentDetails from './pages/esw-example-content-details'
import Cart from './pages/cart'
import ProductDetail from './pages/product-detail'
import EswEmbeddedCheckout from './pages/esw-embedded-checkout'
import CheckoutConfirmation from './pages/checkout/confirmation'
import ProductList from './pages/product-list'
// End ESW Customization

export const routes = [
    {
        path: '/',
        component: Home,
        exact: true
    },
    {
        path: '/my-new-route',
        component: MyNewRoute
    },
    {
        path: '/content/esw-test-content',
        component: EswExampleContentDetails
    },
    {
        path: '/product/:productId',
        component: ProductDetail
    },
    {
        path: '/search',
        component: ProductList
    },
    {
        path: '/category/:categoryId',
        component: ProductList
    },
    {
        path: '/cart',
        component: Cart,
        exact: true
    },
    {
        path: '/esw-checkout',
        component: EswEmbeddedCheckout,
        exact: true
    },
    {
        path: '/checkout/confirmation/:orderNo',
        component: CheckoutConfirmation
    },
    ..._routes
]

export default () => {
    const config = getConfig()
    return configureRoutes(routes, config, {
        ignoredRoutes: ['/callback', '*']
    })
}
