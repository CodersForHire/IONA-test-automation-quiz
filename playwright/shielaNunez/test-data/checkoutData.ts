export type CheckoutCustomer = {
    name: string;
    country: string;
    city: string;
    card: string;
    month: string;
    year: string;
};

export const checkoutCustomer: CheckoutCustomer = {
    name: 'John Doe',
    country: 'Philippines',
    city: 'Manila',
    card: '1234567890123456',
    month: '12',
    year: '2026'
};

export const checkoutDataScenarios = [
    {
        category: 'Phones',
        product: 'Samsung galaxy s6'
    },
    {
        category: 'Laptops',
        product: 'Sony vaio i5'
    },
    {
        category: 'Monitors',
        product: 'Apple monitor 24'
    }
];