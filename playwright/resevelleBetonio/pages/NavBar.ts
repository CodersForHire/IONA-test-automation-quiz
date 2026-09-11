import { Page, Locator } from '@playwright/test';

/** Top navigation, present on every page. */
export class NavBar {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly cartLink: Locator;
  readonly loginLink: Locator;
  readonly logoutLink: Locator;
  /** "Welcome <username>", shown only while logged in. */
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.homeLink = page.locator('#nava');
    this.cartLink = page.locator('#cartur');
    this.loginLink = page.locator('#login2');
    this.logoutLink = page.locator('#logout2');
    this.welcomeMessage = page.locator('#nameofuser');
  }

  async openLoginModal(): Promise<void> {
    await this.loginLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }
}
