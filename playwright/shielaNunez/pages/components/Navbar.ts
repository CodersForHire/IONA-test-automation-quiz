import { Page, Locator, expect } from '@playwright/test'

export class NavBar {
    private readonly page: Page;
    private readonly cartLink: Locator;
    private readonly loginLink: Locator;
    private readonly nameOfUser: Locator;

    constructor(page: Page) {
        this.page = page;
        this.cartLink = this.page.getByRole('link', { name: 'Cart', exact: true });
        this.loginLink = this.page.getByRole('link', { name: 'Log in', exact: true });
        this.nameOfUser = this.page.locator('#nameofuser');
    }

    async navigateToCart() {
        await this.cartLink.click();
    }

    async openLoginModal(){
        await this.loginLink.click();
    }

    async verifyNameOfUser(username: string){
        await expect(this.nameOfUser).toContainText(`Welcome ${username}`);
    }
}