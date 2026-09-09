import type { Locator, Page } from '@playwright/test';

import { NavBar } from '../components/navbar.component';
import { LOCATORS } from '../locators';
import { resolve } from '../utils/locators';
import type { Category } from '../utils/types';
import { ProductPage } from './product.page';

const L = LOCATORS.homePage;

/**
 * The product catalogue at /index.html.
 *
 * Selectors live in locators/<env>/pages/home.locators.ts.
 */
export class HomePage {
  readonly nav: NavBar;
  readonly categoriesHeading: Locator;
  /** The grid's product links, as a group. Used as the render gate below. */
  readonly productCards: Locator;

  constructor(private readonly page: Page) {
    this.nav = new NavBar(page);
    this.categoriesHeading = resolve(page, L.categoriesHeading);
    this.productCards = resolve(page, L.productCards);
  }

  /**
   * Open the catalogue and return once it has actually rendered.
   *
   * THE FIRST PRODUCT CARD IS THE RENDER GATE, and waiting for it is the point
   * of this method. CATEGORIES is part of the page SHELL and is there long
   * before the catalogue is: index.js fetches the products separately, so
   * returning on the heading alone hands back a page whose product request is
   * still in flight.
   *
   * That is not merely early, it is wrong. A selectCategory() that follows
   * clears #tbodyid and appends its own results, and then the late
   * full-catalogue response appends on top of them — so the grid ends up
   * holding a category's products AND the whole catalogue, and any product in
   * both appears twice. Every by-name locator is then ambiguous and fails as a
   * strict mode violation, intermittently and only under load. Observed on
   * "Sony vaio i5" in the six-item journey.
   *
   * One card is enough of a gate: the products arrive in a single response and
   * are appended in one callback, so the first card existing means that whole
   * batch has landed. Waiting for a COUNT would tie this to how many products
   * the catalogue happens to hold.
   */
  async open(): Promise<void> {
    await this.page.goto('/index.html');
    await this.categoriesHeading.waitFor({ state: 'visible' });
    await this.productCards.first().waitFor({ state: 'visible' });
  }

  async selectCategory(category: Category): Promise<void> {
    await resolve(this.page, L.categoryLink, { category }).click();
  }

  productLink(title: string): Locator {
    return resolve(this.page, L.productLink, { title });
  }

  async openProduct(title: string): Promise<ProductPage> {
    await this.productLink(title).click();
    const product = new ProductPage(this.page);
    await product.waitUntilLoaded();
    return product;
  }
}
