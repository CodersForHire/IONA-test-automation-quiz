import { faker } from '@faker-js/faker';
import { expect, Page } from '@playwright/test';

import type { CatalogCategory } from '../data/testData';

export type CatalogProductSelection = {
  category: CatalogCategory;
  productName: string;
  productId: number;
  price: string;
};

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const entriesResponse = this.page
        .waitForResponse(
          (response) => response.url().endsWith('/entries') && response.request().method() === 'GET',
          { timeout: 15000 },
        )
        .catch(() => null);

      if (attempt === 1) {
        await this.page.goto('/');
      } else {
        await this.page.reload();
      }

      await expect(this.page).toHaveTitle(/STORE/);
      await expect(this.page.locator('.list-group')).toContainText('Phones');
      await entriesResponse;

      if ((await this.page.locator('.card-title a').count()) > 0) {
        return;
      }
    }
  }

  async openCategory(categoryName: CatalogCategory): Promise<void> {
    const byCategoryResponse = this.page
      .waitForResponse(
        (response) => response.url().endsWith('/bycat') && response.request().method() === 'POST',
        { timeout: 15000 },
      )
      .catch(() => null);

    await this.page.locator('.list-group a', { hasText: categoryName }).click();
    await byCategoryResponse;
  }

  async openRandomProductFromCategory(categoryName: CatalogCategory): Promise<CatalogProductSelection> {
    const byCategoryResponse = this.page
      .waitForResponse(
        (response) => response.url().endsWith('/bycat') && response.request().method() === 'POST',
        { timeout: 15000 },
      )
      .catch(() => null);

    await this.openCategory(categoryName);
    const response = await byCategoryResponse;

    const apiProducts = response ? await this.extractProductsFromApiResponse(response, categoryName) : [];
    const uiProducts = await this.extractProductsFromUi(categoryName);
    const availableProducts = this.mergeProducts(apiProducts, uiProducts);

    if (availableProducts.length === 0) {
      throw new Error(`No products were available under category: ${categoryName}`);
    }

    const selectedProduct = faker.helpers.arrayElement(availableProducts);
    const productLink = this.page.getByRole('link', { name: selectedProduct.productName, exact: true });

    try {
      await expect(productLink).toBeVisible({ timeout: 8000 });
      await productLink.click();
    } catch {
      // Observation: DemoBlaze intermittently leaves the catalog empty after navigation.
      await this.page.goto(`/prod.html?idp_=${selectedProduct.productId}`);
    }

    return selectedProduct;
  }

  async openCart(): Promise<void> {
    await this.page.locator('#cartur').click({ force: true });
    await expect(this.page).toHaveURL(/cart.html/);
  }

  async openLogin(): Promise<void> {
    await this.page.locator('#login2').click({ force: true });
    await expect(this.page.locator('#logInModal')).toBeVisible();
  }

  async openSignUp(): Promise<void> {
    await this.page.locator('#signin2').click({ force: true });
    await expect(this.page.locator('#signInModal')).toBeVisible();
  }

  async expectSignedInUser(username: string): Promise<void> {
    await expect(this.page.locator('#nameofuser')).toHaveText(`Welcome ${username}`);
  }

  private async extractProductsFromApiResponse(
    response: Awaited<ReturnType<Page['waitForResponse']>>,
    category: CatalogCategory,
  ): Promise<CatalogProductSelection[]> {
    const payload = (await response.json().catch(() => null)) as
      | { Items?: Array<{ id?: number | string; title?: string; price?: number | string }> }
      | null;

    if (!payload?.Items) {
      return [];
    }

    return payload.Items.map((item) => {
      const productId = Number(item.id);
      const productName = String(item.title ?? '').trim();
      const priceValue = String(item.price ?? '').trim();

      return {
        category,
        productName,
        productId,
        price: `$${priceValue}`,
      };
    }).filter((item) => item.productName !== '' && Number.isFinite(item.productId));
  }

  private async extractProductsFromUi(category: CatalogCategory): Promise<CatalogProductSelection[]> {
    const cards = this.page.locator('#tbodyid .card');
    const count = await cards.count();
    const products: CatalogProductSelection[] = [];

    for (let index = 0; index < count; index += 1) {
      const card = cards.nth(index);
      const name = (await card.locator('.card-title a').textContent())?.trim() ?? '';
      const href = await card.locator('.card-title a').getAttribute('href');
      const priceText = (await card.locator('h5').textContent())?.trim() ?? '';

      const productId = Number(href?.match(/idp_=(\d+)/)?.[1]);

      if (!name || !Number.isFinite(productId)) {
        continue;
      }

      products.push({
        category,
        productName: name,
        productId,
        price: priceText.startsWith('$') ? priceText : `$${priceText}`,
      });
    }

    return products;
  }

  private mergeProducts(
    apiProducts: CatalogProductSelection[],
    uiProducts: CatalogProductSelection[],
  ): CatalogProductSelection[] {
    const byId = new Map<number, CatalogProductSelection>();

    for (const product of [...apiProducts, ...uiProducts]) {
      byId.set(product.productId, product);
    }

    return [...byId.values()];
  }
}