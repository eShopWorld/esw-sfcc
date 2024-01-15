import React, {useEffect, useState} from 'react'
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

export const EswInit = (props) => {
    const {locale, site} = props
    const {formatMessage} = useIntl()
    const showToast = useToast()
    const [openGeoIpAlert, setOpenGeoIpAlert] = useState(false)
    const [eswGeoIpTitle, setEswGeoIpTitle] = useState(null)
    const [eswGeoIpBody, setEswGeoIpBody] = useState(null)
    const [eswGeoIpLocation, setEswGeoIpLocation] = useState(null)
    const addItemToBasketMutation = useShopperBasketsMutation('addItemToBasket')
    const applyPromoCodeMutation = useShopperBasketsMutation('addCouponToBasket')
    const updateBasket = useShopperBasketsMutation('updateBasket')
    useEffect(() => {
        const eswFirstVisit = isFirstVisit()
        const eswShopperCountry = getShopperCountry()
        const eswShopperLocale = getLocaleByCountry(eswShopperCountry, site)
        const eswClientLastOrderId = localStorage.getItem('esw.clientLastOrderId')
        // Update basket currency
        const updateBasketCurrency = async (basketId) => {
            let eswShopperCurrency = getCountryCodeByLocale(locale, site)
            await updateBasket.mutateAsync({
                parameters: {basketId: basketId},
                body: {c_eswShopperCurrency: eswShopperCurrency}
            })
        }
        // Rebuild cart if any
        setTimeout(() => {
            getAbandonmentCartHelper(eswClientLastOrderId, locale)
                .then((response) => response.json())
                .then(async (data) => {
                    let basketId = data.basketId
                    updateBasketCurrency(basketId)
                    try {
                        let couponCodes = data.couponCodes
                        let productItems = data.orderLineItems.products
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
                            localStorage.removeItem('esw.clientLastOrderId')
                        }
                    } catch (error) {
                        showToast({
                            title: formatMessage(API_ERROR_MESSAGE),
                            status: 'error'
                        })
                    }
                })
        }, 2000)
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
