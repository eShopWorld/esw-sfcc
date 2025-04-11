import React from 'react'
import PropTypes from 'prop-types'
import {Alert, AlertIcon} from '@salesforce/retail-react-app/app/components/shared/ui'

export const EswReturnProhibitMsg = (props) => {
    const {product} = props
    return (
        <>
            {product && product.c_eswReturnProhibited ? (
                <Alert status="warning">
                    <AlertIcon />
                    <div dangerouslySetInnerHTML={{__html: product.c_eswReturnProhibitedMsg}} />
                </Alert>
            ) : (
                <></>
            )}
        </>
    )
}

EswReturnProhibitMsg.propTypes = {
    product: PropTypes.object
}
