import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma/prisma.service';
import { PeriodTransactionPort } from '../../application/ports/period-transaction.port';
@Injectable()
export class PeriodTransactionAdapter extends PeriodTransactionPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  withLockedPeriod<T>(id: string, work: () => Promise<T>): Promise<T> {
    return this.prisma.atomic(async () => {
      await this.prisma
        .$queryRaw`SELECT id FROM contabilidad_periods WHERE id = ${id} FOR UPDATE`;
      return work();
    });
  }
}
