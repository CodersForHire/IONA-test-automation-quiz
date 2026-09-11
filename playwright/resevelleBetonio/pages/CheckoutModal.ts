import { Page, Locator, expect } from '@playwright/test';

export interface CheckoutFormData {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

/** "Place order" modal (#orderModal) and its SweetAlert order confirmation. */
export class CheckoutModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly countryInput: Locator;
  readonly cityInput: Locator;
  readonly cardInput: Locator;
  readonly monthInput: Locator;
  readonly yearInput: Locator;
  readonly purchaseButton: Locator;
  readonly confirmation: Locator;
  readonly confirmationHeading: Locator;
  readonly confirmationDetails: Locator;
  readonly confirmationOkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('#orderModal');
    this.nameInput = page.locator('#name');
    this.countryInput = page.locator('#country');
    this.cityInput = page.locator('#city');
    this.cardInput = page.locator('#card');
    this.monthInput = page.locator('#month');
    this.yearInput = page.locator('#year');
    this.purchaseButton = this.modal.getByRole('button', { name: 'Purchase' });
    this.confirmation = page.locator('.sweet-alert');
    this.confirmationHeading = this.confirmation.locator('h2');
    this.confirmationDetails = this.confirmation.locator('p');
    this.confirmationOkButton = this.confirmation.locator('.confirm');
  }

  async fill(data: Partial<CheckoutFormData>): Promise<void> {
    if (data.name !== undefined) await this.nameInput.fill(data.name);
    if (data.country !== undefined) await this.countryInput.fill(data.country);
    if (data.city !== undefined) await this.cityInput.fill(data.city);
    if (data.card !== undefined) await this.cardInput.fill(data.card);
    if (data.month !== undefined) await this.monthInput.fill(data.month);
    if (data.year !== undefined) await this.yearInput.fill(data.year);
  }

  async purchase(): Promise<void> {
    await this.purchaseButton.click();
  }

  async dismissConfirmation(): Promise<void> {
    // SweetAlert adds `visible` after its open animation; clicking OK
    // earlier hits the overlay and dismisses without confirming.
    await expect(this.confirmation).toHaveClass(/\bvisible\b/);
    await this.confirmationOkButton.click();
  }
}
