/** Bancos y medios de pago habituales en procesos de venta inmobiliaria — Perú */
export const SALE_FINANCING_CHANNELS = [
  // Bancos
  { category: 'BANK', code: 'BCP', name: 'BCP — Banco de Crédito del Perú', sortOrder: 10 },
  { category: 'BANK', code: 'BBVA', name: 'BBVA Perú', sortOrder: 11 },
  { category: 'BANK', code: 'INTERBANK', name: 'Interbank', sortOrder: 12 },
  { category: 'BANK', code: 'SCOTIABANK', name: 'Scotiabank Perú', sortOrder: 13 },
  { category: 'BANK', code: 'BANCO_NACION', name: 'Banco de la Nación', sortOrder: 14 },
  { category: 'BANK', code: 'BANBIF', name: 'BanBif', sortOrder: 15 },
  { category: 'BANK', code: 'PICHINCHA', name: 'Banco Pichincha', sortOrder: 16 },
  { category: 'BANK', code: 'MIBANCO', name: 'MiBanco', sortOrder: 17 },
  { category: 'BANK', code: 'GNB', name: 'Banco GNB', sortOrder: 18 },
  { category: 'BANK', code: 'FALABELLA', name: 'Banco Falabella', sortOrder: 19 },
  { category: 'BANK', code: 'RIPLEY', name: 'Banco Ripley', sortOrder: 20 },
  { category: 'BANK', code: 'CAJA_AREQUIPA', name: 'Caja Arequipa', sortOrder: 21 },
  { category: 'BANK', code: 'CAJA_HUANCAYO', name: 'Caja Huancayo', sortOrder: 22 },
  { category: 'BANK', code: 'CAJA_TRUJILLO', name: 'Caja Trujillo', sortOrder: 23 },
  { category: 'BANK', code: 'CAJA_PIURA', name: 'Caja Piura', sortOrder: 24 },
  { category: 'BANK', code: 'COOPAC', name: 'Cooperativas / COOPAC', sortOrder: 25 },
  // Medios de pago
  { category: 'PAYMENT_METHOD', code: 'TRANSFER', name: 'Transferencia bancaria', sortOrder: 40 },
  { category: 'PAYMENT_METHOD', code: 'MGMT_CHECK', name: 'Cheque de gerencia', sortOrder: 41 },
  { category: 'PAYMENT_METHOD', code: 'DEPOSIT', name: 'Depósito en cuenta', sortOrder: 42 },
  { category: 'PAYMENT_METHOD', code: 'LETTER_CREDIT', name: 'Carta de crédito', sortOrder: 43 },
  { category: 'PAYMENT_METHOD', code: 'MORTGAGE_LOAN', name: 'Crédito hipotecario', sortOrder: 44 },
  { category: 'PAYMENT_METHOD', code: 'PROMISSORY', name: 'Pagaré / financiamiento directo', sortOrder: 45 },
  // Fondos propios
  { category: 'OWN_FUNDS', code: 'OWN_FUNDS', name: 'Fondos propios', sortOrder: 60 },
  { category: 'OWN_FUNDS', code: 'CASH', name: 'Efectivo', sortOrder: 61 },
  // Otros
  { category: 'OTHER', code: 'MIXED', name: 'Mixto (varios medios)', sortOrder: 80 },
  { category: 'OTHER', code: 'TBD', name: 'Por definir', sortOrder: 81 },
  { category: 'OTHER', code: 'OTHER', name: 'Otros', sortOrder: 82 },
] as const
