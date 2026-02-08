import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// Definición de roles
const roles = [
  {
    name: 'Administrador',
    code: 'ADMIN',
    description: 'Acceso total al sistema',
  },
  {
    name: 'Gerente',
    code: 'MANAGER',
    description: 'Acceso a gestión y reportes',
  },
  {
    name: 'Usuario',
    code: 'USER',
    description: 'Acceso básico al sistema',
  },
];

// Definición de aplicaciones
const applications = [
  {
    name: 'MARKAP Alquileres Inmobiliarios',
    slug: 'alquileres',
    description: 'Gestión de propiedades en alquiler, contratos y cobranzas',
    icon: 'key',
    color: '#0BB0BE',
    url: '/alquileres',
    activeCount: 45,
    pendingCount: 8,
    order: 1,
  },
  {
    name: 'MARKAP Ventas Inmobiliarias',
    slug: 'ventas',
    description: 'Administración de propiedades en venta y seguimiento de clientes',
    icon: 'home',
    color: '#3B82F6',
    url: '/ventas',
    activeCount: 23,
    pendingCount: 5,
    order: 2,
  },
  {
    name: 'Carolina Zavala Interiorismo',
    slug: 'interiorismo',
    description: 'Proyectos de diseño interior, presupuestos y seguimiento',
    icon: 'palette',
    color: '#E5533D',
    url: '/interiorismo',
    activeCount: 12,
    pendingCount: 3,
    order: 3,
  },
  {
    name: 'HITO Arquitectura',
    slug: 'arquitectura',
    description: 'Gestión de proyectos arquitectónicos y planos',
    icon: 'building',
    color: '#2DBE7E',
    url: '/arquitectura',
    activeCount: 8,
    pendingCount: 2,
    order: 4,
  },
  {
    name: 'Producción de Muebles',
    slug: 'produccion',
    description: 'Control de producción, inventario y órdenes de trabajo',
    icon: 'package',
    color: '#F4B740',
    url: '/produccion',
    activeCount: 34,
    pendingCount: 12,
    order: 5,
  },
  {
    name: 'Sistema Contable',
    slug: 'contabilidad',
    description: 'Finanzas, reportes contables y gestión tributaria',
    icon: 'calculator',
    color: '#8B5CF6',
    url: '/contabilidad',
    activeCount: 156,
    pendingCount: 24,
    order: 6,
  },
];

async function main() {
  console.log('🌱 Starting seed...\n');

  // 1. Crear Roles
  console.log('📋 Creating roles...');
  const createdRoles: { [key: string]: string } = {};
  
  for (const roleData of roles) {
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

  // 2. Crear Aplicaciones
  console.log('\n📱 Creating applications...');
  const createdApps: string[] = [];

  for (const appData of applications) {
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

  // 3. Asignar todas las aplicaciones al rol ADMIN
  console.log('\n🔗 Assigning applications to ADMIN role...');
  const adminRoleId = createdRoles['ADMIN'];

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

  // 3.1 Crear menús para Alquileres
  console.log('\n📂 Creating menus for Alquileres...');
  const alquileresApp = await prisma.application.findUnique({
    where: { slug: 'alquileres' },
  });

  if (alquileresApp) {
    const parentMenus = [
      { label: 'Dashboard', icon: 'layout-dashboard', path: '/alquileres', order: 0 },
      { label: 'Propiedades', icon: 'building', path: null, order: 1 },
      { label: 'Contratos', icon: 'file-text', path: '/alquileres/contratos', order: 2 },
      { label: 'Inquilinos', icon: 'users', path: '/alquileres/inquilinos', order: 3 },
      { label: 'Cobranzas', icon: 'dollar-sign', path: '/alquileres/cobranzas', order: 4 },
      { label: 'Reportes', icon: 'bar-chart', path: '/alquileres/reportes', order: 5 },
      { label: 'Configuración', icon: 'settings', path: '/alquileres/configuracion', order: 6 },
    ];

    const createdMenuIds: { [key: string]: string } = {};

    for (const m of parentMenus) {
      const existing = await prisma.menu.findFirst({
        where: {
          applicationId: alquileresApp.id,
          label: m.label,
          parentId: null,
        },
      });
      if (!existing) {
        const menu = await prisma.menu.create({
          data: {
            applicationId: alquileresApp.id,
            parentId: null,
            label: m.label,
            icon: m.icon,
            path: m.path,
            order: m.order,
            isActive: true,
          },
        });
        createdMenuIds[m.label] = menu.id;
        console.log(`   ✅ Menu "${m.label}" created`);
      } else {
        createdMenuIds[m.label] = existing.id;
      }
    }

    const childMenus = [
      { label: 'Listado de Propiedades', path: '/alquileres/propiedades', order: 0, parentLabel: 'Propiedades' },
      { label: 'Nueva Propiedad', path: '/alquileres/propiedades/nueva', order: 1, parentLabel: 'Propiedades' },
      { label: 'Disponibles', path: '/alquileres/propiedades/disponibles', order: 2, parentLabel: 'Propiedades' },
    ];

    for (const m of childMenus) {
      const parentId = createdMenuIds[m.parentLabel];
      if (!parentId) continue;

      const existing = await prisma.menu.findFirst({
        where: {
          applicationId: alquileresApp.id,
          label: m.label,
          parentId,
        },
      });
      if (!existing) {
        await prisma.menu.create({
          data: {
            applicationId: alquileresApp.id,
            parentId,
            label: m.label,
            icon: null,
            path: m.path,
            order: m.order,
            isActive: true,
          },
        });
        console.log(`   ✅ Submenu "${m.label}" created`);
      }
    }
  }

  // 4. Crear usuario Admin
  console.log('\n👤 Creating admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@markap.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Sistema';

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

  // 5. Asignar rol ADMIN al usuario admin
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

  console.log('\n✨ Seed completed successfully!\n');
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
