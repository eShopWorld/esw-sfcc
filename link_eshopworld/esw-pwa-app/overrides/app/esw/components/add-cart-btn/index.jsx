/* eslint-disable no-nested-ternary */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    AlertTitle,
    Button,
    AlertIcon
} from '@salesforce/retail-react-app/app/components/shared/ui'

export const EswAddToCartBtn = (props) => {
    const {
        variant,
        isBasketLoading,
        showInventoryMessage,
        buttonText,
        updateCart,
        isProductASet,
        clickFn,
        product
    } = props

    if (product && product.c_eswRestrictedProduct) {
        return (
            <>
                <Button
                    onClick={clickFn}
                    key="cart-button"
                    disabled={isBasketLoading || showInventoryMessage}
                    isLoading={isBasketLoading}
                    width="100%"
                    variant={variant}
                >
                    {updateCart
                        ? buttonText.update
                        : isProductASet
                        ? buttonText.addSetToCart
                        : buttonText.addToCart}
                </Button>
            </>
        )
    }
    return (
        <>
            {product ? (
                <Alert status="error" marginBottom={4}>
                    <AlertIcon />
                    <AlertTitle>{product.c_eswRestrictedProductMsg}</AlertTitle>
                </Alert>
            ) : (
                <></>
            )}
        </>
    )
}

EswAddToCartBtn.propTypes = {
    variant: PropTypes.string.isRequired,
    isBasketLoading: PropTypes.bool,
    showInventoryMessage: PropTypes.bool,
    buttonText: PropTypes.object,
    updateCart: PropTypes.any,
    isProductASet: PropTypes.bool,
    clickFn: PropTypes.func,
    product: PropTypes.object
}
