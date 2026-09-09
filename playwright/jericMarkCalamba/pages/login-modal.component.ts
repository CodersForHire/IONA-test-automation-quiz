import { Page, Locator } from '@playwright/test';
import { raceDialogOrCondition } from '../support/dialogHelpers';

/**
 * Page Object for the "Log in" Bootstrap modal (#logInModal).
 * Reached via HomePage.openLoginModal().
 */
export class LoginModalComponent {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const modal = page.locator('#logInModal');
    // Last resort (CSS id), not a style choice: verified live against the
    // deployed markup that these <label for="..."> attributes point to
    // "log-name" / "log-pass", which don't match the actual input ids
    // ("loginusername" / "loginpassword") - a genuine bug in DemoBlaze's
    // own markup, not this suite's. getByLabel() therefore cannot resolve
    // these fields at all; the id is the only reliable locator available.
    // (Contrast with SignupModalComponent's fields, where the label
    // association is correct and getByLabel() is used.)
    this.usernameInput = modal.locator('#loginusername');
    this.passwordInput = modal.locator('#loginpassword');
    this.submitButton = modal.getByRole('button', { name: 'Log in' });
  }

  async fill(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Submits the login form and resolves once either:
   *  - a native alert appears (invalid credentials) - returns its message, or
   *  - the modal closes because login succeeded - returns null.
   * DemoBlaze calls a backend API before deciding which happens, so we race
   * both outcomes instead of assuming one (see raceDialogOrCondition, which
   * also makes sure a login that succeeds - no dialog at all - doesn't leave
   * a stale dialog listener behind to interfere with a later, unrelated
   * alert elsewhere in the test).
   */
  async submitAndCapture(): Promise<string | null> {
    const modalClosed = this.page
      .locator('#logInModal')
      .waitFor({ state: 'hidden', timeout: 8000 })
      .catch(() => undefined);

    const resultPromise = raceDialogOrCondition(this.page, modalClosed);
    await this.submitButton.click();
    return resultPromise;
  }

  async login(username: string, password: string) {
    await this.fill(username, password);
    return this.submitAndCapture();
  }
}
