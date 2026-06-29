export const SAMPLE_PRODUCCION_RESIDENTIAL_CLIENT = {
  fullName: 'Familia Ríos Mendoza',
  documentNumber: '45892136',
  email: 'rios.muebles@example.com',
  phone: '+51 987 654 321',
  address: 'Av. Primavera 245, Surco, Lima',
} as const;

export const SAMPLE_PRODUCCION_CORPORATE_CLIENT = {
  fullName: 'Oficinas Nova SAC',
  documentNumber: '20604588721',
  email: 'compras@oficinasnova.pe',
  phone: '+51 1 445 7788',
  address: 'Calle Los Negocios 118, San Isidro, Lima',
} as const;

export const PRODUCCION_CONFIG_DEFAULTS = {
  furnitureCategories: [
    { code: 'comedor', label: 'Comedor', sortOrder: 0 },
    { code: 'dormitorio', label: 'Dormitorio', sortOrder: 1 },
    { code: 'oficina', label: 'Oficina', sortOrder: 2 },
    { code: 'cocina', label: 'Cocina', sortOrder: 3 },
    { code: 'sala', label: 'Sala', sortOrder: 4 },
    { code: 'otro', label: 'Otro', sortOrder: 5 },
  ],
  materialCategories: [
    { code: 'tableros', label: 'Tableros', sortOrder: 0 },
    { code: 'herrajes', label: 'Herrajes', sortOrder: 1 },
    { code: 'adhesivos', label: 'Adhesivos', sortOrder: 2 },
    { code: 'acabados', label: 'Acabados', sortOrder: 3 },
    { code: 'otros', label: 'Otros', sortOrder: 4 },
  ],
  productionStages: [
    { stageKey: 'planificacion', label: 'Planificación', sortOrder: 0 },
    { stageKey: 'corte', label: 'Corte', sortOrder: 1 },
    { stageKey: 'ensamble', label: 'Ensamble', sortOrder: 2 },
    { stageKey: 'acabados', label: 'Acabados', sortOrder: 3 },
  ],
  units: [
    { code: 'und', label: 'Unidad (und)', sortOrder: 0 },
    { code: 'plancha', label: 'Plancha', sortOrder: 1 },
    { code: 'm', label: 'Metro (m)', sortOrder: 2 },
    { code: 'm2', label: 'Metro cuadrado (m²)', sortOrder: 3 },
    { code: 'kg', label: 'Kilogramo (kg)', sortOrder: 4 },
    { code: 'lt', label: 'Litro (lt)', sortOrder: 5 },
  ],
  numbering: [
    { seriesKey: 'FURNITURE', prefix: 'MUE', includeYear: false },
    { seriesKey: 'WORK_ORDER', prefix: 'OT', includeYear: true },
    { seriesKey: 'QUOTATION', prefix: 'COT', includeYear: true },
    { seriesKey: 'PURCHASE_ORDER', prefix: 'OC', includeYear: true },
    { seriesKey: 'ORDER', prefix: 'PED', includeYear: true },
    { seriesKey: 'DELIVERY', prefix: 'ENT', includeYear: true },
  ],
} as const;
