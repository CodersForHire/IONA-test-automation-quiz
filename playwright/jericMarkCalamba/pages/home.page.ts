import { Page, Locator, expect } from '@playwright/test';

export type Category = 'Phones' | 'Laptops' | 'Monitors';

/**
 * Page Object for the DemoBlaze homepage / global navigation bar.
 * The nav bar (login/logout/signup/cart links, "Welcome <user>" text) is
 * present on every page, so other page objects reuse these locators too.
 *
 * Per the team's locator-priority convention (role/label/testid before
 * CSS/XPath), every locator below is role-based unless a comment next to
 * it explains why that wasn't possible for that specific element.
 */
export class HomePage {
  readonly page: Page;

  readonly loginNavLink: Locator;
  readonly logoutNavLink: Locator;
  readonly signupNavLink: Locator;
  readonly cartNavLink: Locator;
  readonly welcomeText: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // "Log in" / "Log out" / "Sign up" are plain <a> nav links with stable,
    // unique visible text - verified live against the deployed markup - so
    // role-based locators work cleanly here, same as cartNavLink below.
    this.loginNavLink = page.getByRole('link', { name: 'Log in' });
    this.logoutNavLink = page.getByRole('link', { name: 'Log out' });
    this.signupNavLink = page.getByRole('link', { name: 'Sign up' });
    this.cartNavLink = page.getByRole('link', { name: 'Cart' });
    // Last resort (CSS id): unlike the links above, this <a id="nameofuser">
    // starts hidden with NO text content - DemoBlaze sets its text via JS
    // only after a successful login ("Welcome " + username) - so there is
    // no accessible name to match against until that happens, and the name
    // itself is dynamic per-user besides. The id is the only stable anchor.
    this.welcomeText = page.locator('#nameofuser');
    // Last resort (CSS class): selects every product-title link on the
    // current grid collectively (used with .first()/.count()), which no
    // single role+name pair can express - `getByRole('link')` alone would
    // also match unrelated nav links (Cart, Log in, ...), which is worse.
    this.productCards = page.locator('.card-title a');
  }

  async goto() {
    await this.page.goto('/');
    // The homepage renders products asynchronously; wait for the first card.
    await expect(this.productCards.first()).toBeVisible();
  }

  /**
   * Clicks the nav link that opens `#logInModal`/`#signInModal` and waits
   * for Bootstrap's own `shown.bs.modal` event, confirmed live against the
   * site rather than assumed: DemoBlaze runs a very old Bootstrap
   * 4.0.0-alpha.6, whose modal-show transition can take far longer than
   * its 150ms CSS transition-duration to actually settle (observed up to
   * ~2s in this environment).
   *
   * Two distinct failure modes were reproduced live against the deployed
   * `bootstrap.min.js` source, both stemming from the modal's internal
   * `_isShown` / `_isTransitioning` flags:
   *  - Calling `.modal('show')` while `_isTransitioning` is still true
   *    (an earlier hide's transition hasn't finished) makes Bootstrap
   *    THROW a synchronous "Modal is transitioning" error from inside the
   *    click handler, so our `shown.bs.modal` listener never gets a
   *    chance to fire.
   *  - Calling `.modal('show')` while `_isShown` is still true (the
   *    previous open's hide() hasn't run yet, or ran but the reset raced
   *    us) makes Bootstrap silently no-op the whole show sequence -
   *    `_isTransitioning` even gets left stuck `true` afterwards - so
   *    `shown.bs.modal` never fires either, and the caller hangs until the
   *    test's own timeout.
   * Both flags are only guaranteed reset once the modal's own
   * `hidden.bs.modal` event has fired (that's the exact statement in
   * Bootstrap's source that flips them back), so if the modal is
   * currently shown or transitioning we wait for that real event before
   * attempting to reopen it, instead of trusting a fixed delay. A bounded
   * overall timeout guards the whole thing so a genuinely stuck modal
   * fails fast with a clear error rather than exhausting the test's full
   * timeout budget.
   */
  private async openModal(navLinkId: string, modalId: string) {
    await this.page.evaluate(
      ({ navLinkId, modalId }) =>
        new Promise<void>((resolve, reject) => {
          // No DOM lib in this project's tsconfig (Playwright test files
          // don't need one) - globalThis carries the browser globals this
          // callback actually runs against once Playwright ships it to the
          // page, so we go through `any` deliberately rather than adding a
          // DOM lib just for this one legacy-jQuery interop point.
          const win = globalThis as any;
          const $ = win.jQuery;
          const $modal = $(`#${modalId}`);

          const timeoutId = win.setTimeout(() => {
            $modal.off('shown.bs.modal', onShown);
            reject(new Error(`Timed out opening #${modalId}: 'shown.bs.modal' never fired.`));
          }, 10000);

          const onShown = () => {
            win.clearTimeout(timeoutId);
            resolve();
          };

          const openIt = () => {
            $modal.one('shown.bs.modal', onShown);
            win.document.getElementById(navLinkId).click();
          };

          const modalData = $modal.data('bs.modal');
          if (modalData && (modalData._isShown || modalData._isTransitioning)) {
            $modal.one('hidden.bs.modal', openIt);
          } else {
            openIt();
          }
        }),
      { navLinkId, modalId }
    );
  }

  async openLoginModal() {
    await this.openModal('login2', 'logInModal');
  }

  async openSignupModal() {
    await this.openModal('signin2', 'signInModal');
  }

  async logout() {
    await this.logoutNavLink.click();
  }

  async selectCategory(category: Category) {
    await this.page.getByRole('link', { name: category, exact: true }).click();
    // Product list re-renders via JS; wait for at least one card to be visible.
    await expect(this.productCards.first()).toBeVisible();
  }

  /** Clicks a product by its exact visible name from the current product grid. */
  async selectProduct(productName: string) {
    await this.page.getByRole('link', { name: productName, exact: true }).click();
    await expect(this.page.getByRole('heading', { name: productName, exact: true })).toBeVisible();
  }

  async goToCart() {
    await this.cartNavLink.click();
  }
}
