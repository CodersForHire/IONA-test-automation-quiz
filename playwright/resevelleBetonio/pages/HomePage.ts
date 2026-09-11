import { Page, Locator } from '@playwright/test';
import { API_RESPONSE_TIMEOUT } from '../support/timeouts';

export type Category = 'Phones' | 'Laptops' | 'Monitors';

/**
 * Home page (index.html) — category list and product grid.
 * Category links all share id="itemc" and product tiles have no id, so
 * both are selected by visible name.
 */
export class HomePage {
  readonly page: Page;
  readonly productTiles: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTiles = page.locator('#tbodyid .card-title a');
  }

  async goto(): Promise<void> {
    await this.page.goto('/', { timeout: API_RESPONSE_TIMEOUT });
    await this.productTiles.first().waitFor({ timeout: API_RESPONSE_TIMEOUT });
  }

  async selectCategory(category: Category): Promise<void> {
    // The previous category's tiles stay on screen until /bycat answers,
    // so a "tile is visible" check would pass too early.
    const categoryLoaded = this.page.waitForResponse((response) => response.url().includes('/bycat'), {
      timeout: API_RESPONSE_TIMEOUT,
    });
    await this.page.getByRole('link', { name: category, exact: true }).click();
    await categoryLoaded;
  }

  async openProduct(productName: string): Promise<void> {
    await this.page.getByRole('link', { name: productName, exact: true }).click();
  }
}
