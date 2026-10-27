import { BadRequestException } from '@nestjs/common';
import type { VentasSalesUsage } from '../../domain/repositories/ventas-sales.repository';

/**
 * El estado comercial del inmueble lo mueven separaciones y cierres; a mano solo se
 * permite si no contradice lo registrado en Ventas.
 */
export function assertVentasListingChangeAllowed(
  usage: VentasSalesUsage,
  current: string,
  target: string,
): void {
  if (current === target) return;
  if (usage.closings > 0) {
    throw new BadRequestException(
      'El inmueble tiene un cierre de venta registrado; su estado debe seguir como Vendido.',
    );
  }
  if (target === 'AVAILABLE' && usage.activeSeparations > 0) {
    throw new BadRequestException(
      'El inmueble tiene una separación activa. Márquela como vencida desde el proceso para liberarlo.',
    );
  }
  if (
    target === 'SOLD' &&
    (usage.activeProcesses > 0 || usage.activeSeparations > 0)
  ) {
    throw new BadRequestException(
      'El inmueble tiene procesos de venta en curso. Registre el cierre desde el proceso o márquelos como venta caída.',
    );
  }
}

export function assertPropertyDeletableForVentas(
  usage: VentasSalesUsage,
): void {
  if (usage.activeProcesses > 0 || usage.activeSeparations > 0) {
    throw new BadRequestException(
      'No se puede eliminar el inmueble mientras tenga procesos de venta o separaciones activas.',
    );
  }
  if (usage.closings > 0) {
    throw new BadRequestException(
      'No se puede eliminar el inmueble porque tiene ventas cerradas registradas.',
    );
  }
}

export function assertPropertyCurrencyChangeAllowed(
  usage: VentasSalesUsage,
): void {
  if (usage.closings > 0) {
    throw new BadRequestException(
      'No se puede cambiar la moneda: el inmueble ya tiene una venta cerrada en su moneda original.',
    );
  }
  if (usage.paidCommissionPartsOnActive > 0) {
    throw new BadRequestException(
      'No se puede cambiar la moneda: ya hay pagos de comisión registrados en la moneda actual.',
    );
  }
}

export function assertClientDeletableForVentas(usage: VentasSalesUsage): void {
  if (usage.activeProcesses > 0 || usage.activeSeparations > 0) {
    throw new BadRequestException(
      'No se puede eliminar el cliente mientras participe en procesos de venta o separaciones activas.',
    );
  }
}

export function assertAgentDeletableForVentas(usage: VentasSalesUsage): void {
  if (usage.activeProcesses > 0) {
    throw new BadRequestException(
      'No se puede eliminar el asesor mientras tenga procesos de venta activos. Reasígnelos primero.',
    );
  }
  if (usage.openCommissions > 0) {
    throw new BadRequestException(
      'No se puede eliminar el asesor mientras tenga comisiones pendientes de pago.',
    );
  }
}
