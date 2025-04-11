import React, {useEffect, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {
    eswAppInit,
    getAbandonmentCartHelper,
    getCountryCodeByLocale,
    getGeoIpAlertInfo,
    getLocaleByCountry,
    getLocaleCountry,
    getShopperCountry,
    isFirstVisit
} from '../../esw-helpers'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {EswGeoIpModel} from '../geo-ip'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'
import {useCustomerId, useCustomerBaskets} from '@salesforce/commerce-sdk-react'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'

export const EswInit = (props) => {
    const customerId = useCustomerId()
    const {data: basketsData} = useCustomerBaskets(
        {parameters: {customerId}},
        {
            enabled: !!customerId && !isServer
        }
    )
    const hasTriggered = useRef(false)
    const {locale, site} = props
    const {formatMessage} = useIntl()
    const showToast = useToast()
    const [openGeoIpAlert, setOpenGeoIpAlert] = useState(false)
    const [eswGeoIpTitle, setEswGeoIpTitle] = useState(null)
    const [eswGeoIpBody, setEswGeoIpBody] = useState(null)
    const [eswGeoIpLocation, setEswGeoIpLocation] = useState(null)
    const addItemToBasketMutation = useShopperBasketsMutation('addItemToBasket')
    const createBasketMutation = useShopperBasketsMutation('createBasket')
    const applyPromoCodeMutation = useShopperBasketsMutation('addCouponToBasket')
    const updateBasket = useShopperBasketsMutation('updateBasket')
    const removeItemBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    useEffect(() => {
        const eswClientLastOrderId = localStorage.getItem('esw.clientLastOrderId')
        // Update basket currency
        const updateBasketCurrency = async (basketId) => {
            let eswShopperCurrency = getCountryCodeByLocale(locale, site)
            await updateBasket.mutateAsync({
                parameters: {basketId: basketId},
                body: {c_eswShopperCurrency: eswShopperCurrency}
            })
        }
        const createBasket = async () => {
            const data = await createBasketMutation.mutateAsync({
                body: {}
            })
            return data
        }
        if (hasTriggered.current || !basketsData) return
        hasTriggered.current = true
        // Rebuild cart if any
        if (eswClientLastOrderId && basketsData) {
            const rebuildCart = async () => {
                if (eswClientLastOrderId && basketsData) {
                    let dataResponse
                    // If there are no baskets, create a new one
                    if (basketsData?.total === 0) {
                        dataResponse = await createBasket()
                    }
                    try {
                        // Call getAbandonmentCartHelper after basket creation (if needed)
                        const response = await getAbandonmentCartHelper(
                            eswClientLastOrderId,
                            locale
                        )
                        const data = await response.json()

                        const basketId =
                            basketsData?.baskets?.[0]?.basketId || dataResponse?.basketId
                        let removeLineItems = data.removeLineItems

                        // Update basket currency
                        updateBasketCurrency(basketId)

                        let couponCodes = data.couponCodes
                        let productItems = data.orderLineItems.products
                        let basketProductItems = data.basketItems.products

                        // Handle items and promotions
                        if (!removeLineItems) {
                            if (couponCodes || productItems) {
                                if (couponCodes && couponCodes.length > 0) {
                                    for (const couponCode of couponCodes) {
                                        await applyPromoCodeMutation.mutateAsync({
                                            parameters: {basketId: basketId},
                                            body: couponCode
                                        })
                                    }
                                }
                                if (productItems && productItems.length > 0) {
                                    await addItemToBasketMutation.mutateAsync({
                                        parameters: {basketId: basketId},
                                        body: productItems
                                    })
                                }
                            }
                        } else {
                            // Remove items from the basket if needed
                            basketProductItems.forEach(async (element) => {
                                await removeItemBasketMutation.mutateAsync({
                                    parameters: {basketId: basketId, itemId: element.lineItemId}
                                })
                            })
                        }
                        // Clean up after successful cart rebuild
                        localStorage.removeItem('esw.clientLastOrderId')
                    } catch (error) {
                        showToast({
                            title: formatMessage(API_ERROR_MESSAGE),
                            status: 'error'
                        })
                    }
                }
            }
            // Trigger the cart rebuild process
            rebuildCart()
        }
    }, [basketsData])
    useEffect(() => {
        const eswFirstVisit = isFirstVisit()
        const eswShopperCountry = getShopperCountry()
        const eswShopperLocale = getLocaleByCountry(eswShopperCountry, site)
        // Getting Esw Configs
        eswAppInit(locale)
        // Getting geo ip alert info
        getGeoIpAlertInfo(eswShopperCountry)
            .then((response) => response.json())
            .then((data) => {
                let ignoredGeoIp = localStorage.getItem('esw.GeoIpChangeIgnore')
                let currentGeoLocation = data.geoIpInfo.geoLocation
                if (
                    getLocaleCountry(locale) === currentGeoLocation ||
                    ignoredGeoIp === currentGeoLocation
                ) {
                    setOpenGeoIpAlert(false)
                } else {
                    setOpenGeoIpAlert(
                        (eswShopperLocale &&
                            eswShopperLocale.length > 0 &&
                            !data.geoIpInfo.isSameCountry) ||
                            (eswFirstVisit &&
                                eswShopperLocale &&
                                eswShopperLocale.length > 0 &&
                                eswShopperLocale !== locale)
                    )
                    setEswGeoIpBody(data.geoIpInfo.alertMsg.body)
                    setEswGeoIpLocation(currentGeoLocation)
                    setEswGeoIpTitle(data.geoIpInfo.alertMsg.title)
                }
            })
    }, [])

    return (
        <>
            {openGeoIpAlert ? (
                <EswGeoIpModel
                    shopperLocation={eswGeoIpLocation}
                    title={eswGeoIpTitle}
                    body={eswGeoIpBody}
                />
            ) : (
                <></>
            )}
        </>
    )
}

EswInit.propTypes = {
    locale: PropTypes.string,
    site: PropTypes.object
}
