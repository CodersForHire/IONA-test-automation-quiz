import { faker } from '@faker-js/faker';

export type PurchaseDetails = {
  name: string;
  country: string;
  city: string;
  creditCard: string;
  month: string;
  year: string;
};

export type Credentials = {
  username: string;
  password: string;
};

export type CatalogCategory = 'Phones' | 'Laptops' | 'Monitors';

export const availableCategories: CatalogCategory[] = ['Phones', 'Laptops', 'Monitors'];

export function pickRandomCategory(): CatalogCategory {
  return faker.helpers.arrayElement(availableCategories);
}

function createPurchaseDetails(): PurchaseDetails {
  return {
    name: faker.person.fullName(),
    country: faker.location.country(),
    city: faker.location.city(),
    creditCard: faker.string.numeric(16),
    month: faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0'),
    year: faker.number.int({ min: 2026, max: 2032 }).toString(),
  };
}

export function createOrderData(): Record<'guest' | 'authenticated', PurchaseDetails> {
  return {
    guest: createPurchaseDetails(),
    authenticated: createPurchaseDetails(),
  };
}

export const alertMessages = {
  productAdded: /^Product added\.?$/,
  invalidUser: 'User does not exist.',
  emptyLogin: 'Please fill out Username and Password.',
  wrongPassword: 'Wrong password.',
  duplicateUser: 'This user already exist.',
  incompletePurchase: 'Please fill out Name and Creditcard.',
} as const;