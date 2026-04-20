import { ContractExpiringItem, PropertyWithoutContractItem } from '@domain/entities/report.entity';

export class ReportPrismaMapper {
  static toContractExpiringItem(
    r: {
      id: string;
      endDate: Date;
      tenant: { fullName: string };
      property: {
        addressLine: string;
        owner: { fullName: string };
      };
    },
    today: Date,
  ): ContractExpiringItem {
    const endDate = new Date(r.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const year = endDate.getFullYear();
    const shortId = String(r.id).replace(/-/g, '').slice(-6).toUpperCase();
    return new ContractExpiringItem(
      r.id,
      `ALQ-${year}-${shortId}`,
      r.tenant.fullName,
      r.property.addressLine,
      r.property.owner.fullName,
      r.endDate,
      daysLeft,
    );
  }

  static toPropertyWithoutContractItem(p: {
    id: string;
    code: string;
    addressLine: string;
    owner: { fullName: string };
  }): PropertyWithoutContractItem {
    return new PropertyWithoutContractItem(p.id, p.code, p.addressLine, p.owner.fullName);
  }
}
