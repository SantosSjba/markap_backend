/** Ubigeo sintético para direcciones fuera de Perú o sin código oficial. */
export const UBIGEO_OTHER_DEPARTMENT_ID = '99';
export const UBIGEO_OTHER_PROVINCE_ID = '9999';
export const UBIGEO_OTHER_DISTRICT_ID = '999999';

export const UBIGEO_OTHER_LABEL = 'Otros';

export interface LocationCustomPayload {
  country: string;
  department: string;
  province: string;
  district: string;
}

export function isUbigeoOtherDistrictId(districtId: string | undefined | null): boolean {
  return districtId === UBIGEO_OTHER_DISTRICT_ID;
}
