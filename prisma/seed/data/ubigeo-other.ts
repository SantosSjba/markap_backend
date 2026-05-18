/** Debe coincidir con src/common/constants/ubigeo-other.constants.ts */
export const UBIGEO_OTHER_DEPARTMENT_ID = '99';
export const UBIGEO_OTHER_PROVINCE_ID = '9999';
export const UBIGEO_OTHER_DISTRICT_ID = '999999';
export const UBIGEO_OTHER_LABEL = 'Otros';

export const UBIGEO_OTHER_SEED = {
  department: { id: UBIGEO_OTHER_DEPARTMENT_ID, name: UBIGEO_OTHER_LABEL },
  province: {
    id: UBIGEO_OTHER_PROVINCE_ID,
    departmentId: UBIGEO_OTHER_DEPARTMENT_ID,
    name: UBIGEO_OTHER_LABEL,
  },
  district: {
    id: UBIGEO_OTHER_DISTRICT_ID,
    provinceId: UBIGEO_OTHER_PROVINCE_ID,
    name: UBIGEO_OTHER_LABEL,
  },
} as const;
