import type {
  InteriorProjectRepository,
  InteriorProjectStatsRow,
} from '../../../domain/repositories/interior-project.repository';
import { GetInteriorProjectStatsUseCase } from './get-interior-project-stats.use-case';

function useCaseWith(rows: InteriorProjectStatsRow[], now: Date) {
  const repo = {
    findStatsRows: jest.fn().mockResolvedValue(rows),
  } as unknown as InteriorProjectRepository;
  return new GetInteriorProjectStatsUseCase(repo, () => now);
}

describe('GetInteriorProjectStatsUseCase', () => {
  const now = new Date('2026-10-27T15:00:00Z');
  const row = (
    status: string,
    currency: string,
    estimatedBudget: number | null,
    createdAt = '2026-01-10T12:00:00Z',
  ): InteriorProjectStatsRow => ({
    status,
    currency,
    estimatedBudget,
    createdAt: new Date(createdAt),
  });

  it('cuenta por etapa y los creados en el mes actual', async () => {
    const stats = await useCaseWith(
      [
        row('DESIGN', 'PEN', 1000, '2026-10-02T12:00:00Z'),
        row('IN_PROGRESS', 'PEN', 500),
        row('FINISHED', 'PEN', 900),
        row('CANCELLED', 'USD', 300, '2026-10-20T12:00:00Z'),
      ],
      now,
    ).execute('interiorismo');

    expect(stats.total).toBe(4);
    expect(stats.byStatus).toEqual({
      DESIGN: 1,
      QUOTE: 0,
      APPROVED: 0,
      IN_PROGRESS: 1,
      FINISHED: 1,
      CANCELLED: 1,
    });
    expect(stats.createdThisMonth).toBe(2);
  });

  it('suma la cartera activa por moneda sin mezclar ni contar finalizados/cancelados', async () => {
    const stats = await useCaseWith(
      [
        row('QUOTE', 'USD', 100),
        row('APPROVED', 'PEN', 50),
        row('IN_PROGRESS', 'USD', 150),
        row('DESIGN', 'EUR', null),
        row('FINISHED', 'PEN', 9999),
        row('CANCELLED', 'USD', 9999),
      ],
      now,
    ).execute('interiorismo');

    expect(stats.activeBudgetByCurrency).toEqual([
      { currency: 'USD', amount: 250 },
      { currency: 'PEN', amount: 50 },
    ]);
  });
});
