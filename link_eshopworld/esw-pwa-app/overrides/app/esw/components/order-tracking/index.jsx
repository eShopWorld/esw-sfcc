import {useIntl} from 'react-intl'
import React from 'react'
import PropTypes from 'prop-types'

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
    if (isESWtrackingExisted) {
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
