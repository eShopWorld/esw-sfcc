import React from 'react'
import PropTypes from 'prop-types'
import {FormattedNumber} from 'react-intl'
import {Text, Stack, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'

export const ESWOrderPaymentInfo = (props) => {
    const {order} = props
    const splitPaymentInfo = []

    if (order?.paymentInstruments && order?.paymentInstruments.length > 1) {
        const paymentInstruments = order?.paymentInstruments

        paymentInstruments?.forEach((pi) => {
            const pisInfo = pi
            if (pisInfo && pisInfo?.amount && pisInfo?.paymentMethodId) {
                splitPaymentInfo.push({
                    eswPaymentAmount: Number(pisInfo?.amount),
                    eswPaymentMethodCardBrand: pisInfo?.paymentMethodId
                })
            }
        })
    }

    if (splitPaymentInfo.length === 0) {
        return null // Return null to render nothing if there's no payment information
    }

    return (
        <div>
            {splitPaymentInfo.map((info, index) => (
                <div key={index}>
                    <Stack>
                        <Flex>
                            <Text fontWeight="bold" fontSize={'md'}>
                                <span>{info.eswPaymentMethodCardBrand}</span>
                            </Text>
                            {info.eswPaymentMethodCardBrand === 'visa' ? (
                                <span>......................................</span>
                            ) : (
                                <span>..................</span>
                            )}
                            <span>
                                <FormattedNumber
                                    style="currency"
                                    currency={order.currency}
                                    value={info.eswPaymentAmount}
                                />
                            </span>
                        </Flex>
                    </Stack>
                </div>
            ))}
        </div>
    )
}

ESWOrderPaymentInfo.propTypes = {
    order: PropTypes.string.isRequired
}
