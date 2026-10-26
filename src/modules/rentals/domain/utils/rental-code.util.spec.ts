import {
  buildRentalCode,
  legacyRentalCode,
  withUniqueSuffix,
} from './rental-code.util';

describe('rental-code.util', () => {
  it('antepone operación y año de inicio al código de la propiedad', () => {
    expect(buildRentalCode('CASA-EL BOSQUE-JIMÉNEZ', 2026)).toBe(
      'ALQUILER-2026-CASA-EL BOSQUE-JIMÉNEZ',
    );
  });

  it('normaliza códigos de propiedad antiguos', () => {
    expect(buildRentalCode(' prop-av. larco ', 2026)).toBe(
      'ALQUILER-2026-PROP-AV. LARCO',
    );
  });

  it('agrega sufijo numérico cuando el código ya existe', () => {
    const base = 'ALQUILER-2026-CASA-EL BOSQUE-JIMÉNEZ';
    expect(withUniqueSuffix(base, [])).toBe(base);
    expect(withUniqueSuffix(base, [base])).toBe(`${base}-2`);
    expect(withUniqueSuffix(base, [base, `${base}-2`])).toBe(`${base}-3`);
  });

  it('conserva el formato anterior para contratos sin código guardado', () => {
    expect(
      legacyRentalCode('0b1c2d3e-aaaa-bbbb-cccc-1234567890ab', '2025-03-01'),
    ).toBe('ALQ-2025-7890AB');
  });
});
