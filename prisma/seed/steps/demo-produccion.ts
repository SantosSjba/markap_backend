import type { SeedDb } from '../types';
import { seedProduccionConfig } from './demo-produccion-config';
import { seedProduccionClients } from './demo-produccion-clients';
import { seedProduccionFurniture } from './demo-produccion-furniture';
import { seedProduccionCosts } from './demo-produccion-costs';
import { seedProduccionInventory } from './demo-produccion-inventory';
import { seedProduccionPurchases } from './demo-produccion-purchases';
import { seedProduccionWorkOrders } from './demo-produccion-work-orders';
import { seedProduccionSales } from './demo-produccion-sales';

type AdminUser = { id: string; email: string; firstName: string; lastName: string };

/**
 * Datos demo del módulo Producción (sin menús; ejecutar seedProduccionMenus aparte).
 * Orden: config → clientes → catálogo → costos → inventario → compras → OT → ventas.
 */
export async function seedDemoProduccion(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  console.log('\n🏭 Demo Producción de muebles...');
  await seedProduccionConfig(prisma, appIdBySlug);
  await seedProduccionClients(prisma, appIdBySlug, adminUser);
  await seedProduccionFurniture(prisma, appIdBySlug);
  await seedProduccionCosts(prisma, appIdBySlug);
  await seedProduccionInventory(prisma, appIdBySlug);
  await seedProduccionPurchases(prisma, appIdBySlug);
  await seedProduccionWorkOrders(prisma, appIdBySlug);
  await seedProduccionSales(prisma, appIdBySlug);
  console.log('   ✅ Demo Producción completado');
}
