import { APPLICATIONS, ROLE_APPLICATION_ASSIGNMENTS, ROLES } from '../data';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:roles-applications');

export type RolesApplicationsResult = {
  createdRoles: Record<string, string>;
  adminRoleId: string;
  createdApps: string[];
  appIdBySlug: Record<string, string>;
};

export async function seedRolesAndApplications(
  prisma: SeedDb,
): Promise<RolesApplicationsResult> {
  logger.info({ event: 'seed.progress' }, '📋 Creating roles...');
  const createdRoles: Record<string, string> = {};

  for (const roleData of ROLES) {
    const existingRole = await prisma.role.findUnique({
      where: { code: roleData.code },
    });

    if (existingRole) {
      logger.info(
        { event: 'seed.progress' },
        `   ✓ Role "${roleData.name}" already exists`,
      );
      createdRoles[roleData.code] = existingRole.id;
    } else {
      const role = await prisma.role.create({ data: roleData });
      logger.info(
        { event: 'seed.progress' },
        `   ✅ Role "${roleData.name}" created`,
      );
      createdRoles[roleData.code] = role.id;
    }
  }

  logger.info({ event: 'seed.progress' }, '\n📱 Creating applications...');
  const createdApps: string[] = [];

  for (const appData of APPLICATIONS) {
    const existingApp = await prisma.application.findUnique({
      where: { slug: appData.slug },
    });

    if (existingApp) {
      logger.info(
        { event: 'seed.progress' },
        `   ✓ Application "${appData.name}" already exists`,
      );
      createdApps.push(existingApp.id);
    } else {
      const app = await prisma.application.create({ data: appData });
      logger.info(
        { event: 'seed.progress' },
        `   ✅ Application "${appData.name}" created`,
      );
      createdApps.push(app.id);
    }
  }

  logger.info(
    { event: 'seed.progress' },
    '\n🔗 Assigning applications to ADMIN role...',
  );
  const adminRoleId = createdRoles['ADMIN'];
  if (!adminRoleId) {
    throw new Error(
      'Rol ADMIN no encontrado en createdRoles; revisa prisma/seed/data/roles.ts (code: ADMIN).',
    );
  }

  for (const appId of createdApps) {
    const existing = await prisma.roleApplication.findUnique({
      where: {
        roleId_applicationId: {
          roleId: adminRoleId,
          applicationId: appId,
        },
      },
    });

    if (!existing) {
      await prisma.roleApplication.create({
        data: {
          roleId: adminRoleId,
          applicationId: appId,
          canRead: true,
          canWrite: true,
          canDelete: true,
          canAdmin: true,
        },
      });
    }
  }
  logger.info(
    { event: 'seed.progress' },
    '   ✅ All applications assigned to ADMIN role',
  );

  const appIdBySlug: Record<string, string> = {};
  for (let i = 0; i < APPLICATIONS.length; i++) {
    appIdBySlug[APPLICATIONS[i].slug] = createdApps[i];
  }

  const assignAppsToRole = async (
    roleCode: string,
    slugs: string[],
    roleLabel: string,
  ) => {
    const roleId = createdRoles[roleCode];
    if (!roleId) return;
    for (const slug of slugs) {
      const appId = appIdBySlug[slug];
      if (!appId) continue;
      const existing = await prisma.roleApplication.findUnique({
        where: {
          roleId_applicationId: { roleId, applicationId: appId },
        },
      });
      if (!existing) {
        await prisma.roleApplication.create({
          data: {
            roleId,
            applicationId: appId,
            canRead: true,
            canWrite: true,
            canDelete: false,
            canAdmin: false,
          },
        });
      }
    }
    logger.info(
      { event: 'seed.progress' },
      `   ✅ ${roleLabel}: ${slugs.join(', ')}`,
    );
  };

  logger.info(
    { event: 'seed.progress' },
    '\n🔗 Assigning applications to other roles...',
  );
  for (const assignment of ROLE_APPLICATION_ASSIGNMENTS) {
    await assignAppsToRole(
      assignment.roleCode,
      assignment.slugs,
      assignment.label,
    );
  }

  return { createdRoles, adminRoleId, createdApps, appIdBySlug };
}
