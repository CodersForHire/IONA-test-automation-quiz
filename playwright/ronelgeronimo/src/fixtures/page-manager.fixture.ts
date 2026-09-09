import { test as base, expect, type Page } from '@playwright/test';

import { OrderConfirmation } from '../components/confirmation.component';
import { LoginModal } from '../components/login.modal';
import { NavBar } from '../components/navbar.component';
import { OrderModal } from '../components/order.modal';
import { SignUpModal } from '../components/signup.modal';
import { CartPage } from '../pages/cart.page';
import { HomePage } from '../pages/home.page';
import { ProductPage } from '../pages/product.page';

/** Anything the manager can build: every page object takes the Page and nothing else. */
type PageObjectClass<T> = new (page: Page) => T;

export class PageManager {
  private readonly instances = new Map<PageObjectClass<unknown>, unknown>();

  constructor(readonly page: Page) {}

  private lazy<T>(Ctor: PageObjectClass<T>): T {
    let instance = this.instances.get(Ctor) as T | undefined;

    if (instance === undefined) {
      instance = new Ctor(this.page);
      this.instances.set(Ctor, instance);
    }

    return instance;
  }

  get homePage(): HomePage {
    return this.lazy(HomePage);
  }

  get productPage(): ProductPage {
    return this.lazy(ProductPage);
  }

  get cartPage(): CartPage {
    return this.lazy(CartPage);
  }

  get navBar(): NavBar {
    return this.lazy(NavBar);
  }

  get orderConfirmation(): OrderConfirmation {
    return this.lazy(OrderConfirmation);
  }

  get loginModal(): LoginModal {
    return this.lazy(LoginModal);
  }

  get signUpModal(): SignUpModal {
    return this.lazy(SignUpModal);
  }

  get orderModal(): OrderModal {
    return this.lazy(OrderModal);
  }
}

export interface PageManagerFixture {
  pm: PageManager;
}

export const test = base.extend<PageManagerFixture>({
  pm: async ({ page }, use) => {
    await use(new PageManager(page));
  },
});

export { expect };

export * from './spec-kit';
