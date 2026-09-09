import type { Page } from '@playwright/test';

/**
 * Run an action that triggers a native browser dialog and return its message.
 *
 * DemoBlaze reports almost everything through window.alert() — "Product added.",
 * "Wrong password.", "Please fill out Name and Creditcard." — so this is the
 * suite's main assertion channel.
 *
 * Two details make this reliable:
 *
 * 1. The listener is registered BEFORE the action. Playwright auto-dismisses
 *    dialogs only while no listener exists; once one is attached the dialog must
 *    be handled or the triggering action hangs.
 * 2. The handler accepts immediately rather than the action awaiting the dialog
 *    first. An alert() raised synchronously inside a click handler blocks the
 *    page, so `await click()` can only settle once the dialog is gone.
 */
export async function captureDialog(
  page: Page,
  action: () => Promise<void>,
): Promise<string> {
  let message = '';

  const handled = new Promise<void>((resolve) => {
    page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.accept();
      resolve();
    });
  });

  await action();
  await handled;

  return message;
}
