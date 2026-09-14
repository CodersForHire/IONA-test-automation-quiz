import { expect, Locator, Page } from '@playwright/test';
import type { CheckoutCustomer } from '../test-data/checkoutData';
import { handleDialog } from '../utils/dialog';

export class CartPage {
    private readonly page: Page;
    private readonly placeOrderBtn: Locator;
    private readonly orderModal: Locator;
    private readonly nameInput: Locator;
    private readonly countryInput: Locator;
    private readonly cityInput: Locator;
    private readonly cardInput: Locator;
    private readonly monthInput: Locator;
    private readonly yearInput: Locator;
    private readonly purchaseBtn: Locator;
    private readonly purchaseConfirmation: Locator;

    constructor(page: Page) {
        this.page = page;

        this.placeOrderBtn = page
            .getByRole('button', { name: 'Place Order' })
            .describe('Place Order button');

        this.orderModal = page
            .locator('#orderModal')
            .describe('Place Order modal');

        this.nameInput = this.orderModal.locator('#name');
        this.countryInput = this.orderModal.locator('#country');
        this.cityInput = this.orderModal.locator('#city');
        this.cardInput = this.orderModal.locator('#card');
        this.monthInput = this.orderModal.locator('#month');
        this.yearInput = this.orderModal.locator('#year');

        this.purchaseBtn = this.orderModal
            .getByRole('button', { name: 'Purchase' })
            .describe('Purchase button');
        this.purchaseConfirmation = this.page
            .getByRole('heading', { name: 'Thank you for your purchase!' })
            .locator('..');
    }

    async checkCartPage() {
        await expect(this.page).toHaveURL(/\/cart\.html$/);
    }

    async checkCartItem(product: string) {
        const productRow = this.page
            .locator('#tbodyid tr')
            .filter({ hasText: product })
            .first();

        await expect(productRow).toBeVisible();
        await expect(productRow).toContainText(product);
    }

    async checkCartItems(products: string[]) {
        for (const product of products) {
            await this.checkCartItem(product);
        }
    }

    async placeOrder(
        name: string,
        country: string,
        city: string,
        card: string,
        month: string,
        year: string
    ): Promise<string | undefined> {
        await this.openOrderModal();

        await this.nameInput.fill(name);
        await this.countryInput.fill(country);
        await this.cityInput.fill(city);
        await this.cardInput.fill(card);
        await this.monthInput.fill(month);
        await this.yearInput.fill(year);

        const dialogMessage = await handleDialog(
            this.page,
            () => this.purchaseBtn.click()
        );

        // If there was a validation dialog, return its message.
        if (dialogMessage) {
            return dialogMessage;
        }

        // Otherwise, wait for the successful purchase confirmation.
        await expect(this.purchaseConfirmation).toBeVisible();

        return (await this.purchaseConfirmation.textContent()) ?? '';
    }
    private async openOrderModal() {
        await this.placeOrderBtn.click();
        await expect(this.orderModal).toBeVisible();
    }

    async getTotalAmount(): Promise<number> {
        const rows = this.page.locator('#tbodyid tr');
        let totalAmount = 0;
        const rowCount = await rows.count();
        for (let i = 0; i < rowCount; i++) {
            const priceText = await rows.nth(i).locator('td').nth(2).textContent();
            const price = parseFloat(priceText?.trim() ?? '0');

            if (Number.isNaN(price)) {
                throw new Error(`Invalid product price: "${priceText}"`);
            }

            totalAmount += price;
        }

        return totalAmount;
    }

    async verifyCartIsEmpty() {
        const cartItems = this.page.locator('#tbodyid tr');
        await expect(cartItems).toHaveCount(0);
    }

    async verifyPlaceOrderIsNotAvailable() {
        await expect(this.placeOrderBtn).not.toBeVisible();
    }

    async clearCart() {
        const cartRows = this.page.locator('#tbodyid tr');
        while (await cartRows.count() > 0) {
            const currentCount = await cartRows.count();
            await cartRows
                .first()
                .getByText('Delete')
                .click();
            await expect(cartRows).toHaveCount(currentCount - 1);
        }
    }

    async verifyPurchaseConfirmation(
        totalAmount: number,
        customer: CheckoutCustomer
    ) {
        await expect(this.purchaseConfirmation).toContainText(
            `Amount: ${totalAmount} USD`
        );

        await expect(this.purchaseConfirmation).toContainText(
            `Card Number: ${customer.card}`
        );

        await expect(this.purchaseConfirmation).toContainText(
            `Name: ${customer.name}`
        );

        await expect(this.purchaseConfirmation).toContainText('Id:');
        await expect(this.purchaseConfirmation).toContainText('Date:');
    }
    async verifyValidationMessage(
        actualMessage: string | undefined,
        expectedMessage: string
    ) {
        expect(actualMessage).toBe(expectedMessage);
    }
}