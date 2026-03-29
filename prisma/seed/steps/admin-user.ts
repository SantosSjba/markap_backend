import * as bcrypt from 'bcrypt';
import type { SeedDb } from '../types';

export async function seedAdminUser(
  prisma: SeedDb,
  adminRoleId: string,
): Promise<{ adminUser: { id: string; email: string; firstName: string; lastName: string } }> {
  console.log('\n👤 Creating admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'sistemas@markaphomes.com';
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
  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRoleId,
      },
    },
  });

  if (!existingUserRole) {
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRoleId,
        assignedBy: 'system',
      },
    });
    console.log('   ✅ ADMIN role assigned to admin user');
  } else {
    console.log('   ✓ ADMIN role already assigned');
  }

  return { adminUser };
}
