import { CheckoutFormData } from '../pages/CheckoutModal';

export const validGuestCheckout: CheckoutFormData = {
  name: 'Resevelle Betonio',
  country: 'Philippines',
  city: 'Manila',
  card: '4111111111111111',
  month: '12',
  year: '2027',
};

export const validAuthenticatedCheckout: CheckoutFormData = {
  ...validGuestCheckout,
  name: 'Resevelle Betonio (Authenticated)',
};

export const invalidFormatCard = 'ABCD-not-a-card!!';
