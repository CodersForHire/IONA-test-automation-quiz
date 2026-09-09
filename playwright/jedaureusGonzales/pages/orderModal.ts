import { expect, Page } from '@playwright/test';

import type { PurchaseDetails } from '../data/testData';

export class OrderModal {
  constructor(private readonly page: Page) {}

  async fill(details: PurchaseDetails): Promise<void> {
    await this.page.locator('#name').fill(details.name);
    await this.page.locator('#country').fill(details.country);
    await this.page.locator('#city').fill(details.city);
    await this.page.locator('#card').fill(details.creditCard);
    await this.page.locator('#month').fill(details.month);
    await this.page.locator('#year').fill(details.year);
  }

  async purchase(): Promise<void> {
    await this.page.locator('#orderModal button', { hasText: 'Purchase' }).click({ force: true });
  }

  async purchaseExpectAlert(expectedMessage: string): Promise<void> {
    let dialogMessage = '';
    const dialogPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Dialog did not appear within 20 seconds.'));
      }, 20000);

      this.page.once('dialog', async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.accept();
        clearTimeout(timeout);
        resolve();
      });
    });

    await this.purchase();
    await dialogPromise;
    expect(dialogMessage).toBe(expectedMessage);
  }

  async expectSuccess(): Promise<void> {
    await expect(this.page.locator('.sweet-alert')).toBeVisible();
    await expect(this.page.locator('.sweet-alert h2')).toHaveText('Thank you for your purchase!');
  }

  async expectConfirmationDetails(expectedAmount: string): Promise<void> {
    await expect(this.page.locator('.sweet-alert p')).toContainText(`Amount: ${expectedAmount.replace('$', '')} USD`);
    await expect(this.page.locator('.sweet-alert p')).toContainText('Card Number:');
    await expect(this.page.locator('.sweet-alert p')).toContainText('Name:');
  }
}