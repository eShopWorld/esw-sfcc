import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useUsid, useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {LockIcon} from '@salesforce/retail-react-app/app/components/icons'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {generateDomLoader, getEswConfigByKey, removeDomLoader} from '../../esw-helpers'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'

export const EswCheckoutBtn = (props) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {site, locale} = useMultiSite()
    const navigate = useNavigation()
    const [isLoading, setIsLoading] = useState(false)
    const {variant, basketIdParam, checkOrderAble} = props
    const {usid} = useUsid()
    const {mutateAsync: createOrder} = useShopperOrdersMutation('createOrder')
    const {data: basket} = useCurrentBasket()
    const showToast = useToast()
    const {formatMessage} = useIntl()

    const handleEswCheckout = async () => {
        if (!locale.isSupportedByESW || !getEswConfigByKey('eswEshopworldModuleEnabled')) {
            navigate('/checkout')
            return
        }
        setIsLoading(true)
        let spinner = null
        if (locale.isSupportedByESW) {
            try {
                spinner = generateDomLoader()
                const order = await createOrder({
                    // We send the SLAS usid via this header. This is required by ECOM to map
                    // Einstein events sent via the API with the finishOrder event fired by ECOM
                    // when an Order transitions from Created to New status.
                    // Without this, various order conversion metrics will not appear on reports and dashboards
                    headers: {_sfdc_customer_id: usid},
                    body: {
                        basketId:
                            basketIdParam && basketIdParam.length > 0
                                ? basketIdParam
                                : basket.basketId
                    }
                })
                if (
                    !order ||
                    !order.c_eswPreOrderResponse ||
                    !order.c_eswPreOrderResponse.redirectUrl
                ) {
                    throw new Error(API_ERROR_MESSAGE)
                }
                localStorage.setItem('esw.clientLastOrderId', order.orderNo)
                setTimeout(() => {
                    window.location.replace(order.c_eswPreOrderResponse.redirectUrl)
                }, 500)
            } catch (error) {
                if (spinner && spinner.childElementCount > 0) {
                    removeDomLoader(spinner)
                }
                showToast({
                    title: formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }
        }
    }

    return (
        <>
            <Button
                as="button"
                onClick={handleEswCheckout}
                width={['95%', '95%', '95%', '100%']}
                marginTop={[6, 6, 2, 2]}
                mb={4}
                rightIcon={<LockIcon />}
                variant={variant}
                isDisabled={isLoading || (checkOrderAble && !basket.c_isOrderAbleBasket)}
            >
                <FormattedMessage
                    defaultMessage="Proceed to Checkout"
                    id="cart_cta.link.checkout"
                />
            </Button>
        </>
    )
}

EswCheckoutBtn.propTypes = {
    variant: PropTypes.string.isRequired,
    basketIdParam: PropTypes.string,
    checkOrderAble: PropTypes.bool
}
