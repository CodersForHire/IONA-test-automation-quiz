import { Page, Dialog } from '@playwright/test';

/**
 * Registers a one-shot listener for the next native `window.alert(...)`
 * dialog, accepts it, and resolves with its message - but only *after*
 * `dialog.accept()` has actually completed.
 *
 * Why this matters: a native alert blocks the page's own JS (and silently
 * swallows further input) until it is truly dismissed. Resolving the
 * promise *before* awaiting `accept()` lets a caller's next action (e.g.
 * clicking a nav link again) race against - and lose to - a dialog that is
 * technically still open in the browser, which drops that click entirely.
 * Every dialog helper below resolves strictly after accept() to avoid that.
 */
export function captureNextDialog(page: Page): Promise<string> {
  return new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      const message = dialog.message();
      await dialog.accept();
      resolve(message);
    });
  });
}

/**
 * Races "a dialog appears" against some other condition that signals
 * success *without* a dialog (a modal closing, a confirmation banner
 * appearing, etc). Returns the dialog's message if one fired, or `null`
 * if the other condition won first.
 *
 * This also fixes a real bug: a plain `page.once('dialog', ...)` that
 * never fires (because the other condition won) never auto-unregisters,
 * so it stays attached and can steal + accept a *later, unrelated* dialog
 * before that dialog's own listener gets a chance to - which then throws
 * "Cannot accept dialog which is already handled!" on the second listener.
 * The losing dialog listener is explicitly removed here so that can't
 * happen. `otherCondition` is expected to already resolve safely (e.g. via
 * `.catch(() => undefined)`) rather than reject, so the race always settles.
 */
export async function raceDialogOrCondition(
  page: Page,
  otherCondition: Promise<unknown>
): Promise<string | null> {
  let dialogHandler: ((dialog: Dialog) => Promise<void>) | undefined;

  const dialogMessage = new Promise<string>((resolve) => {
    dialogHandler = async (dialog) => {
      const message = dialog.message();
      await dialog.accept();
      resolve(message);
    };
    page.once('dialog', dialogHandler);
  });

  const conditionMet = otherCondition.then(() => null as null);

  const result = await Promise.race([dialogMessage, conditionMet]);

  if (dialogHandler) {
    page.off('dialog', dialogHandler);
  }

  return result;
}
