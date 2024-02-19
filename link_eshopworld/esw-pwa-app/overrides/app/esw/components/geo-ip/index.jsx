import React from 'react'
import PropTypes from 'prop-types'

import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    ModalBody,
    ModalHeader,
    ModalFooter,
    useDisclosure
} from '@chakra-ui/react'
import {getPathWithLocale} from '@salesforce/retail-react-app/app/utils/url'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
export const EswGeoIpModel = (props) => {
    const {title, body, shopperLocation} = props
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {site, buildUrl} = useMultiSite()

    const {isOpen, onClose} = useDisclosure({
        defaultIsOpen: true
    })

    const eswHandleGeoIpClose = (currentGeoLocation, changeLocale) => {
        if (typeof currentGeoLocation !== 'undefined' && changeLocale) {
            let currentShopperLocation = currentGeoLocation.toLowerCase()
            const newUrl = getPathWithLocale(currentShopperLocation, buildUrl, {
                disallowParams: ['refine']
            })
            window.location.replace(newUrl)
        } else {
            localStorage.setItem('esw.GeoIpChangeIgnore', currentGeoLocation)
            onClose()
        }
    }
    return (
        <>
            <Modal isOpen={isOpen} onClose={() => eswHandleGeoIpClose(shopperLocation, false)}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{title}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>{body}</ModalBody>
                    <ModalFooter>
                        <Button
                            colorScheme="blue"
                            mr={3}
                            onClick={() => eswHandleGeoIpClose(shopperLocation, false)}
                        >
                            Continue
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => eswHandleGeoIpClose(shopperLocation, true)}
                        >
                            Change to current country
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}

EswGeoIpModel.propTypes = {
    title: PropTypes.string.isRequired,
    shopperLocation: PropTypes.string,
    body: PropTypes.string.isRequired
}
