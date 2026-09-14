import { test as base } from '@playwright/test';

import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { ProductPage } from '../pages/ProductPage';
import { LoginModal } from '../pages/components/LoginModal';
import { NavBar } from '../pages/components/Navbar';

type Pages = {
    homePage: HomePage;
    cartPage: CartPage;
    productPage: ProductPage;
    loginModal: LoginModal;
    navBar: NavBar;
};

type PageFixtures = {
    pages: Pages;
};

export const test = base.extend<PageFixtures>({
    pages: async ({ page }, use) => {
        await use({
            homePage: new HomePage(page),
            cartPage: new CartPage(page),
            productPage: new ProductPage(page),
            loginModal: new LoginModal(page),
            navBar: new NavBar(page),
        });
    },
});

export { expect } from '@playwright/test';