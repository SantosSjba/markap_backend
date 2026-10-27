import { buildSaleProcessCode } from './sale-process-code.util';

describe('buildSaleProcessCode', () => {
  it('arma VENTA-<año>-<código del inmueble> en mayúsculas', () => {
    expect(buildSaleProcessCode('casa-cayma-torres', 2026, [])).toBe(
      'VENTA-2026-CASA-CAYMA-TORRES',
    );
  });

  it('agrega sufijo si el inmueble ya tuvo un proceso ese año', () => {
    expect(
      buildSaleProcessCode('CASA-CAYMA-TORRES', 2026, [
        'VENTA-2026-CASA-CAYMA-TORRES',
        'VENTA-2026-CASA-CAYMA-TORRES-2',
      ]),
    ).toBe('VENTA-2026-CASA-CAYMA-TORRES-3');
  });
});
