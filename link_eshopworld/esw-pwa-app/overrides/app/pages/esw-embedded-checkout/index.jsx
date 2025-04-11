import React, {useEffect} from 'react'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import Section from '@salesforce/retail-react-app/app/components/section'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
// ESW Custom Imports
import {getEswConfigByKey} from '../../esw/esw-helpers'

const EswEmbeddedCheckout = () => {
    const intl = useIntl()

    useEffect(() => {
        const scriptPath = getEswConfigByKey('eswEmbeddedCheckoutScriptPath')
        const embeddedCheckoutCookieName = getEswConfigByKey('ecCookieName')

        // Function to get the value of a cookie by name
        const getCookieValue = (cookieName) => {
            const cookies = document.cookie.split('; ')
            const cookie = cookies.find((row) => row.startsWith(`${cookieName}=`))
            return cookie ? cookie.split('=')[1] : null
        }

        // Function to validate if a string is a valid URL
        const isValidUrl = (url) => {
            try {
                // eslint-disable-next-line no-new
                new URL(url)
                return true
            } catch (e) {
                return false
            }
        }

        const embeddedCheckoutCookieValue = getCookieValue(embeddedCheckoutCookieName)

        if (scriptPath) {
            const script = document.createElement('script')
            script.src = scriptPath
            script.defer = true
            document.body.appendChild(script)

            // MutationObserver to detect iframe insertion and set its height
            const container = document.querySelector('.esw-iframe-checkout')
            const observer = new MutationObserver(() => {
                const urlParams = new URLSearchParams(window.location.search)
                const eswCheckoutUrl = !isValidUrl(urlParams.get('eswiframeurl'))
                    ? embeddedCheckoutCookieValue
                    : urlParams.get('eswiframeurl')
                const iframe = container?.querySelector('iframe')
                if (iframe) {
                    iframe.style.height = '100vh'
                    observer.disconnect() // Stop observing after the iframe is found
                }
                // Set a timeout for 7 seconds
                const iframeContent = iframe.contentDocument || iframe.contentWindow?.document
                setTimeout(function () {
                    if (!iframe || !iframeContent || iframeContent.body?.childElementCount === 0) {
                        // Redirect to fallback URL if iframe is not loaded
                        if (eswCheckoutUrl) {
                            window.location.href = eswCheckoutUrl // Redirect to the eswCheckoutUrl
                        }
                    }
                }, 7000)
            })

            if (container) {
                observer.observe(container, {childList: true})
            }

            // Cleanup: remove script if this component unmounts
            return () => {
                document.body.removeChild(script)
                observer.disconnect()
            }
        }
        return scriptPath
    }, [])

    return (
        <>
            <Box data-testid="em" layerStyle="page" className="esw-iframe-checkout-container">
                <Seo
                    title="Embedded Checkout Page"
                    description="Commerce Cloud Retail React App"
                    keywords="Commerce Cloud, Retail React App, React Storefront"
                />
                <Section
                    padding={4}
                    paddingTop={16}
                    title={intl.formatMessage({
                        defaultMessage: 'Checkout',
                        id: 'esw-iframe-checkout-container.heading.checkout'
                    })}
                >
                    <Box
                        as={Section}
                        className="esw-iframe-checkout"
                        width="100%"
                        display="flex"
                        justifyContent="center"
                        overflow="hidden"
                        border="0"
                    ></Box>
                </Section>
            </Box>
        </>
    )
}

EswEmbeddedCheckout.getTemplateName = () => 'esw-embedded-checkout'

export default EswEmbeddedCheckout
