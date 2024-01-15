/**
 * This is a temporary component used to illustrate the conversion of span.esw-price elements into a reusable component.
 * Remove this component once it has been integrated into your project.
 */

// Getting all imports
import React, {useState, useEffect} from 'react'
import {Box, Alert, AlertIcon, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import {convertPrice} from '../../esw/esw-calculation-helper'
import {app} from '../../../../config/default'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'

const EswExampleContentDetails = () => {
    // setting CSS to not display while getting the content
    const [contentCssDisplay, setContentCssDisplay] = useState('none')
    // Variable to store content
    const [eswSampleContent, setEswSampleContent] = useState(null)
    useEffect(() => {
        // Fetch content
        fetch(
            `${getAppOrigin()}${app.eswConfigs.ocapiProxyPath}${
                app.eswConfigs.siteUri
            }/EShopWorld-GetEswTestContent`
        )
            .then((response) => response.json())
            .then((data) => {
                // Setting content in a variable
                setEswSampleContent(data.body)
                setTimeout(() => {
                    // Convert prices by reading HTML fro the DOM
                    convertPrice()
                    // Display content
                    setContentCssDisplay('block')
                }, 1000)
            })
    }, [])

    return (
        <Box data-testid="content-details-page" layerStyle="page">
            <Stack spacing={3}>
                <Alert status="info">
                    <AlertIcon />
                    <div
                        style={{display: contentCssDisplay}}
                        dangerouslySetInnerHTML={{__html: eswSampleContent}}
                    />
                </Alert>
            </Stack>
        </Box>
    )
}

EswExampleContentDetails.getTemplateName = () => 'content-details'

export default EswExampleContentDetails
