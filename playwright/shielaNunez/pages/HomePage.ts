import {Page, Locator, expect} from '@playwright/test';

export class HomePage {

    private readonly page: Page;

    constructor(page: Page){
        this.page = page;
    }

    async openHomePage(){
        await this.page.goto('/');
    }
    async chooseCategory(category: string){
        await this.page.getByRole('link', { name: category}).click();
    }

    async chooseProduct(product: string){
        await this.page.getByRole('link',{ name: product}).click();
    }
}