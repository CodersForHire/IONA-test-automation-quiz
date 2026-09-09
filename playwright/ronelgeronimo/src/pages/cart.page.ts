import { expect, test, type Locator, type Page } from '@playwright/test';

import { NavBar } from '../components/navbar.component';
import { OrderModal } from '../components/order.modal';
import { LOCATORS } from '../locators';
import { resolve } from '../utils/locators';
import type { AddedProduct, CartContents, CatalogueProduct } from '../utils/types';
import { HomePage } from './home.page';

const L = LOCATORS.cartPage;

/**
 * The shopping cart at /cart.html.
 *
 * Selectors live in locators/<env>/pages/cart.locators.ts.
 */
export class CartPage {
  readonly nav: NavBar;
  readonly table: Locator;
  readonly productRows: Locator;
  readonly total: Locator;
  readonly placeOrderButton: Locator;

  constructor(private readonly page: Page) {
    this.nav = new NavBar(page);
    this.table = resolve(page, L.table);
    this.productRows = resolve(this.table, L.productRows);
    this.total = resolve(page, L.total);
    this.placeOrderButton = resolve(page, L.placeOrderButton);
  }

  async open(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  async addProducts(items: readonly CatalogueProduct[]): Promise<AddedProduct[]> {
    const homePage = new HomePage(this.page);
    const added: AddedProduct[] = [];

    for (const item of items) {
      const entry = await test.step(
        `Add "${item.product}" (${item.category}) to the cart`,
        async () => {
          await test.step('Open the catalogue', async () => {
            await homePage.open();
          });

          await test.step(`Filter the catalogue by "${item.category}"`, async () => {
            await homePage.selectCategory(item.category);
          });

          const productPage = await test.step(
            `Open the product "${item.product}"`,
            async () => homePage.openProduct(item.product),
          );

          const price = await test.step('Read the price on the product page', async () =>
            productPage.priceValue());

          const alert = await test.step('Click Add to cart', async () =>
            productPage.addToCart());

          return { ...item, price, alert };
        },
      );

      added.push(entry);
    }

    return added;
  }

  rowFor(productTitle: string): Locator {
    return resolve(this.table, L.productRow, { title: productTitle });
  }

  async rowTitles(): Promise<string[]> {
    const rows = await this.productRows.all();
    const titles = await Promise.all(
      rows.map(async (row) => (await resolve(row, L.rowTitleCell).innerText()).trim()),
    );

    return titles.sort();
  }

  private deleteLinkIn(row: Locator): Locator {
    return resolve(row, L.deleteLink);
  }

  async removeProduct(productTitle: string): Promise<void> {
    const before = await this.productRows.count();
    await this.deleteLinkIn(this.rowFor(productTitle)).click();
    await expect(this.productRows).toHaveCount(before - 1);
  }

  async removeLastProduct(): Promise<void> {
    const before = await this.productRows.count();
    await this.deleteLinkIn(this.productRows.last()).click();
    await expect(this.productRows).toHaveCount(before - 1);
  }

  async removeProducts(titles: readonly string[]): Promise<void> {
    for (const title of titles) {
      await test.step(`Remove "${title}" from the cart`, async () => {
        await this.removeProduct(title);
      });
    }
  }

  async emptyCart(): Promise<void> {
    const total = await this.productRows.count();

    for (let remaining = total; remaining > 0; remaining -= 1) {
      const left = remaining - 1;

      await test.step(`Remove the last item, leaving ${left} of ${total}`, async () => {
        await this.removeLastProduct();
      });
    }
  }

  async placeOrder(): Promise<OrderModal> {
    await this.placeOrderButton.click();
    const modal = new OrderModal(this.page);
    await modal.waitUntilOpen();
    return modal;
  }

  async placeOrderFor(expectedTotal: number): Promise<OrderModal> {
    return test.step('Place the order', async () => {
      const modal = await this.placeOrder();
      await expect(modal.totalLabel).toContainText(String(expectedTotal));
      return modal;
    });
  }

  alertsOf(added: readonly AddedProduct[]): string[] {
    return added.map((item) => `${item.product} -> ${item.alert}`);
  }

  expectedAlerts(basket: readonly CatalogueProduct[], alert: string): string[] {
    return basket.map((item) => `${item.product} -> ${alert}`);
  }

  titlesOf(items: readonly CatalogueProduct[]): string[] {
    return items.map((item) => item.product).sort();
  }

  survivorsOf(
    items: readonly CatalogueProduct[],
    removed: readonly string[],
  ): CatalogueProduct[] {
    return items.filter((item) => !removed.includes(item.product));
  }

  totalOf(added: readonly AddedProduct[]): number {
    return added.reduce((sum, item) => sum + item.price, 0);
  }

  totalExcluding(added: readonly AddedProduct[], removed: readonly string[]): number {
    for (const title of removed) {
      if (!added.some((item) => item.product === title)) {
        throw new Error(
          `Cannot exclude "${title}": it was never added. Added: ${added
            .map((item) => item.product)
            .join(', ')}`,
        );
      }
    }

    return this.totalOf(added.filter((item) => !removed.includes(item.product)));
  }

  async contents(expectedRows: number): Promise<CartContents> {
    await expect(this.productRows).toHaveCount(expectedRows);

    return {
      titles: await this.rowTitles(),
      total: Number((await this.total.innerText()).trim()),
    };
  }

  contentsOf(added: readonly AddedProduct[]): CartContents {
    return { titles: this.titlesOf(added), total: this.totalOf(added) };
  }

  contentsExcluding(
    added: readonly AddedProduct[],
    removed: readonly string[],
  ): CartContents {
    return {
      titles: this.titlesOf(this.survivorsOf(added, removed)),
      total: this.totalExcluding(added, removed),
    };
  }
}
