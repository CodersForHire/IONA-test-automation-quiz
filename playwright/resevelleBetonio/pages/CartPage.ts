import { Page, Locator, Response, expect } from '@playwright/test';
import { API_RESPONSE_TIMEOUT } from '../support/timeouts';

/**
 * Cart page (cart.html).
 *
 * Guest and logged-in carts differ on the backend: a logged-in cart is
 * scoped to the account, but the guest cart is one table shared by every
 * anonymous visitor. So: clearCart() only for logged-in flows, and guest
 * flows find their own row via rowForCartItemId().
 */
export class CartPage {
  readonly page: Page;
  readonly rows: Locator;
  readonly totalPrice: Locator;
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator('#tbodyid tr');
    this.totalPrice = page.locator('#totalp');
    this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
  }

  async goto(): Promise<void> {
    const cartLoaded = this.expectViewCart();
    await this.page.goto('/cart.html', { timeout: API_RESPONSE_TIMEOUT });
    await this.waitForRowsToRender(cartLoaded);
  }

  /**
   * Opens the cart and re-loads it until it lists exactly `count` items.
   * The backend's reads can lag its writes briefly, so a single load right
   * after adding/deleting may not reflect the change yet.
   */
  async openWithItemCount(count: number): Promise<void> {
    await expect
      .poll(
        async () => {
          await this.goto();
          return this.rows.count();
        },
        { message: `cart should list ${count} item(s)`, timeout: API_RESPONSE_TIMEOUT, intervals: [1_000, 2_000, 3_000] },
      )
      .toBe(count);
  }

  rowForProduct(productName: string): Locator {
    return this.rows.filter({ hasText: productName });
  }

  /** Row for a cart item id, as returned by ProductPage.addToCart(). */
  rowForCartItemId(id: string): Locator {
    return this.rows.filter({ has: this.page.locator(`a[onclick*="${id}"]`) });
  }

  async deleteProduct(productName: string): Promise<void> {
    await this.deleteRow(this.rowForProduct(productName).first());
  }

  /** Logged-in cart only — see class docs. */
  async clearCart(): Promise<void> {
    await this.goto();
    while ((await this.rows.count()) > 0) {
      await this.deleteRow(this.rows.first());
    }
    await this.openWithItemCount(0);
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }

  private async deleteRow(row: Locator): Promise<void> {
    // Deleting reloads the page, which re-fetches /viewcart.
    const cartReloaded = this.expectViewCart();
    await row.getByRole('link', { name: 'Delete' }).click();
    await this.waitForRowsToRender(cartReloaded);
  }

  private expectViewCart(): Promise<Response> {
    return this.page.waitForResponse((response) => response.url().includes('/viewcart'), {
      timeout: API_RESPONSE_TIMEOUT,
    });
  }

  // Rows are appended one per follow-up /view call after /viewcart, so
  // "loaded" means the row count matches the item count /viewcart returned.
  private async waitForRowsToRender(viewCart: Promise<Response>): Promise<void> {
    const { Items } = (await (await viewCart).json()) as { Items: unknown[] };
    await expect(this.rows).toHaveCount(Items.length, { timeout: API_RESPONSE_TIMEOUT });
  }
}
