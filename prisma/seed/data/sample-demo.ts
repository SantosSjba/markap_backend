export const SEED_PRIMARY_APPLICATION_SLUG = 'alquileres';

export const SAMPLE_DISTRICT_ID_LIMA = '150101';

export const SAMPLE_OWNER_CLIENT = {
  documentNumber: '12345678',
  fullName: 'Juan Pérez García',
  primaryPhone: '999888777',
  primaryEmail: 'juan.perez@ejemplo.com',
};

export const SAMPLE_TENANT_CLIENT = {
  documentNumber: '87654321',
  fullName: 'María López Sánchez',
  primaryPhone: '988777666',
  primaryEmail: 'maria.lopez@ejemplo.com',
};

export const SAMPLE_OWNER_ADDRESS = {
  addressType: 'FISCAL' as const,
  addressLine: 'Av. Principal 123, Lima',
  isPrimary: true,
};

export const SAMPLE_PROPERTY = {
  code: 'PROP-SEED-001',
  addressLine: 'Calle Las Flores 456, Miraflores',
  description: 'Departamento amplio, buena iluminación.',
  area: 85.5,
  bedrooms: 2,
  bathrooms: 2,
  monthlyRent: 1500,
  depositMonths: 2,
  listingStatus: 'AVAILABLE' as const,
};

export const SAMPLE_RENTAL = {
  currency: 'PEN' as const,
  monthlyAmount: 1500,
  securityDeposit: 3000,
  paymentDueDay: 5,
  status: 'ACTIVE' as const,
  notes: 'Contrato seed - datos de prueba.',
};

export const SAMPLE_RENTAL_FINANCIAL = {
  currency: 'PEN' as const,
  expenseType: 'FIXED' as const,
  expenseValue: 0,
  taxType: 'FIXED' as const,
  taxValue: 0,
  externalAgentType: 'FIXED' as const,
  externalAgentValue: 200,
  internalAgentType: 'FIXED' as const,
  internalAgentValue: 150,
};

export const SAMPLE_EXTERNAL_AGENT = {
  fullName: 'Carlos Inmobiliaria SAC',
  email: 'contacto@carlosinmobiliaria.com',
  phone: '955444333',
  documentNumber: '20123456789',
};

export const SAMPLE_RENTAL_ATTACHMENT = {
  type: 'CONTRACT' as const,
  filePath: 'uploads/rentals/seed-contrato-placeholder.pdf',
  originalFileName: 'contrato-ejemplo.pdf',
};

export const SAMPLE_NOTIFICATION = {
  type: 'RENTAL_CREATED' as const,
  title: 'Bienvenido al sistema',
  body: 'Este es un mensaje de ejemplo. El seed ha creado datos básicos en todas las tablas.',
  data: { source: 'seed' },
};
