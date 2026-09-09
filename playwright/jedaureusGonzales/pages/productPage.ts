import { expect, Page } from '@playwright/test';

export class ProductPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(productName: string, productId: number): Promise<void> {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const productResponse = this.page
        .waitForResponse(
          (response) => response.url().endsWith('/view') && response.request().method() === 'POST',
          { timeout: 15000 },
        )
        .catch(() => null);

      if (!this.page.url().includes(`idp_=${productId}`) || attempt > 1) {
        await this.page.goto(`/prod.html?idp_=${productId}`);
      }

      await productResponse;

      const productHeading = this.page.locator('h2.name');
      const addToCartLink = this.page.getByRole('link', { name: 'Add to cart' });

      if ((await productHeading.count()) > 0 && (await addToCartLink.count()) > 0) {
        await expect(productHeading).toHaveText(productName);
        await expect(addToCartLink).toBeVisible();
        return;
      }
    }

    await expect(this.page.locator('h2.name')).toHaveText(productName);
  }

  async addToCart(expectedMessage: string | RegExp): Promise<void> {
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 20000 });
    const addToCartResponse = this.page.waitForResponse(
      (response) => response.url().endsWith('/addtocart') && response.request().method() === 'POST',
      { timeout: 20000 },
    );

    await this.page.getByRole('link', { name: 'Add to cart' }).click();
    await addToCartResponse;

    const dialog = await dialogPromise;

    if (expectedMessage instanceof RegExp) {
      expect(dialog.message()).toMatch(expectedMessage);
    } else {
      expect(dialog.message()).toBe(expectedMessage);
    }
    await dialog.accept();
  }
}