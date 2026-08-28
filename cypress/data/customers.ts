import { Customer } from '../types/Customer'

export const customers: Record<string, Customer> = {
    validCustomer: {
        name: 'Sheldon Cooper',
        country: 'Japan', 
        city: 'Tokyo', 
        card: '1111222233334444', 
        month: '08', 
        year: '2027'  
    },
    emptyCustomer:{
        name: '',
        country: '', 
        city: '', 
        card: '', 
        month: '', 
        year: ''  
    },
    missingNameAndCard:{
        name: '',
        country: 'Philippines', 
        city: 'Makati', 
        card: '', 
        month: '11', 
        year: '28'  
    }
};
