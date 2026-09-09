import { Page, Locator } from '@playwright/test';
import { captureNextDialog } from '../support/dialogHelpers';

/**
 * Page Object for the "Sign up" Bootstrap modal (#signInModal).
 * Reached via HomePage.openSignupModal().
 */
export class SignupModalComponent {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const modal = page.locator('#signInModal');
    // Unlike LoginModalComponent's fields, this modal's
    // <label for="sign-username"> / <label for="sign-password"> attributes
    // correctly match the actual input ids - verified live against the
    // deployed markup - so getByLabel() resolves them cleanly. Scoped to
    // `modal` so it can't collide with the identically-worded
    // "Username:"/"Password:" labels in the separate login modal.
    this.usernameInput = modal.getByLabel('Username:');
    this.passwordInput = modal.getByLabel('Password:');
    this.submitButton = modal.getByRole('button', { name: 'Sign up' });
  }

  async fill(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /** Submits and returns the resulting alert text ("Sign up successful."
   *  or "This user already exist."). DemoBlaze always answers with a
   *  native alert here, so unlike login there is nothing else to race -
   *  but see captureNextDialog() for why we still wait for the dialog to
   *  be fully accepted before resolving (needed so a caller that
   *  immediately reopens this same modal for a second attempt doesn't
   *  race a still-open native alert and have its click silently dropped). */
  async submitAndCapture(): Promise<string> {
    const dialogMessage = captureNextDialog(this.page);
    await this.submitButton.click();
    return dialogMessage;
  }

  async signUp(username: string, password: string): Promise<string> {
    await this.fill(username, password);
    return this.submitAndCapture();
  }
}
