import type { Locator, Page } from '@playwright/test';

import { LOCATORS } from '../locators';
import { envConfig } from '../utils/env';
import { resolve } from '../utils/locators';
import { LoginModal } from './login.modal';
import { SignUpModal } from './signup.modal';

const L = LOCATORS.navBar;

/**
 * The navigation bar, present on every DemoBlaze page.
 *
 * Selectors live in locators/component.locators.ts — see that file for why
 * each one is addressed the way it is.
 */
export class NavBar {
  readonly loginLink: Locator;
  readonly signUpLink: Locator;
  readonly logOutLink: Locator;
  readonly welcomeLabel: Locator;

  constructor(private readonly page: Page) {
    this.loginLink = resolve(page, L.loginLink);
    this.signUpLink = resolve(page, L.signUpLink);
    this.logOutLink = resolve(page, L.logOutLink);
    this.welcomeLabel = resolve(page, L.welcomeLabel);
  }

  welcomeFor(username: string): Locator {
    return resolve(this.page, L.welcomeLink, { username });
  }

  async openLogin(): Promise<LoginModal> {
    await this.loginLink.click();
    const modal = new LoginModal(this.page);
    await modal.waitUntilOpen();
    return modal;
  }

  async openSignUp(): Promise<SignUpModal> {
    await this.signUpLink.click();
    const modal = new SignUpModal(this.page);
    await modal.waitUntilOpen();
    return modal;
  }

  async logOut(): Promise<void> {
    await this.logOutLink.click();
    await this.loginLink.waitFor({
      state: 'visible',
      timeout: envConfig.navigationTimeout,
    });
  }
}
