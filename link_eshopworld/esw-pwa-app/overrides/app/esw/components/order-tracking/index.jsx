import {useIntl} from 'react-intl'
import React from 'react'
import PropTypes from 'prop-types'
import {Tooltip, Box, Text, Image} from '@chakra-ui/react'

/**
 * This is ESW component used to render tracking.
 * @param {string} props - props
 * @return {HTMLAnchorElement} HTML -html lement
 */
export const ESWOrderTracking = (props) => {
    const {formatMessage} = useIntl()
    const {order, trackingNumber} = props
    const eswPackageReference = order?.c_eswPackageReference
    const isESWtrackingExisted = !!(trackingNumber && eswPackageReference)
    const eswPackageJSON = order?.c_eswPackageJSON || []
    const shipmentId = order?.shipments[0].shipmentId
    const trackingInfoMap = eswPackageJSON.reduce((map, shipment) => {
        if (shipment.shipmentId === shipmentId) {
            shipment.eswPackageJSONArray.forEach((item) => {
                if (item.productLineItem && item.trackingNumber && item.trackingUrl) {
                    if (!map[item.trackingNumber]) {
                        map[item.trackingNumber] = {
                            trackingUrl: item.trackingUrl,
                            productLineItems: []
                        }
                    }
                    map[item.trackingNumber].productLineItems.push({
                        id: item.productLineItem,
                        quantity: item.qty,
                        details: item.lineItemDetail
                    })
                }
            })
        }
        return map
    }, {})

    const trackingInfoArray = Object.entries(trackingInfoMap)

    const renderTooltipContent = (productLineItems) => (
        <Box>
            {productLineItems.map((item, index) => (
                <Box key={index} display="flex" alignItems="center" gap="10px" mb="10px">
                    {item.details && item.details.productImage && (
                        <Image
                            src={item.details.productImage}
                            alt="Product Image"
                            boxSize="80px"
                            objectFit="cover"
                            borderRadius="4px"
                        />
                    )}
                    <Box flex="1">
                        {item.details && item.details.name && (
                            <Text fontSize="14px" margin="0">
                                {item.details.name}
                            </Text>
                        )}
                        {item.details && item.details.color && (
                            <Text fontSize="11px" margin="2px 0">
                                <strong>Color:</strong> {item.details.color}
                            </Text>
                        )}
                        {item.details && item.details.size && (
                            <Text fontSize="11px" margin="2px 0">
                                <strong>Size:</strong> {item.details.size}
                            </Text>
                        )}
                        {item.details && item.quantity && (
                            <Text fontSize="11px" margin="2px 0">
                                <strong>Quantity:</strong> {item.quantity}
                            </Text>
                        )}
                    </Box>
                </Box>
            ))}
        </Box>
    )

    if (trackingInfoArray.length > 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '5px'
                }}
            >
                {/* eslint-disable-next-line no-shadow */}
                {trackingInfoArray.map(([trackingNumber, {trackingUrl, productLineItems}], index) =>
                    productLineItems && productLineItems.some((item) => item.details) ? (
                        <Tooltip
                            key={index}
                            bg="white"
                            boxShadow="lg"
                            borderRadius="md"
                            borderColor="gray.300"
                            borderWidth="1px"
                            color="blackAlpha.800"
                            fontSize="sm"
                            label={renderTooltipContent(productLineItems)}
                        >
                            <a
                                href={trackingUrl}
                                target="_blank"
                                className="css-3yea83"
                                rel="noreferrer"
                            >
                                {trackingNumber}
                            </a>
                        </Tooltip>
                    ) : (
                        <a
                            key={index}
                            href={trackingUrl}
                            target="_blank"
                            className="css-3yea83"
                            rel="noreferrer"
                        >
                            {trackingNumber}
                        </a>
                    )
                )}
            </div>
        )
    } else if (isESWtrackingExisted) {
        return (
            <a target="_blank" className="css-3yea83" href={trackingNumber} rel="noreferrer">
                {eswPackageReference}
            </a>
        )
    } else if (!isESWtrackingExisted && trackingNumber) {
        return <>{eswPackageReference}</>
    }
    return formatMessage({
        defaultMessage: 'Pending',
        id: 'account_order_detail.label.pending_tracking_number'
    })
}

ESWOrderTracking.propTypes = {
    order: PropTypes.string.isRequired,
    trackingNumber: PropTypes.string
}
