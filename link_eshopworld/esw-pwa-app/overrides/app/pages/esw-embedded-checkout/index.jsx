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

        if (scriptPath) {
            const script = document.createElement('script')
            script.src = scriptPath
            script.defer = true
            document.body.appendChild(script)

            // MutationObserver to detect iframe insertion and set its height
            const container = document.querySelector('.esw-iframe-checkout')
            const observer = new MutationObserver(() => {
                const iframe = container?.querySelector('iframe')
                if (iframe) {
                    iframe.style.height = '100vh'
                    observer.disconnect() // Stop observing after the iframe is found
                }
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
