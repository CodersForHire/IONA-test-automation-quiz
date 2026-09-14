import { Dialog, Page } from '@playwright/test';

export async function handleDialog(
    page: Page,
    action: () => Promise<void>
): Promise<string | undefined> {
    return new Promise(async (resolve, reject) => {
        let dialogHandled = false;
        const dialogHandler = async (dialog: Dialog) => {
            dialogHandled = true;
            const message = dialog.message();
            await dialog.accept();
            resolve(message);
        };

        page.once('dialog', dialogHandler);

        try {
            await action();
            if (!dialogHandled) {
                page.removeListener('dialog', dialogHandler);
                resolve(undefined);
            }
        } catch (error) {
            page.removeListener('dialog', dialogHandler);
            reject(error);
        }
    });
}