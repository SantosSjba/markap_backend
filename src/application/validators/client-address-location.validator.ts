import { BadRequestException } from '@nestjs/common';
import {
  isUbigeoOtherDistrictId,
  type LocationCustomPayload,
} from '@common/constants/ubigeo-other.constants';

export function parseLocationCustom(value: unknown): LocationCustomPayload | null {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  const country = typeof o.country === 'string' ? o.country.trim() : '';
  const department = typeof o.department === 'string' ? o.department.trim() : '';
  const province = typeof o.province === 'string' ? o.province.trim() : '';
  const district = typeof o.district === 'string' ? o.district.trim() : '';
  if (!country && !department && !province && !district) return null;
  return { country, department, province, district };
}

export function assertClientAddressLocation(
  districtId: string,
  locationCustom: unknown,
): LocationCustomPayload | null {
  const parsed = parseLocationCustom(locationCustom);
  if (isUbigeoOtherDistrictId(districtId)) {
    if (!parsed?.country || !parsed.department || !parsed.province || !parsed.district) {
      throw new BadRequestException(
        'Para ubicación "Otros" indique país, departamento/estado, provincia y distrito',
      );
    }
    return parsed;
  }
  if (parsed) {
    throw new BadRequestException(
      'locationCustom solo aplica cuando el distrito es "Otros"',
    );
  }
  return null;
}
