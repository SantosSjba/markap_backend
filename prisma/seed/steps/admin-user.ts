import * as bcrypt from 'bcrypt';
import type { SeedDb } from '../types';
import { createScriptLogger } from '../../../src/shared/infrastructure/logging/script-logger';
const logger = createScriptLogger('Script:admin-user');

export async function seedAdminUser(
  prisma: SeedDb,
  adminRoleId: string,
): Promise<{
  adminUser: { id: string; email: string; firstName: string; lastName: string };
}> {
  if (!adminRoleId) {
    throw new Error(
      'seedAdminUser: adminRoleId vacío. Debe ejecutarse seedRolesAndApplications antes.',
    );
  }

  logger.info({ event: 'seed.progress' }, '\n👤 Creating admin user...');
  const adminEmail = (process.env.ADMIN_EMAIL || 'sistemas@markaphomes.com')
    .toLowerCase()
    .trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Sistemas';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Markap Homes';

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminUser) {
    logger.info(
      { event: 'seed.admin.exists' },
      'El usuario administrador ya existe',
    );
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        isActive: true,
        createdBy: 'system',
      },
    });
    logger.info(
      { event: 'seed.admin.created' },
      'Usuario administrador creado',
    );
  }

  logger.info(
    { event: 'seed.progress' },
    '\n🔐 Assigning ADMIN role to admin user...',
  );
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRoleId,
      },
    },
    create: {
      userId: adminUser.id,
      roleId: adminRoleId,
      assignedBy: 'system',
      isActive: true,
    },
    update: {
      isActive: true,
      revokedAt: null,
      revokedBy: null,
      assignedBy: 'system',
    },
  });
  logger.info(
    { event: 'seed.progress' },
    '   ✅ ADMIN role asegurado para el usuario admin (activo, no revocado)',
  );

  return { adminUser };
}
