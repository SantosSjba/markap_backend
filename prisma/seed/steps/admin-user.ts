import * as bcrypt from 'bcrypt';
import type { SeedDb } from '../types';

export async function seedAdminUser(
  prisma: SeedDb,
  adminRoleId: string,
): Promise<{ adminUser: { id: string; email: string; firstName: string; lastName: string } }> {
  if (!adminRoleId) {
    throw new Error(
      'seedAdminUser: adminRoleId vacío. Debe ejecutarse seedRolesAndApplications antes.',
    );
  }

  console.log('\n👤 Creating admin user...');
  const adminEmail = (process.env.ADMIN_EMAIL || 'sistemas@markaphomes.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Sistemas';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Markap Homes';

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminUser) {
    console.log(`   ✓ Admin user already exists: ${adminEmail}`);
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
    console.log(`   ✅ Admin user created: ${adminEmail}`);
    console.log(`   🔑 Password: ${adminPassword}`);
  }

  console.log('\n🔐 Assigning ADMIN role to admin user...');
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
  console.log('   ✅ ADMIN role asegurado para el usuario admin (activo, no revocado)');

  return { adminUser };
}
