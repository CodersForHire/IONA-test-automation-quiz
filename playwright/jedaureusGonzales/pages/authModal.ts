import { expect, Page } from '@playwright/test';

import type { Credentials } from '../data/testData';

export class AuthModal {
  constructor(private readonly page: Page) {}

  async login(credentials: Credentials): Promise<void> {
    await this.page.locator('#loginusername').fill(credentials.username);
    await this.page.locator('#loginpassword').fill(credentials.password);
    await this.page.locator('#logInModal button', { hasText: 'Log in' }).click({ force: true });
  }

  async signUpExpectAlert(credentials: Credentials, expectedMessage: string): Promise<void> {
    const dialogMessage = await this.captureDialog(async () => {
      await this.page.locator('#sign-username').fill(credentials.username);
      await this.page.locator('#sign-password').fill(credentials.password);
      await this.page.locator('#signInModal button', { hasText: 'Sign up' }).click({ force: true });
    }, this.waitForApiResponse('/signup', credentials.username === '' || credentials.password === ''));

    expect(dialogMessage).toBe(expectedMessage);
    await this.closeSignUpIfVisible();
  }

  async loginExpectAlert(credentials: Credentials, expectedMessage: string): Promise<void> {
    const dialogMessage = await this.captureDialog(async () => {
      await this.login(credentials);
    }, this.waitForApiResponse('/login', credentials.username === '' || credentials.password === ''));

    expect(dialogMessage).toBe(expectedMessage);
    await this.closeLoginIfVisible();
  }

  private async captureDialog(action: () => Promise<void>, networkWait?: Promise<unknown>): Promise<string> {
    let dialogMessage = '';
    const dialogPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Dialog did not appear within 20 seconds.'));
      }, 20000);

      this.page.once('dialog', async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.accept();
        clearTimeout(timeout);
        resolve();
      });
    });

    await action();

    if (networkWait) {
      await networkWait;
    }

    await dialogPromise;

    return dialogMessage;
  }

  private async waitForApiResponse(endpoint: '/login' | '/signup', skipWait: boolean): Promise<void> {
    if (skipWait) {
      return;
    }

    await this.page.waitForResponse(
      (response) => response.url().endsWith(endpoint) && response.request().method() === 'POST',
      { timeout: 20000 },
    );
  }

  private async closeLoginIfVisible(): Promise<void> {
    const closeButton = this.page.locator('#logInModal .btn-secondary');

    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(this.page.locator('#logInModal')).not.toBeVisible();
    }
  }

  private async closeSignUpIfVisible(): Promise<void> {
    const closeButton = this.page.locator('#signInModal .btn-secondary');

    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(this.page.locator('#signInModal')).not.toBeVisible();
    }
  }
}