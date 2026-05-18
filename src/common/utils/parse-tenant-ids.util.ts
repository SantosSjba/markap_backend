/** Normaliza inquilinos desde multipart (array, JSON o tenantId legacy). */
export function parseTenantIds(value: unknown, legacyTenantId?: string): string[] {
  let ids: string[] = [];

  if (Array.isArray(value)) {
    ids = value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  } else if (typeof value === 'string' && value.trim()) {
    const raw = value.trim();
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          ids = parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
        }
      } catch {
        ids = [raw];
      }
    } else if (raw.includes(',')) {
      ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      ids = [raw];
    }
  }

  if (ids.length === 0 && legacyTenantId?.trim()) {
    ids = [legacyTenantId.trim()];
  }

  return [...new Set(ids)];
}
