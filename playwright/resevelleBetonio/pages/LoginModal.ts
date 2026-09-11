import { Page, Locator } from '@playwright/test';
import { Credentials } from '../test-data/users';

/** "Log in" modal (#logInModal). Failures are reported as native alerts. */
export class LoginModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#logInModal');
    this.usernameInput = page.locator('#loginusername');
    this.passwordInput = page.locator('#loginpassword');
    this.submitButton = this.modal.getByRole('button', { name: 'Log in' });
  }

  async fill({ username, password }: Credentials): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async loginAs(credentials: Credentials): Promise<void> {
    await this.fill(credentials);
    await this.submit();
  }
}
