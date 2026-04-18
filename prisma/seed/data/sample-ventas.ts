/** Datos demo para módulo Ventas (clientes BUYER / CRM). */

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
