import type { Locator, Page } from '@playwright/test';

import { LOCATORS } from '../locators';
import { captureDialog } from '../utils/dialogs';
import { resolve } from '../utils/locators';
import type { TestUser } from '../utils/types';

const L = LOCATORS.loginModal;

/**
 * The "Log in" modal.
 *
 * Selectors live in locators/component.locators.ts, including the note on why
 * these fields are addressed by id rather than by label (DEFECT DB-005).
 */
export class LoginModal {
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

  async submit(user: TestUser): Promise<void> {
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);
    await this.submitButton.click();
  }

  async submitExpectingAlert(user: TestUser): Promise<string> {
    await this.usernameInput.fill(user.username);
    await this.passwordInput.fill(user.password);

    return captureDialog(this.page, async () => {
      await this.submitButton.click();
    });
  }
}
