export type AccessLevel = 'READ' | 'WRITE' | 'ADMIN';
export const ACCESS_LEVEL_RANK = { READ: 1, WRITE: 2, ADMIN: 3 };
export function levelAllows(
  granted: AccessLevel | null | undefined,
  required: AccessLevel,
): boolean {
  return !!granted && ACCESS_LEVEL_RANK[granted] >= ACCESS_LEVEL_RANK[required];
}
