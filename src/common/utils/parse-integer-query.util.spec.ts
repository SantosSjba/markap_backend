import { parseIntegerQuery } from './parse-integer-query.util';

describe('parseIntegerQuery', () => {
  it.each([
    undefined,
    '',
    'abc',
    'Infinity',
    '999999999999999999999999999999999',
  ])('usa un valor válido cuando recibe %s', (value) => {
    expect(parseIntegerQuery(value, 20, 1, 100)).toBe(20);
  });
  it('acota cantidades y admite desplazamiento cero', () => {
    expect(parseIntegerQuery('-5', 20, 1, 100)).toBe(1);
    expect(parseIntegerQuery('500', 20, 1, 100)).toBe(100);
    expect(parseIntegerQuery('0', 0, 0)).toBe(0);
  });
});
