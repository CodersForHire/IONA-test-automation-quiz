import { Category } from '../pages/HomePage';

export interface Product {
  name: string;
  category: Category;
  /** Listed price in USD. */
  price: number;
}

/** One product per category. */
export const products = {
  laptop: { name: 'Sony vaio i5', category: 'Laptops', price: 790 },
  phone: { name: 'Samsung galaxy s6', category: 'Phones', price: 360 },
  monitor: { name: 'Apple monitor 24', category: 'Monitors', price: 400 },
} satisfies Record<string, Product>;
