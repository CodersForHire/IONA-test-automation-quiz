import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for cart.html - the cart table, running total, and the
 * entry point into the "Place order" checkout modal.
 *
 * Note: cart rows are populated by an async XHR after navigation, so we
 * deliberately avoid a blanket `networkidle` wait here (DemoBlaze's page
 * keeps background/analytics requests going, which makes `networkidle`
 * unreliable). Instead every read below uses Playwright's auto-retrying
 * `expect(...)` / locator API, which waits for the real condition.
 */
export class CartPage {
  readonly page: Page;
  readonly rows: Locator;
  readonly totalPrice: Locator;
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Last resort (CSS id): the cart <table> has no <caption>/accessible
    // name of its own to select rows by role, and rows are otherwise
    // indistinguishable (same implicit "row" role, no unique names) - so
    // the container id is the only stable anchor. Individual rows are
    // still identified by their visible content via rowFor()'s
    // `.filter({ hasText })` below rather than a brittle index, per the
    // team's locator-strategy convention for dynamic lists.
    this.rows = page.locator('#tbodyid tr');
    // Last resort (CSS id): a running total with dynamic numeric content
    // and no distinguishing accessible name/role beyond a generic heading.
    this.totalPrice = page.locator('#totalp');
    this.placeOrderButton = page.getByRole('button', { name: 'Place Order' });
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  rowFor(productName: string): Locator {
    return this.rows.filter({ hasText: productName });
  }

  /** Clicks the Delete link on the row for `productName`. Purely the
   *  action - callers assert on the resulting state themselves (e.g.
   *  `expect(cart.rowFor(productName)).toHaveCount(0)`), consistent with
   *  keeping assertions in the test rather than the page object. */
  async deleteProduct(productName: string) {
    const row = this.rowFor(productName);
    await row.getByRole('link', { name: 'Delete' }).click();
  }

  /**
   * Opens the "Place order" modal and waits for Bootstrap's own
   * `shown.bs.modal` event, not just Playwright's visibility check.
   *
   * This mirrors HomePage.openModal()'s already-verified finding about
   * this app's Bootstrap 4.0.0-alpha.6 build: a modal's heading can report
   * as visible to Playwright's actionability checks before Bootstrap's own
   * transition machinery - and this modal's input fields - are actually
   * settled. This method was added reactively, after intermittent
   * cross-browser runs produced "Please fill out Name and Creditcard."
   * validation failures with clearly non-empty Faker-generated data, which
   * is the failure signature of `checkout.fill()` landing on a still-
   * transitioning modal. Unlike openModal(), this does not additionally
   * guard against reopening an already-shown/transitioning modal, because
   * no test in this suite opens the checkout modal more than once.
   *
   * Flagged honestly: the earlier finding for openModal() was confirmed
   * live against the deployed site; this one has not been independently
   * reproduced the same way (no local WebKit/Firefox access from this
   * environment) - it's the most plausible explanation given the suite's
   * own prior findings about this exact Bootstrap version, not a
   * live-confirmed root cause. If the blank-field failures persist after
   * this change, that finding would need to be treated as still open.
   */
  async openCheckout() {
    await this.page.evaluate(() => {
      const win = window as any;
      const $ = win.jQuery;
      const $modal = $('#orderModal');
      win.__orderModalShown = new Promise<void>((resolve, reject) => {
        const timeoutId = win.setTimeout(() => {
          $modal.off('shown.bs.modal', onShown);
          reject(new Error("Timed out opening #orderModal: 'shown.bs.modal' never fired."));
        }, 10000);
        const onShown = () => {
          win.clearTimeout(timeoutId);
          resolve();
        };
        $modal.one('shown.bs.modal', onShown);
      });
    });
    await this.placeOrderButton.click();
    await this.page.evaluate(() => (window as any).__orderModalShown);
    // The heading check stays as a second, independent confirmation.
    await expect(this.page.getByRole('heading', { name: 'Place order' })).toBeVisible();
  }
}
