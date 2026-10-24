import { rentalPaymentState } from './rental-payment-state.util';

describe('Abonos de alquiler', () => {
  it('mantiene deuda parcial y acumula el abono final', () => {
    expect(rentalPaymentState(1000, 0, 200)).toEqual({
      paidAmount: 200,
      status: 'PARTIAL',
    });
    expect(rentalPaymentState(1000, 200, 800)).toEqual({
      paidAmount: 1000,
      status: 'PAID',
    });
  });
  it('calcula centavos sin errores de punto flotante', () => {
    expect(rentalPaymentState(0.3, 0.1, 0.2)).toEqual({
      paidAmount: 0.3,
      status: 'PAID',
    });
  });
  it.each([0, -1, NaN, Infinity, 1001])(
    'rechaza un abono inválido de %s',
    (received) => {
      expect(() => rentalPaymentState(1000, 0, received)).toThrow(RangeError);
    },
  );
});
