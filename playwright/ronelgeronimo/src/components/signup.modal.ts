import type { Locator, Page } from '@playwright/test';

import { LOCATORS } from '../locators';
import { captureDialog } from '../utils/dialogs';
import { resolve } from '../utils/locators';
import type { TestUser } from '../utils/types';

const L = LOCATORS.signUpModal;

/**
 * The "Sign up" modal. Same broken label association as the login modal, so the
 * fields are addressed by their author-written ids — see
 * locators/component.locators.ts.
 */
export class SignUpModal {
  readonly root: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.root = resolve(page, L.root);
    this.usernameInput = resolve(this.root, L.usernameInput);
    this.passwordInput = resolve(this.root, L.passwordInput);
    this.submitButton = resolve(this.root, L.submitButton);
  }

  async waitUntilOpen(): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible' });
  }

  async submit(user: TestUser): Promise<string> {
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);

    return captureDialog(this.page, async () => {
      await this.submitButton.click();
    });
  }
}
