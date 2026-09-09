import { Page, Locator } from '@playwright/test';
import { captureNextDialog } from '../support/dialogHelpers';

/**
 * Page Object for a single product detail page (prod.html?idp_=N).
 */
export class ProductPage {
  readonly page: Page;
  readonly addToCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addToCartLink = page.getByRole('link', { name: 'Add to cart' });
  }

  /**
   * Adds the current product to the cart and returns the native
   * `window.alert(...)` message DemoBlaze shows ("Product added" or
   * "Product added." - see data/testData.ts#PRODUCT_ADDED_MESSAGES).
   * Callers assert on the returned message themselves, e.g.:
   *   const message = await product.addToCart();
   *   expect(PRODUCT_ADDED_MESSAGES).toContain(message);
   */
  async addToCart(): Promise<string> {
    const dialogMessage = captureNextDialog(this.page);
    await this.addToCartLink.click();
    return dialogMessage;
  }
}
