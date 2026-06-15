import {useEffect} from 'react'

export const UseSparkEffects = () => {
    useEffect(() => {
        const sparkElements = [
            '.esw-general-price',
            '.esw-cart-line-item-unit-price',
            '.esw-cart-line-item-total-price',
            '.esw-cart-quantity',
            '.esw-discount',
            '.esw-cart-surcharge',
            '.esw-cart-total',
            '.esw-minicart-subtotal',
            '.esw-price'
        ].join(', ')

        const show = () => {
            document.querySelectorAll(sparkElements).forEach(el => {
                el.style.visibility = 'visible'
            })
        }

        const hide = () => {
            document.querySelectorAll(sparkElements).forEach(el => {
                el.style.visibility = 'hidden'
            })
        }

        // Observe DOM changes (React-safe)
        const observer = new MutationObserver(() => {
            show()
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })

        // Initial run
        show()

        return () => observer.disconnect()
    }, [])
}
