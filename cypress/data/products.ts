import { Product } from '../types/Product'

export const products: Record<string,Product> = {
    nexus6: {
        name: 'Nexus 6', 
        category: 'Phones', 
        price: '650 USD'
    },
    macbookAir: {
        name: 'MacBook air', 
        category: 'Laptops', 
        price: '700 USD'
    },
    asusFullHD: {
        name: 'ASUS Full HD', 
        category: 'Monitors', 
        price: '230 USD'
    }
}