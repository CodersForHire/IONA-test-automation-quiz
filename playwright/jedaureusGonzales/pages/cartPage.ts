import { expect, Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  async expectProduct(productName: string, price: string): Promise<void> {
    const row = this.page.locator('#tbodyid tr').filter({ hasText: productName });

    await expect(row).toContainText(productName, { timeout: 20000 });
    await expect(row).toContainText(price.replace('$', ''), { timeout: 20000 });
  }

  async openPlaceOrder(): Promise<void> {
    await this.page.getByRole('button', { name: 'Place Order' }).click();
    await expect(this.page.locator('#orderModal')).toBeVisible();
  }
}