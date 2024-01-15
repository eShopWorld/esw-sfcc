/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import {Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    AmexIcon,
    DiscoverIcon,
    MastercardIcon,
    VisaIcon
} from '@salesforce/retail-react-app/app/components/icons'

// EsW Customization
import {EswCheckoutBtn} from '../../../esw/components/checkout-btn'

const CartCta = () => {
    return (
        <Fragment>
            {/* Esw Modification */}
            <EswCheckoutBtn variant="solid" checkOrderAble={true} />
            {/* End Modification */}
            <Flex justify={'center'}>
                <VisaIcon height={8} width={10} mr={2} />
                <MastercardIcon height={8} width={10} mr={2} />
                <AmexIcon height={8} width={10} mr={2} />
                <DiscoverIcon height={8} width={10} mr={2} />
            </Flex>
        </Fragment>
    )
}

export default CartCta
