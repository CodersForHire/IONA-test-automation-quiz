import type { Locator, Page } from '@playwright/test';

import { LOCATORS } from '../locators';
import { captureDialog } from '../utils/dialogs';
import { resolve } from '../utils/locators';
import type { CheckoutDetails } from '../utils/types';

const L = LOCATORS.orderModal;

/**
 * The "Place Order" modal: name, country, city, credit card, month, year.
 *
 * Selectors live in locators/component.locators.ts, including the note on why
 * `name` is addressed by id while the other five fields use their labels.
 */
export class OrderModal {
  readonly root: Locator;
  readonly totalLabel: Locator;
  readonly nameInput: Locator;
  readonly countryInput: Locator;
  readonly cityInput: Locator;
  readonly cardInput: Locator;
  readonly monthInput: Locator;
  readonly yearInput: Locator;
  readonly purchaseButton: Locator;
  readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    this.root = resolve(page, L.root);
    this.totalLabel = resolve(this.root, L.totalLabel);
    this.nameInput = resolve(this.root, L.nameInput);
    this.countryInput = resolve(this.root, L.countryInput);
    this.cityInput = resolve(this.root, L.cityInput);
    this.cardInput = resolve(this.root, L.cardInput);
    this.monthInput = resolve(this.root, L.monthInput);
    this.yearInput = resolve(this.root, L.yearInput);
    this.purchaseButton = resolve(this.root, L.purchaseButton);
    this.closeButton = resolve(this.root, L.closeButton);
  }

  async waitUntilOpen(): Promise<void> {
    await this.purchaseButton.waitFor({ state: 'visible' });
  }

  private fields(): Array<[keyof CheckoutDetails, Locator]> {
    return [
      ['name', this.nameInput],
      ['country', this.countryInput],
      ['city', this.cityInput],
      ['card', this.cardInput],
      ['month', this.monthInput],
      ['year', this.yearInput],
    ];
  }

  async fill(details: CheckoutDetails): Promise<void> {
    for (const [key, locator] of this.fields()) {
      const value = details[key];
      if (value === undefined) continue;
      await locator.fill(value);
    }
  }

  /**
   * What the form is holding, all six fields, as displayed.
   *
   * Returned as one object so a spec can assert the whole form in a single
   * comparison — which covers the fields it expects to be filled and the ones it
   * expects to be empty at the same time, and names the field that disagreed.
   * Checking a subset instead lets a form pass that is quietly carrying a value
   * nobody asked about, which is exactly what DB-007 is.
   *
   * Reads what is there and does not retry: the modal being open is the gate,
   * and waitUntilOpen() has already provided it.
   */
  async values(): Promise<Required<CheckoutDetails>> {
    const entries = await Promise.all(
      this.fields().map(async ([key, locator]) => [key, await locator.inputValue()] as const),
    );

    return Object.fromEntries(entries) as Required<CheckoutDetails>;
  }

  async purchase(): Promise<void> {
    await this.purchaseButton.click();
  }

  async purchaseExpectingAlert(): Promise<string> {
    return captureDialog(this.page, async () => {
      await this.purchaseButton.click();
    });
  }
}
