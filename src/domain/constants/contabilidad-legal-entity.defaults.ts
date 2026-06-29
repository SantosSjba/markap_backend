import { CONTABILIDAD_DEFAULT_COMPANY } from './contabilidad-config.defaults';

export const CONTABILIDAD_DEMO_LEGAL_ENTITIES = [
  {
    code: 'MAIN',
    ...CONTABILIDAD_DEFAULT_COMPANY,
    isDefault: true,
  },
  {
    code: 'HOLDING',
    ruc: '20609998877',
    legalName: 'MARKAP HOLDING S.A.C.',
    tradeName: 'MARKAP Holding',
    fiscalAddress: 'Av. Holding 456, San Isidro',
    district: 'San Isidro',
    province: 'Lima',
    department: 'Lima',
    ubigeoCode: '150131',
    isDefault: false,
  },
] as const;
