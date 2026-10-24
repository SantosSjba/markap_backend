import { ContabilidadTreasuryPrismaRepository } from './contabilidad-treasury-prisma.repository';
import type { PrismaService } from '../prisma.service';
import type { ContabilidadJournalRepository } from '@domain/repositories/contabilidad-journal.repository';

describe('Conciliación bancaria: aislamiento de periodos', () => {
  it('rechaza movimientos de otro periodo sin modificarlos', async () => {
    const update = jest.fn();
    const prisma = {
      contabilidadBankReconciliation: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'reconciliation',
          applicationId: 'app',
          bankAccountId: 'bank',
          periodId: 'october',
          status: 'OPEN',
        }),
      },
      contabilidadTreasuryMovement: {
        findFirst: jest
          .fn()
          .mockImplementation((query: { where: { periodId?: string } }) =>
            Promise.resolve(
              query.where.periodId === 'october'
                ? null
                : {
                    id: 'movement',
                    periodId: 'september',
                  },
            ),
          ),
        update,
      },
    };
    const repo = new ContabilidadTreasuryPrismaRepository(
      prisma as unknown as PrismaService,
      {} as ContabilidadJournalRepository,
    );
    await expect(
      repo.toggleMovementReconciled('app', 'reconciliation', 'movement', true),
    ).rejects.toThrow('Movimiento no encontrado.');
    expect(update).not.toHaveBeenCalled();
  });
});
