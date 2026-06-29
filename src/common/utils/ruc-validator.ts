const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/** Valida RUC peruano de 11 dígitos (persona jurídica / empresa). */
export function isValidPeruvianRuc(ruc: string): boolean {
  const normalized = ruc.replace(/\D/g, '');
  if (!/^\d{11}$/.test(normalized)) return false;

  const prefix = normalized.slice(0, 2);
  if (prefix !== '10' && prefix !== '15' && prefix !== '17' && prefix !== '20') {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(normalized[i]) * RUC_WEIGHTS[i]!;
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 1 : 11 - remainder;
  return checkDigit === Number(normalized[10]);
}

export function normalizeRuc(ruc: string): string {
  return ruc.replace(/\D/g, '');
}
