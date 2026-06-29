export const CONTABILIDAD_TAXES_APP_SLUG = 'contabilidad';

export const CONTABILIDAD_DETRACTION_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
} as const;

export const CONTABILIDAD_RETENTION_TYPE = {
  IGV: 'IGV',
  RENTA: 'RENTA',
} as const;

export const CONTABILIDAD_PERCEPTION_TYPE = {
  IGV: 'IGV',
} as const;

export const CONTABILIDAD_TAX_RECORD_STATUS = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const;

export const CONTABILIDAD_IGV_ACCOUNT_CODE = '4011';
export const CONTABILIDAD_DETRACTION_ACCOUNT_CODE = '4018';
export const CONTABILIDAD_RETENTION_ACCOUNT_CODE = '4017';
export const CONTABILIDAD_PAYABLE_ACCOUNT_CODE = '421';

export const CONTABILIDAD_DETRACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
};

export const CONTABILIDAD_RETENTION_TYPE_LABELS: Record<string, string> = {
  IGV: 'Retención IGV',
  RENTA: 'Retención renta',
};

export const CONTABILIDAD_PERCEPTION_TYPE_LABELS: Record<string, string> = {
  IGV: 'Percepción IGV',
};

/** Tasas SPOT SUNAT frecuentes (referencia). */
export const CONTABILIDAD_DEFAULT_DETRACTION_RATES: {
  sunatCode: string;
  description: string;
  ratePercent: number;
  minAmount: number;
}[] = [
  { sunatCode: '001', description: 'Azúcar y melaza de caña', ratePercent: 10, minAmount: 700 },
  { sunatCode: '010', description: 'Maquinaria y equipos de industrias', ratePercent: 1.5, minAmount: 700 },
  { sunatCode: '014', description: 'Carnes y despojos comestibles', ratePercent: 4, minAmount: 700 },
  { sunatCode: '017', description: 'Maquinaria y equipos para construcción', ratePercent: 1.5, minAmount: 700 },
  { sunatCode: '019', description: 'Arrendamiento de bienes muebles', ratePercent: 2, minAmount: 700 },
  { sunatCode: '020', description: 'Mantenimiento y reparación de bienes muebles', ratePercent: 12, minAmount: 700 },
  { sunatCode: '022', description: 'Otros servicios empresariales', ratePercent: 12, minAmount: 700 },
  { sunatCode: '023', description: 'Transporte de carga', ratePercent: 4, minAmount: 700 },
  { sunatCode: '030', description: 'Contratos de construcción', ratePercent: 4, minAmount: 700 },
  { sunatCode: '037', description: 'Demás servicios gravados con el IGV', ratePercent: 12, minAmount: 700 },
];

/** Tasas retención IGV agente (referencia). */
export const CONTABILIDAD_DEFAULT_RETENTION_RATES = {
  IGV: 3,
  RENTA: 1.5,
} as const;

/** Tasa percepción IGV agente (referencia SUNAT). */
export const CONTABILIDAD_DEFAULT_PERCEPTION_RATE = 2;

/** Tasa corporativa referencial Perú (régimen general). */
export const CONTABILIDAD_DEFAULT_INCOME_TAX_RATE_PERCENT = 29.5;
export const CONTABILIDAD_RENTA_ACCOUNT_CODE = '4012';
