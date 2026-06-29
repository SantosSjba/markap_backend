import { isValidPeruvianRuc, normalizeRuc } from '@common/utils/ruc-validator';
import type { ContabilidadPleValidationIssue } from '@domain/repositories/contabilidad-ple.repository';

export const PLE_FIELD_LIMITS = {
  RUC: 11,
  SERIES: 20,
  NUMBER: 20,
  BUSINESS_NAME: 100,
  ACCOUNT_CODE: 10,
  DESCRIPTION: 200,
} as const;

export function pleValidateRuc(
  ruc: string | null | undefined,
  bookCode: string,
  context: string,
  lineNumber?: number,
  linePreview?: string,
): ContabilidadPleValidationIssue | null {
  const normalized = normalizeRuc(ruc ?? '');
  if (!normalized) {
    return {
      severity: 'error',
      bookCode,
      code: 'MISSING_RUC',
      message: `RUC obligatorio (${context})`,
      context,
      lineNumber,
      linePreview,
    };
  }
  if (normalized.length !== PLE_FIELD_LIMITS.RUC) {
    return {
      severity: 'error',
      bookCode,
      code: 'RUC_LENGTH',
      message: `RUC debe tener 11 dígitos (${context}): ${normalized}`,
      context,
      lineNumber,
      linePreview,
    };
  }
  if (!isValidPeruvianRuc(normalized)) {
    return {
      severity: 'error',
      bookCode,
      code: 'RUC_CHECKSUM',
      message: `RUC inválido (dígito verificador) en ${context}: ${normalized}`,
      context,
      lineNumber,
      linePreview,
    };
  }
  return null;
}

export function pleValidateFieldLength(
  value: string | null | undefined,
  maxLen: number,
  fieldLabel: string,
  bookCode: string,
  context: string,
  lineNumber?: number,
  linePreview?: string,
): ContabilidadPleValidationIssue | null {
  const text = (value ?? '').trim();
  if (text.length > maxLen) {
    return {
      severity: 'error',
      bookCode,
      code: 'FIELD_TOO_LONG',
      message: `${fieldLabel} excede ${maxLen} caracteres (${context})`,
      context,
      lineNumber,
      linePreview,
    };
  }
  return null;
}

export function pleValidateIsoDate(
  isoDate: string,
  bookCode: string,
  context: string,
  lineNumber?: number,
  linePreview?: string,
): ContabilidadPleValidationIssue | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return {
      severity: 'error',
      bookCode,
      code: 'INVALID_DATE',
      message: `Fecha inválida en ${context}: ${isoDate}`,
      context,
      lineNumber,
      linePreview,
    };
  }
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return {
      severity: 'error',
      bookCode,
      code: 'INVALID_DATE',
      message: `Fecha no parseable en ${context}: ${isoDate}`,
      context,
      lineNumber,
      linePreview,
    };
  }
  return null;
}

export function pleValidateCorrelativo(
  series: string,
  number: string,
  bookCode: string,
  context: string,
  lineNumber?: number,
  linePreview?: string,
): ContabilidadPleValidationIssue[] {
  const issues: ContabilidadPleValidationIssue[] = [];
  if (!series.trim() || !number.trim()) {
    issues.push({
      severity: 'error',
      bookCode,
      code: 'MISSING_CORRELATIVO',
      message: `Serie o número vacío (${context})`,
      context,
      lineNumber,
      linePreview,
    });
  }
  const seriesIssue = pleValidateFieldLength(
    series,
    PLE_FIELD_LIMITS.SERIES,
    'Serie',
    bookCode,
    context,
    lineNumber,
    linePreview,
  );
  if (seriesIssue) issues.push(seriesIssue);
  const numberIssue = pleValidateFieldLength(
    number,
    PLE_FIELD_LIMITS.NUMBER,
    'Número',
    bookCode,
    context,
    lineNumber,
    linePreview,
  );
  if (numberIssue) issues.push(numberIssue);
  return issues;
}

export function pushIssue(
  issues: ContabilidadPleValidationIssue[],
  issue: ContabilidadPleValidationIssue | null,
) {
  if (issue) issues.push(issue);
}
