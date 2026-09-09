import type { Locator, Page } from '@playwright/test';

import { LOCATORS } from '../locators';
import { resolve } from '../utils/locators';
import type { ConfirmationField } from '../utils/types';

const L = LOCATORS.orderConfirmation;

/**
 * The order confirmation, rendered by SweetAlert after a successful purchase:
 *
 *   Thank you for your purchase!
 *   Id: 1234567
 *   Amount: 790 USD
 *   Card Number: ...
 *   Name: ...
 *   Date: ...
 *
 * Selectors live in locators/component.locators.ts.
 */
export class OrderConfirmation {
  readonly root: Locator;
  readonly title: Locator;
  readonly details: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.root = resolve(page, L.root);
    this.title = resolve(this.root, L.title);
    this.details = resolve(this.root, L.details);
    this.confirmButton = resolve(this.root, L.confirmButton);
  }

  async detailsText(): Promise<string> {
    return (await this.details.innerText()).trim();
  }

  async field(label: ConfirmationField): Promise<string | undefined> {
    const line = (await this.detailsText())
      .split('\n')
      .find((text) => text.trim().startsWith(`${label}:`));

    return line?.slice(line.indexOf(':') + 1).trim();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }
}
