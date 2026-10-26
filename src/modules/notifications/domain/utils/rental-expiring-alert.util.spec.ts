import {
  rentalExpiringAlertType,
  rentalExpiringAlertWindowStart,
} from './rental-expiring-alert.util';

describe('rentalExpiringAlertType', () => {
  it.each([
    [91, null],
    [90, 'RENTAL_EXPIRING_90'],
    [61, 'RENTAL_EXPIRING_90'],
    [60, 'RENTAL_EXPIRING_60'],
    [31, 'RENTAL_EXPIRING_60'],
    [30, 'RENTAL_EXPIRING_30'],
    [1, 'RENTAL_EXPIRING_30'],
    [0, null],
    [-5, null],
  ])('con %i días restantes avisa %s', (daysLeft, expected) => {
    expect(rentalExpiringAlertType(daysLeft)).toBe(expected);
  });
});

describe('rentalExpiringAlertWindowStart', () => {
  it('cubre los 3 meses previos al vencimiento', () => {
    expect(
      rentalExpiringAlertWindowStart(new Date('2026-12-31T12:00:00.000Z')),
    ).toEqual(new Date('2026-09-27T12:00:00.000Z'));
  });
});
