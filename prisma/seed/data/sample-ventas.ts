/** Datos demo para módulo Ventas (clientes BUYER / CRM, inventario). */

export const VENTAS_SAMPLE_EXTERNAL_AGENT = {
  fullName: 'Lucía Torres Mendoza',
  email: 'lucia.torres.ventas@markap.demo',
  phone: '999111222',
  documentNumber: '44556677',
};

/**
 * Clientes tipo BUYER: embudo, origen del lead.
 * assignedAgent: 'internal' | 'external' | null — resuelto en el step según agentes creados.
 */
export const VENTAS_SAMPLE_BUYER_CLIENTS: {
  documentNumber: string
  fullName: string
  primaryPhone: string
  primaryEmail: string
  salesStatus: 'PROSPECT' | 'INTERESTED' | 'CLIENT'
  leadOrigin: string
  assignedAgent: 'internal' | 'external' | null
}[] = [
  {
    documentNumber: '40123456',
    fullName: 'Roberto Díaz Castillo',
    primaryPhone: '987654321',
    primaryEmail: 'roberto.diaz.seed@ejemplo.com',
    salesStatus: 'PROSPECT',
    leadOrigin: 'FACEBOOK',
    assignedAgent: 'internal',
  },
  {
    documentNumber: '40234567',
    fullName: 'Carmen Vega Ríos',
    primaryPhone: '976543210',
    primaryEmail: 'carmen.vega.seed@ejemplo.com',
    salesStatus: 'INTERESTED',
    leadOrigin: 'WEB',
    assignedAgent: 'external',
  },
  {
    documentNumber: '40345678',
    fullName: 'Diego Salas Núñez',
    primaryPhone: '965432109',
    primaryEmail: 'diego.salas.seed@ejemplo.com',
    salesStatus: 'CLIENT',
    leadOrigin: 'REFERIDO',
    assignedAgent: null,
  },
]

/** Propietarios para inventario de propiedades en Ventas (clientType OWNER). */
export const VENTAS_SAMPLE_PROPERTY_OWNERS: {
  documentNumber: string
  fullName: string
  primaryPhone: string
  primaryEmail: string
}[] = [
  {
    documentNumber: '41888999',
    fullName: 'Rosa Quispe Huamán',
    primaryPhone: '944001122',
    primaryEmail: 'rosa.owner.ventas@ejemplo.com',
  },
  {
    documentNumber: '41777888',
    fullName: 'Grupo Inmobiliario Norte EIRL — contacto',
    primaryPhone: '933445566',
    primaryEmail: 'contacto.norte.ventas@ejemplo.com',
  },
]

/** Propiedades en venta (application ventas). `propertyTypeCode` debe existir en seed (ej. DEP). */
export const VENTAS_SAMPLE_PROPERTIES: {
  code: string
  addressLine: string
  description: string
  area: number
  bedrooms: number
  bathrooms: number
  projectName: string | null
  salePrice: number
  listingStatus: 'AVAILABLE' | 'RESERVED' | 'SOLD'
  propertyTypeCode: string
  ownerDocumentNumber: string
  mediaItems: { url: string; kind: 'photo' | 'plan' }[]
}[] = [
  {
    code: 'VNT-SEED-001',
    addressLine: 'Av. Pardo 420, Miraflores',
    description: 'Departamento con vista al mar, acabados de primera.',
    area: 118.5,
    bedrooms: 3,
    bathrooms: 2,
    projectName: 'Torre Vista Mar',
    salePrice: 385000,
    listingStatus: 'AVAILABLE',
    propertyTypeCode: 'DEP',
    ownerDocumentNumber: '41888999',
    mediaItems: [
      {
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
        kind: 'photo',
      },
      { url: 'https://example.com/demo/planos/vnt-001.pdf', kind: 'plan' },
    ],
  },
  {
    code: 'VNT-SEED-002',
    addressLine: 'Calle Los Laureles 180, San Isidro',
    description: 'Piso intermedio, listo para escritura.',
    area: 95,
    bedrooms: 2,
    bathrooms: 2,
    projectName: 'Residencial Los Laureles',
    salePrice: 295000,
    listingStatus: 'RESERVED',
    propertyTypeCode: 'DEP',
    ownerDocumentNumber: '41888999',
    mediaItems: [
      {
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
        kind: 'photo',
      },
    ],
  },
  {
    code: 'VNT-SEED-003',
    addressLine: 'Mz. K Lt. 12, Urbanización El Trébol',
    description: 'Terreno en esquina, documentos en regla.',
    area: 200,
    bedrooms: 0,
    bathrooms: 0,
    projectName: null,
    salePrice: 180000,
    listingStatus: 'SOLD',
    propertyTypeCode: 'CASA',
    ownerDocumentNumber: '41777888',
    mediaItems: [],
  },
]
