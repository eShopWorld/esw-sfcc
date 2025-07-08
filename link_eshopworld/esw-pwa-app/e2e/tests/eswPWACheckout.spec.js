/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../config");

test.describe("ESW PWA Checkout", () => {
  test("shopper Lands On homePage TO ESW Checkout Flow", async ({ page }) => {
    // Navigate to the home page
    await page.goto(config.RETAIL_APP_HOME);

    // Interact with "Continue" button
    await page.getByRole('button', { name: 'Continue' }).click();

    // Add delay after clicking the "Continue" button
    await page.waitForTimeout(7000);

    // Hover over "Womens" and click on "Bracelets"
    await page.getByRole("link", { name: "Womens" }).hover();
    await page.waitForTimeout(3000); // Added delay after hover
    await page.getByRole("link", { name: "Bracelets" }).click();

    // Wait for the "Bracelets" heading to be visible
    await page.waitForTimeout(10000); // Increased delay
    await expect(page.getByRole("heading", { name: "Bracelets" })).toBeVisible();

    // Click on a product and validate
    await page.getByRole("link", { name: /Green and Brown Beaded Frontal Collar Bracelet/i }).click();
    await page.waitForTimeout(7000); // Increased delay
    await expect(
      page.getByRole("heading", { name: /Green and Brown Beaded Frontal Collar Bracelet/i })
    ).toBeVisible();

    // Increment quantity and add to cart
    await page.locator("button[data-testid='quantity-increment']").click();
    await page.waitForTimeout(3000); // Small delay before adding to cart
    await page.getByRole("button", { name: /Add to Cart/i }).click();

    // Wait for "Added to Cart" modal and close it
    const addedToCartModal = page.getByText(/2 items added to cart/i);
    await addedToCartModal.waitFor();
    await page.waitForTimeout(5000); // Added delay to ensure modal is fully loaded
    await page.getByLabel("Close").click();

    // Proceed to checkout
    await page.getByLabel(/My cart/i).click();
    await page.waitForTimeout(5000); // Delay before proceeding to checkout
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click();

    // Wait for delivery address page
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(12000); // Increased delay before checking visibility
    await expect(page.getByRole("heading", { name: /Delivery Address/i })).toBeVisible();

    // Wait before filling the form
    await page.waitForTimeout(15000); // Increased delay to ensure form fields are rendered

    // Fill in the form fields
    await page.fill('input#firstName', config.firstName);
    await page.waitForTimeout(2000); // Delay between field fills
    await page.fill('input#lastName', config.lastName);
    await page.waitForTimeout(2000);
    await page.fill('input#addressLine1', config.addressLine1);
    await page.waitForTimeout(2000);
    await page.fill('input#postalCode', config.postalCode);
    await page.waitForTimeout(2000);
    await page.fill('input#city', config.city);
    await page.waitForTimeout(2000);
    await page.fill('input#phone-number', config.phoneNumber);
    await page.waitForTimeout(2000);
    await page.fill('input#email', config.email);

    // Interact with GDPR consent checkbox
    const gdprConsentCheckbox = await page.locator('#gdprConsent input');
    await expect(gdprConsentCheckbox).toBeVisible();
    await gdprConsentCheckbox.click();
    await page.waitForTimeout(3000); // Delay to ensure interaction is registered
    await expect(gdprConsentCheckbox).toBeChecked();

    // Continue to payment
    const continueToPaymentButton = await page.locator('esw-button[customattribute="continue_to_payment_button_click_CTA"] button');
    await expect(continueToPaymentButton).toBeVisible();
    await continueToPaymentButton.click();

    // Wait for payment page
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(20000); // Increased delay for payment page to load

    // Handle payment iframe
    const iframeSelector = '#new-card-iframe';
    await page.locator(iframeSelector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000); // Added delay after scrolling into view

    const paymentIframe = page.frameLocator(iframeSelector);
    await paymentIframe.locator('#cardNumber-input').fill(config.cardNumberInput);
    await page.waitForTimeout(3000); // Delay between field fills in iframe
    await paymentIframe.locator('#cardExpiry-input').fill(config.cardExpiry);
    await page.waitForTimeout(3000);
    await paymentIframe.locator('#cardCvc-input').fill(config.cvv);
    await page.waitForTimeout(3000);
    await paymentIframe.locator('#cardName-input').fill(config.cardName);

    // Wait briefly and click "Place Order"
    await page.waitForTimeout(5000); // Additional wait before placing the order
    const placeOrderButton = await page.locator('#new-card-paynow');
    await placeOrderButton.click();

    // Validate order completion
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(20000); // Increased delay to ensure order is completed
    await expect(page.locator('.title', { hasText: 'Thank you!' })).toBeVisible();
  });
});