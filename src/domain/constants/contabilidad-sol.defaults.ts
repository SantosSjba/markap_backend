export const CONTABILIDAD_SOL_DECLARATION_TYPE = {
  PDT_621: 'PDT_621',
  PLAME: 'PLAME',
} as const;

export const CONTABILIDAD_SOL_DECLARATION_STATUS = {
  PREPARED: 'PREPARED',
  MANUAL_PENDING: 'MANUAL_PENDING',
  SUBMITTED: 'SUBMITTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export const CONTABILIDAD_SOL_DECLARATION_TYPE_LABELS: Record<string, string> = {
  PDT_621: 'PDT 621 — IGV mensual',
  PLAME: 'PLAME — Planilla',
};

export const CONTABILIDAD_SOL_DECLARATION_STATUS_LABELS: Record<string, string> = {
  PREPARED: 'Paquete preparado',
  MANUAL_PENDING: 'Pendiente carga manual SOL',
  SUBMITTED: 'Enviado',
  ACCEPTED: 'Aceptado SUNAT',
  REJECTED: 'Rechazado',
};

export const CONTABILIDAD_SOL_MOCK_ACCEPT_CODE = '0';
export const CONTABILIDAD_SOL_MOCK_ACCEPT_MESSAGE =
  'Declaración registrada en simulador MARKAP (sandbox SOL)';

export const CONTABILIDAD_SOL_MANUAL_INSTRUCTIONS = [
  'Ingrese a SUNAT Operaciones en Línea (SOL) con RUC y clave.',
  'Menú: Declaraciones y Pagos → Presentación de declaraciones.',
  'Seleccione PDT 621 del periodo correspondiente.',
  'Use el archivo JSON exportado desde MARKAP como referencia de montos.',
  'Confirme y guarde el número de constancia en MARKAP.',
];
