import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Configuración del admin por defecto
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@markap.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Sistema';

  // Verificar si ya existe el admin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
    return;
  }

  // Encriptar la contraseña
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Crear el usuario admin
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      isActive: true,
      createdBy: 'system',
    },
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`   📧 Email: ${admin.email}`);
  console.log(`   🔑 Password: ${adminPassword}`);
  console.log(`   👤 Name: ${admin.firstName} ${admin.lastName}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
