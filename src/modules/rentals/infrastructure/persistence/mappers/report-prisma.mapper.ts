import {
  ContractExpiringItem,
  PropertyWithoutContractItem,
} from '../../../domain/entities/report.entity';
import { legacyRentalCode } from '../../../domain/utils/rental-code.util';

export class ReportPrismaMapper {
  static toContractExpiringItem(
    r: {
      id: string;
      code: string | null;
      startDate: Date;
      endDate: Date;
      currency: string;
      monthlyAmount: number;
      tenant: { fullName: string };
      property: {
        addressLine: string;
        owner: { fullName: string };
      };
    },
    today: Date,
  ): ContractExpiringItem {
    const endDate = new Date(r.endDate);
    const daysLeft = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return new ContractExpiringItem(
      r.id,
      r.code ?? legacyRentalCode(r.id, r.startDate),
      r.tenant.fullName,
      r.property.addressLine,
      r.property.owner.fullName,
      r.endDate,
      daysLeft,
      r.startDate,
      r.currency,
      r.monthlyAmount,
    );
  }

  static toPropertyWithoutContractItem(
    p: {
      id: string;
      code: string;
      addressLine: string;
      monthlyRent: number | null;
      rentCurrency: string;
      listingStatus: string | null;
      owner: { fullName: string };
      propertyType: { name: string };
      district: { name: string } | null;
    },
    lastContractEndDate: Date | null,
  ): PropertyWithoutContractItem {
    return new PropertyWithoutContractItem(
      p.id,
      p.code,
      p.addressLine,
      p.owner.fullName,
      p.propertyType.name,
      p.district?.name ?? null,
      p.monthlyRent,
      p.rentCurrency,
      p.listingStatus,
      lastContractEndDate,
    );
  }
}
