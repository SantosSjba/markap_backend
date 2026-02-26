import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter }) as any;

// Definición de roles (Admin + roles por área)
const roles = [
  {
    name: 'Administrador',
    code: 'ADMIN',
    description: 'Acceso total al sistema',
  },
  {
    name: 'Administración y contabilidad',
    code: 'ADMIN_CONTAB',
    description: 'Gestión administrativa y contable',
  },
  {
    name: 'Asistente de arquitectura',
    code: 'ASIST_ARQUITECTURA',
    description: 'Acceso a aplicación de arquitectura',
  },
  {
    name: 'Asistente Administrativo',
    code: 'ASIST_ADMIN',
    description: 'Tareas administrativas y soporte',
  },
  {
    name: 'Gerente',
    code: 'MANAGER',
    description: 'Acceso a gestión y reportes',
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

  // 3.2 Mapa slug -> applicationId para asignar por rol
  const appIdBySlug: { [slug: string]: string } = {};
  for (let i = 0; i < applications.length; i++) {
    appIdBySlug[applications[i].slug] = createdApps[i];
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

  // Asignar aplicaciones a cada rol (según acceso por área)
  console.log('\n🔗 Assigning applications to other roles...');
  await assignAppsToRole(
    'MANAGER',
    ['alquileres', 'ventas', 'interiorismo', 'arquitectura', 'produccion', 'contabilidad'],
    'Gerente',
  );
  await assignAppsToRole(
    'ADMIN_CONTAB',
    ['alquileres', 'contabilidad'],
    'Administración y contabilidad',
  );
  await assignAppsToRole(
    'ASIST_ARQUITECTURA',
    ['arquitectura'],
    'Asistente de arquitectura',
  );
  await assignAppsToRole(
    'ASIST_ADMIN',
    ['alquileres', 'ventas', 'contabilidad'],
    'Asistente Administrativo',
  );

  // 3.3 Crear menús para Alquileres
  console.log('\n📂 Creating menus for Alquileres...');
  const alquileresApp = await prisma.application.findUnique({
    where: { slug: 'alquileres' },
  });

  if (alquileresApp) {
    const parentMenus = [
      { label: 'Dashboard', icon: 'layout-dashboard', path: '/alquileres', order: 0 },
      { label: 'Clientes', icon: 'users', path: '/alquileres/clientes', order: 1 },
      { label: 'Propiedades', icon: 'building', path: null, order: 2 },
      { label: 'Alquileres', icon: 'file-text', path: '/alquileres/contratos', order: 3 },
      { label: 'Agentes', icon: 'user-check', path: '/alquileres/agentes', order: 4 },
      { label: 'Reportes', icon: 'bar-chart', path: '/alquileres/reportes', order: 6 },
      { label: 'Configuración', icon: 'settings', path: '/alquileres/configuracion', order: 7 },
    ];

    const createdMenuIds: { [key: string]: string } = {};

    for (const m of parentMenus) {
      const existingMenu = await prisma.menu.findFirst({
        where: {
          applicationId: alquileresApp.id,
          parentId: null,
          ...(m.path ? { path: m.path } : { label: m.label }),
        },
      });
      if (!existingMenu) {
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
        await prisma.menu.update({
          where: { id: existingMenu.id },
          data: { label: m.label, icon: m.icon, path: m.path, order: m.order },
        });
        createdMenuIds[m.label] = existingMenu.id;
        console.log(`   ✅ Menu "${m.label}" updated`);
      }
    }

    const childMenus = [
      // Clientes (al mismo nivel: listado y nuevo)
      { label: 'Listado de Clientes', path: '/alquileres/clientes', order: 0, parentLabel: 'Clientes' },
      { label: 'Nuevo Cliente', path: '/alquileres/clientes/nuevo', order: 1, parentLabel: 'Clientes' },
      // Propiedades
      { label: 'Listado de Propiedades', path: '/alquileres/propiedades', order: 0, parentLabel: 'Propiedades' },
      { label: 'Nueva Propiedad', path: '/alquileres/propiedades/nueva', order: 1, parentLabel: 'Propiedades' },
      // Alquileres (ex Contratos)
      { label: 'Listado de Alquileres', path: '/alquileres/contratos', order: 0, parentLabel: 'Alquileres' },
      { label: 'Nuevo Alquiler', path: '/alquileres/contratos/nuevo', order: 1, parentLabel: 'Alquileres' },
      // Agentes
      { label: 'Listado de Agentes', path: '/alquileres/agentes', order: 0, parentLabel: 'Agentes' },
      { label: 'Nuevo Agente', path: '/alquileres/agentes/nuevo', order: 1, parentLabel: 'Agentes' },
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

  // 6. Tipos de documento
  console.log('\n📄 Creating document types...');
  const documentTypes = [
    { code: 'DNI', name: 'DNI', length: 8 },
    { code: 'CE', name: 'Carné de Extranjería', length: 12 },
    { code: 'RUC', name: 'RUC', length: 11 },
    { code: 'PASAPORTE', name: 'Pasaporte', length: null },
  ];
  for (const dt of documentTypes) {
    await prisma.documentType.upsert({
      where: { code: dt.code },
      create: dt,
      update: {},
    });
  }
  console.log('   ✅ Document types created');

  // 7. Ubigeo - Departamento Lima y distritos principales
  console.log('\n🗺️ Creating ubigeo (Lima)...');
  await prisma.department.upsert({
    where: { id: '15' },
    create: { id: '15', name: 'Lima' },
    update: {},
  });
  await prisma.province.upsert({
    where: { id: '1501' },
    create: { id: '1501', departmentId: '15', name: 'Lima' },
    update: {},
  });
  const limaDistricts = [
    { id: '150101', provinceId: '1501', name: 'Lima' },
    { id: '150132', provinceId: '1501', name: 'Miraflores' },
    { id: '150122', provinceId: '1501', name: 'San Isidro' },
    { id: '150131', provinceId: '1501', name: 'Santiago de Surco' },
    { id: '150114', provinceId: '1501', name: 'Jesús María' },
    { id: '150133', provinceId: '1501', name: 'Pueblo Libre' },
    { id: '150128', provinceId: '1501', name: 'San Miguel' },
    { id: '150136', provinceId: '1501', name: 'Magdalena del Mar' },
  ];
  for (const d of limaDistricts) {
    await prisma.district.upsert({
      where: { id: d.id },
      create: d,
      update: {},
    });
  }
  console.log('   ✅ Ubigeo Lima created');

  // 8. Tipos de propiedad
  console.log('\n🏠 Creating property types...');
  const propertyTypes = [
    { code: 'DEP', name: 'Departamento' },
    { code: 'CASA', name: 'Casa' },
    { code: 'OFICINA', name: 'Oficina' },
    { code: 'LOCAL', name: 'Local comercial' },
    { code: 'BODEGA', name: 'Bodega' },
    { code: 'ESTACIONAMIENTO', name: 'Estacionamiento' },
  ];
  for (const pt of propertyTypes) {
    await prisma.propertyType.upsert({
      where: { code: pt.code },
      create: pt,
      update: {},
    });
  }
  console.log('   ✅ Property types created');

  // 9. Clientes (1 propietario, 1 inquilino) - aplicación Alquileres
  console.log('\n👥 Creating sample clients...');
  const alquileresAppId = createdApps[0]; // alquileres es la primera
  const dniType = await prisma.documentType.findUnique({ where: { code: 'DNI' } });
  if (!dniType) throw new Error('DocumentType DNI not found');

  let ownerClient = await prisma.client.findFirst({
    where: { applicationId: alquileresAppId, clientType: 'OWNER' },
  });
  if (!ownerClient) {
    ownerClient = await prisma.client.create({
      data: {
        applicationId: alquileresAppId,
        clientType: 'OWNER',
        documentTypeId: dniType.id,
        documentNumber: '12345678',
        fullName: 'Juan Pérez García',
        primaryPhone: '999888777',
        primaryEmail: 'juan.perez@ejemplo.com',
        createdBy: adminUser.id,
      },
    });
    console.log('   ✅ Owner client "Juan Pérez García" created');
  } else {
    console.log('   ✓ Owner client already exists');
  }

  let tenantClient = await prisma.client.findFirst({
    where: { applicationId: alquileresAppId, clientType: 'TENANT' },
  });
  if (!tenantClient) {
    tenantClient = await prisma.client.create({
      data: {
        applicationId: alquileresAppId,
        clientType: 'TENANT',
        documentTypeId: dniType.id,
        documentNumber: '87654321',
        fullName: 'María López Sánchez',
        primaryPhone: '988777666',
        primaryEmail: 'maria.lopez@ejemplo.com',
        createdBy: adminUser.id,
      },
    });
    console.log('   ✅ Tenant client "María López Sánchez" created');
  } else {
    console.log('   ✓ Tenant client already exists');
  }

  // 10. Dirección del propietario
  console.log('\n📍 Creating sample address...');
  const districtLima = await prisma.district.findUnique({ where: { id: '150101' } });
  if (districtLima) {
    const existingAddress = await prisma.address.findFirst({
      where: { clientId: ownerClient.id },
    });
    if (!existingAddress) {
      await prisma.address.create({
        data: {
          clientId: ownerClient.id,
          addressType: 'FISCAL',
          addressLine: 'Av. Principal 123, Lima',
          districtId: districtLima.id,
          isPrimary: true,
        },
      });
      console.log('   ✅ Address for owner created');
    } else {
      console.log('   ✓ Address for owner already exists');
    }
  }

  // 11. Propiedad (inmueble en alquiler)
  console.log('\n🏡 Creating sample property...');
  const depType = await prisma.propertyType.findUnique({ where: { code: 'DEP' } });
  if (!depType) throw new Error('PropertyType DEP not found');

  let sampleProperty = await prisma.property.findFirst({
    where: { applicationId: alquileresAppId, code: 'PROP-SEED-001' },
  });
  if (!sampleProperty && districtLima) {
    sampleProperty = await prisma.property.create({
      data: {
        applicationId: alquileresAppId,
        code: 'PROP-SEED-001',
        propertyTypeId: depType.id,
        addressLine: 'Calle Las Flores 456, Miraflores',
        districtId: districtLima.id,
        description: 'Departamento amplio, buena iluminación.',
        area: 85.5,
        bedrooms: 2,
        bathrooms: 2,
        monthlyRent: 1500,
        depositMonths: 2,
        listingStatus: 'AVAILABLE',
        ownerId: ownerClient.id,
        createdBy: adminUser.id,
      },
    });
    console.log('   ✅ Property "PROP-SEED-001" created');
  } else {
    console.log('   ✓ Sample property already exists');
  }

  // 12. Alquiler (contrato)
  console.log('\n📋 Creating sample rental...');
  let sampleRental: { id: string } | null = null;
  if (sampleProperty) {
    sampleRental = await prisma.rental.findFirst({
      where: { propertyId: sampleProperty.id },
      select: { id: true },
    });
    if (!sampleRental) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      sampleRental = await prisma.rental.create({
        data: {
          applicationId: alquileresAppId,
          propertyId: sampleProperty.id,
          tenantId: tenantClient.id,
          startDate,
          endDate,
          currency: 'PEN',
          monthlyAmount: 1500,
          securityDeposit: 3000,
          paymentDueDay: 5,
          status: 'ACTIVE',
          notes: 'Contrato seed - datos de prueba.',
          createdBy: adminUser.id,
        },
        select: { id: true },
      });
      console.log('   ✅ Sample rental (contract) created');
    } else {
      console.log('   ✓ Sample rental already exists');
    }
  }

  // 13. Agentes (1 interno = admin, 1 externo)
  console.log('\n🤝 Creating sample agents...');
  let internalAgent = await prisma.agent.findFirst({
    where: { applicationId: alquileresAppId, type: 'INTERNAL' },
  });
  if (!internalAgent) {
    internalAgent = await prisma.agent.create({
      data: {
        applicationId: alquileresAppId,
        type: 'INTERNAL',
        userId: adminUser.id,
        fullName: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        isActive: true,
      },
    });
    console.log('   ✅ Internal agent (admin user) created');
  } else {
    console.log('   ✓ Internal agent already exists');
  }

  const rucType = await prisma.documentType.findUnique({ where: { code: 'RUC' } });
  let externalAgent = await prisma.agent.findFirst({
    where: { applicationId: alquileresAppId, type: 'EXTERNAL' },
  });
  if (!externalAgent) {
    externalAgent = await prisma.agent.create({
      data: {
        applicationId: alquileresAppId,
        type: 'EXTERNAL',
        fullName: 'Carlos Inmobiliaria SAC',
        email: 'contacto@carlosinmobiliaria.com',
        phone: '955444333',
        ...(rucType && {
          documentTypeId: rucType.id,
          documentNumber: '20123456789',
        }),
        isActive: true,
      },
    });
    console.log('   ✅ External agent "Carlos Inmobiliaria SAC" created');
  } else {
    console.log('   ✓ External agent already exists');
  }

  // 14. Configuración financiera del alquiler
  if (sampleRental) {
    console.log('\n💰 Creating rental financial config...');
    const existingConfig = await prisma.rentalFinancialConfig.findUnique({
      where: { rentalId: sampleRental.id },
    });
    if (!existingConfig) {
      await prisma.rentalFinancialConfig.create({
        data: {
          rentalId: sampleRental.id,
          currency: 'PEN',
          expenseType: 'FIXED',
          expenseValue: 0,
          taxType: 'FIXED',
          taxValue: 0,
          externalAgentId: externalAgent.id,
          externalAgentType: 'FIXED',
          externalAgentValue: 200,
          internalAgentId: adminUser.id,
          internalAgentType: 'FIXED',
          internalAgentValue: 150,
        },
      });
      console.log('   ✅ Rental financial config created');
    } else {
      console.log('   ✓ Rental financial config already exists');
    }

    // 15. Adjunto de alquiler (placeholder)
    console.log('\n📎 Creating sample rental attachment...');
    const existingAttachment = await prisma.rentalAttachment.findFirst({
      where: { rentalId: sampleRental.id },
    });
    if (!existingAttachment) {
      await prisma.rentalAttachment.create({
        data: {
          rentalId: sampleRental.id,
          type: 'CONTRACT',
          filePath: 'uploads/rentals/seed-contrato-placeholder.pdf',
          originalFileName: 'contrato-ejemplo.pdf',
        },
      });
      console.log('   ✅ Sample rental attachment (placeholder) created');
    } else {
      console.log('   ✓ Sample rental attachment already exists');
    }
  }

  // 16. Notificación de ejemplo para el admin
  console.log('\n🔔 Creating sample notification...');
  const existingNotification = await prisma.notification.findFirst({
    where: { userId: adminUser.id },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'RENTAL_CREATED',
        title: 'Bienvenido al sistema',
        body: 'Este es un mensaje de ejemplo. El seed ha creado datos básicos en todas las tablas.',
        data: { source: 'seed' },
      },
    });
    console.log('   ✅ Sample notification created');
  } else {
    console.log('   ✓ Sample notification already exists');
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
