import type { SeedDb } from '../types';
import { seedArquitecturaConfig } from './demo-arquitectura-config';
import { seedArquitecturaClients } from './demo-arquitectura-clients';
import { seedArquitecturaProjects } from './demo-arquitectura-projects';
import { seedArquitecturaMaterials } from './demo-arquitectura-materials';
import { seedArquitecturaExecution } from './demo-arquitectura-execution';
import { seedArquitecturaFinance } from './demo-arquitectura-finance';
import { seedArquitecturaCalendar } from './demo-arquitectura-calendar';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:demo-arquitectura');

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * Datos demo del módulo Arquitectura.
 * Orden: config → clientes → proyectos → materiales → ejecución → finanzas → calendario.
 */
export async function seedDemoArquitectura(
  prisma: SeedDb,
  appIdBySlug: Record<string, string>,
  adminUser: AdminUser,
): Promise<void> {
  logger.info({ event: 'seed.progress' }, '\n🏛️  Demo Arquitectura…');
  await seedArquitecturaConfig(prisma, appIdBySlug);
  await seedArquitecturaClients(prisma, appIdBySlug, adminUser);
  await seedArquitecturaProjects(prisma, appIdBySlug, adminUser);
  await seedArquitecturaMaterials(prisma, appIdBySlug);
  await seedArquitecturaExecution(prisma, appIdBySlug);
  await seedArquitecturaFinance(prisma, appIdBySlug);
  await seedArquitecturaCalendar(prisma, appIdBySlug);
  logger.info({ event: 'seed.progress' }, '   ✅ Demo Arquitectura completado');
}
