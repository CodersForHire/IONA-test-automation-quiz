import { Page, Locator } from '@playwright/test';
import { API_RESPONSE_TIMEOUT } from '../support/timeouts';

/** Product detail page (prod.html?idp_=N). */
export class ProductPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly price: Locator;
  readonly addToCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('.name');
    this.price = page.locator('.price-container');
    this.addToCartLink = page.getByRole('link', { name: 'Add to cart' });
  }

  /** Numeric price, parsed from e.g. "$790 *includes tax". */
  async readPrice(): Promise<number> {
    const text = await this.price.innerText();
    const match = text.match(/\$(\d+)/);
    if (!match) throw new Error(`Could not parse a price from "${text}"`);
    return Number(match[1]);
  }

  /**
   * Adds the product to the cart and returns the cart item id the site
   * generated for it. Waits for the "Product added" alert, which the site
   * raises once the backend has saved the item — navigating away before
   * that leaves the alert to block the next page.
   */
  async addToCart(): Promise<string> {
    const [request] = await Promise.all([
      this.page.waitForRequest((req) => req.url().includes('/addtocart')),
      this.page.waitForEvent('dialog', { timeout: API_RESPONSE_TIMEOUT }),
      this.addToCartLink.click(),
    ]);
    const { id } = request.postDataJSON() as { id: string };
    return id;
  }
}
