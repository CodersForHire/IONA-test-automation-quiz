import { Page, Locator } from '@playwright/test';
import { CheckoutDetails, MESSAGES } from '../data/testData';
import { raceDialogOrCondition } from '../support/dialogHelpers';

/**
 * Page Object for the "Place order" modal (#orderModal) and the SweetAlert
 * success dialog it triggers on a valid purchase.
 */
export class CheckoutModalComponent {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly countryInput: Locator;
  readonly cityInput: Locator;
  readonly cardInput: Locator;
  readonly monthInput: Locator;
  readonly yearInput: Locator;
  readonly purchaseButton: Locator;

  readonly successHeading: Locator;
  readonly successDetails: Locator;
  readonly successOkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const modal = page.locator('#orderModal');
    // Every field's <label for="..."> correctly matches its input id here
    // - verified live against the deployed markup - so getByLabel() works
    // cleanly for all six, scoped to `modal` as good practice even though
    // these labels/ids are unique to this modal. (One quirk worth noting:
    // DemoBlaze's markup also has a second, unrelated "Total:" label that
    // mistakenly reuses `for="name"` - a copy-paste bug in their own
    // markup. Browsers concatenate both labels into the field's computed
    // accessible name, but getByLabel()'s default substring matching still
    // resolves 'Name:' correctly, and no other field's label text collides.)
    this.nameInput = modal.getByLabel('Name:');
    this.countryInput = modal.getByLabel('Country:');
    this.cityInput = modal.getByLabel('City:');
    this.cardInput = modal.getByLabel('Credit card:');
    this.monthInput = modal.getByLabel('Month:');
    this.yearInput = modal.getByLabel('Year:');
    this.purchaseButton = modal.getByRole('button', { name: 'Purchase' });

    // SweetAlert renders outside #orderModal, as a sibling in <body>.
    this.successHeading = page.getByRole('heading', { name: MESSAGES.purchaseSuccessHeading });
    // Last resort (CSS class): third-party SweetAlert 1.x markup with no
    // distinguishing accessible role/label of its own beyond generic text.
    this.successDetails = page.locator('.sweet-alert .lead');
    this.successOkButton = page.locator('.sweet-alert .confirm');
  }

  async fill(details: Partial<CheckoutDetails>) {
    if (details.name !== undefined) await this.nameInput.fill(details.name);
    if (details.country !== undefined) await this.countryInput.fill(details.country);
    if (details.city !== undefined) await this.cityInput.fill(details.city);
    if (details.card !== undefined) await this.cardInput.fill(details.card);
    if (details.month !== undefined) await this.monthInput.fill(details.month);
    if (details.year !== undefined) await this.yearInput.fill(details.year);
  }

  /**
   * Clicks Purchase. DemoBlaze's only client-side validation is on Name +
   * Credit card: if either is blank it shows a native alert and keeps the
   * modal open; otherwise it shows the SweetAlert success dialog (even if
   * country/city/month/year are blank - the site does not validate them).
   * We race both outcomes rather than assuming which one fires (see
   * raceDialogOrCondition, which also cleans up a dialog listener that
   * never fired so it can't collide with a later, unrelated alert).
   */
  async submit(): Promise<string | null> {
    const successShown = this.successHeading
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => undefined);

    const resultPromise = raceDialogOrCondition(this.page, successShown);
    await this.purchaseButton.click();
    return resultPromise;
  }

  async confirmSuccess() {
    await this.successOkButton.click();
  }
}
