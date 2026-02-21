import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type {
  RentalRepository,
  RentalData,
  CreateRentalData,
} from '@application/repositories/rental.repository';

@Injectable()
export class RentalPrismaRepository implements RentalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRentalData): Promise<RentalData> {
    const rental = await (this.prisma as any).rental.create({
      data: {
        applicationId: data.applicationId,
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        startDate: data.startDate,
        endDate: data.endDate,
        currency: data.currency,
        monthlyAmount: data.monthlyAmount,
        securityDeposit: data.securityDeposit ?? null,
        paymentDueDay: data.paymentDueDay,
        notes: data.notes?.trim() || null,
      },
    });
    return this.toRentalData(rental);
  }

  private toRentalData(r: {
    id: string;
    applicationId: string;
    propertyId: string;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    currency: string;
    monthlyAmount: number;
    securityDeposit: number | null;
    paymentDueDay: number;
    notes: string | null;
    status: string;
  }): RentalData {
    return {
      id: r.id,
      applicationId: r.applicationId,
      propertyId: r.propertyId,
      tenantId: r.tenantId,
      startDate: r.startDate,
      endDate: r.endDate,
      currency: r.currency,
      monthlyAmount: r.monthlyAmount,
      securityDeposit: r.securityDeposit,
      paymentDueDay: r.paymentDueDay,
      notes: r.notes,
      status: r.status,
    };
  }
}
