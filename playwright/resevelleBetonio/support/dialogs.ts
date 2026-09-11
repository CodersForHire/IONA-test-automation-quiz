import { Page } from '@playwright/test';

export interface DialogCapture {
  /** Every native dialog message seen so far, in order. */
  messages: string[];
}

/**
 * Accepts every native dialog and records its message. The site reports
 * many outcomes via alert(), and Playwright discards unhandled dialogs.
 */
export function captureDialogs(page: Page): DialogCapture {
  const capture: DialogCapture = { messages: [] };
  page.on('dialog', async (dialog) => {
    capture.messages.push(dialog.message());
    // The page may have navigated away before accept() lands; the message is already recorded.
    await dialog.accept().catch(() => undefined);
  });
  return capture;
}
