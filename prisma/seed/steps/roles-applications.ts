import {
  APPLICATIONS,
  ROLE_APPLICATION_ASSIGNMENTS,
  ROLES,
} from '../data';
import type { SeedDb } from '../types';

export type RolesApplicationsResult = {
  createdRoles: Record<string, string>;
  adminRoleId: string;
  createdApps: string[];
  appIdBySlug: Record<string, string>;
};

export async function seedRolesAndApplications(prisma: SeedDb): Promise<RolesApplicationsResult> {
  console.log('📋 Creating roles...');
  const createdRoles: Record<string, string> = {};

  for (const roleData of ROLES) {
    const existingRole = await prisma.role.findUnique({
      where: { code: roleData.code },
    });

    if (existingRole) {
      console.log(`   ✓ Role "${roleData.name}" already exists`);
      createdRoles[roleData.code] = existingRole.id;
    } else {
      const role = await prisma.role.create({ data: roleData });
      console.log(`   ✅ Role "${roleData.name}" created`);
      createdRoles[roleData.code] = role.id;
    }
  }

  console.log('\n📱 Creating applications...');
  const createdApps: string[] = [];

  for (const appData of APPLICATIONS) {
    const existingApp = await prisma.application.findUnique({
      where: { slug: appData.slug },
    });

    if (existingApp) {
      console.log(`   ✓ Application "${appData.name}" already exists`);
      createdApps.push(existingApp.id);
    } else {
      const app = await prisma.application.create({ data: appData });
      console.log(`   ✅ Application "${appData.name}" created`);
      createdApps.push(app.id);
    }
  }

  console.log('\n🔗 Assigning applications to ADMIN role...');
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
  console.log('   ✅ All applications assigned to ADMIN role');

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
    console.log(`   ✅ ${roleLabel}: ${slugs.join(', ')}`);
  };

  console.log('\n🔗 Assigning applications to other roles...');
  for (const assignment of ROLE_APPLICATION_ASSIGNMENTS) {
    await assignAppsToRole(assignment.roleCode, assignment.slugs, assignment.label);
  }

  return { createdRoles, adminRoleId, createdApps, appIdBySlug };
}
