import type { Locator, Page } from '@playwright/test';

import { NavBar } from '../components/navbar.component';
import { LOCATORS } from '../locators';
import { captureDialog } from '../utils/dialogs';
import { resolve } from '../utils/locators';

const L = LOCATORS.productPage;

/**
 * A single product at /prod.html?idp_=<id>.
 *
 * Selectors live in locators/<env>/pages/product.locators.ts.
 */
export class ProductPage {
  readonly nav: NavBar;
  readonly title: Locator;
  readonly price: Locator;
  readonly addToCartButton: Locator;

  constructor(private readonly page: Page) {
    this.nav = new NavBar(page);
    this.title = resolve(page, L.title);
    this.price = resolve(page, L.price);
    this.addToCartButton = resolve(page, L.addToCartButton);
  }

  async waitUntilLoaded(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  async priceValue(): Promise<number> {
    const text = await this.price.innerText();
    return Number(text.replace(/[^0-9.]/g, ''));
  }

  async addToCart(): Promise<string> {
    return captureDialog(this.page, async () => {
      await this.addToCartButton.click();
    });
  }
}
