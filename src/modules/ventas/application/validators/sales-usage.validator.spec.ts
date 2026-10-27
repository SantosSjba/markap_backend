import type { VentasSalesUsage } from '../../domain/repositories/ventas-sales.repository';
import {
  assertAgentDeletableForVentas,
  assertClientDeletableForVentas,
  assertPropertyCurrencyChangeAllowed,
  assertPropertyDeletableForVentas,
  assertVentasListingChangeAllowed,
} from './sales-usage.validator';

const usage = (patch: Partial<VentasSalesUsage> = {}): VentasSalesUsage => ({
  activeProcesses: 0,
  activeSeparations: 0,
  closings: 0,
  openCommissions: 0,
  paidCommissionPartsOnActive: 0,
  ...patch,
});

describe('reglas de consistencia de Ventas', () => {
  it('no libera a mano un inmueble con separación activa', () => {
    expect(() =>
      assertVentasListingChangeAllowed(
        usage({ activeSeparations: 1 }),
        'RESERVED',
        'AVAILABLE',
      ),
    ).toThrow('separación activa');
  });

  it('no marca vendido a mano con procesos en curso ni cambia un vendido con cierre', () => {
    expect(() =>
      assertVentasListingChangeAllowed(
        usage({ activeProcesses: 1 }),
        'AVAILABLE',
        'SOLD',
      ),
    ).toThrow('procesos de venta en curso');
    expect(() =>
      assertVentasListingChangeAllowed(
        usage({ closings: 1 }),
        'SOLD',
        'AVAILABLE',
      ),
    ).toThrow('cierre de venta');
  });

  it('permite guardar el mismo estado y cambios sin operaciones', () => {
    expect(() =>
      assertVentasListingChangeAllowed(
        usage({ activeSeparations: 1 }),
        'RESERVED',
        'RESERVED',
      ),
    ).not.toThrow();
    expect(() =>
      assertVentasListingChangeAllowed(usage(), 'AVAILABLE', 'SOLD'),
    ).not.toThrow();
  });

  it('protege inmuebles, clientes y asesores con operaciones vigentes', () => {
    expect(() =>
      assertPropertyDeletableForVentas(usage({ activeProcesses: 1 })),
    ).toThrow();
    expect(() =>
      assertPropertyDeletableForVentas(usage({ closings: 1 })),
    ).toThrow();
    expect(() =>
      assertClientDeletableForVentas(usage({ activeSeparations: 1 })),
    ).toThrow();
    expect(() =>
      assertClientDeletableForVentas(usage({ closings: 2 })),
    ).not.toThrow();
    expect(() =>
      assertAgentDeletableForVentas(usage({ openCommissions: 1 })),
    ).toThrow('comisiones pendientes');
  });

  it('no cambia la moneda de un inmueble vendido o con comisiones pagadas', () => {
    expect(() =>
      assertPropertyCurrencyChangeAllowed(usage({ closings: 1 })),
    ).toThrow();
    expect(() =>
      assertPropertyCurrencyChangeAllowed(
        usage({ paidCommissionPartsOnActive: 1 }),
      ),
    ).toThrow();
    expect(() =>
      assertPropertyCurrencyChangeAllowed(usage({ activeProcesses: 3 })),
    ).not.toThrow();
  });
});
