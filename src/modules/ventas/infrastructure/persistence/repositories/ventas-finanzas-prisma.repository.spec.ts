import type { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import { VentasFinanzasPrismaRepository } from './ventas-finanzas-prisma.repository';

describe('Pago de comisiones sin cuotas', () => {
  it('marca como pagada una comisión que no tiene partes de pago', async () => {
    const update = jest.fn().mockResolvedValue({});
    const tx = {
      saleCommissionPaymentPart: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      saleCommission: { update },
    };
    const prisma = {
      saleCommission: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'commission',
          status: 'PENDING',
          amount: 1000,
        }),
      },
      $transaction: (callback: (client: typeof tx) => Promise<void>) =>
        callback(tx),
    };
    const repo = new VentasFinanzasPrismaRepository(
      prisma as unknown as PrismaService,
    );
    const paidAt = new Date('2026-10-24T12:00:00Z');
    await repo.markCommissionPaid('commission', 'app', paidAt);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'commission' },
      data: { status: 'PAID', paidAt },
    });
  });
});
