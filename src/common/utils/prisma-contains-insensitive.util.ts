/** Partial match, case-insensitive (PostgreSQL via Prisma). */
export function containsI(value: string): { contains: string; mode: 'insensitive' } {
  return { contains: value.trim(), mode: 'insensitive' };
}
