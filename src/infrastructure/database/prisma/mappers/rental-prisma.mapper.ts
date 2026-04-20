import { Rental, RentalListItem } from '@domain/entities/rental.entity';

export class RentalPrismaMapper {
  static toListItem(r: {
    id: string;
    startDate: Date;
    property: { id: string; addressLine: string; code: string; owner: { id: string; fullName: string } };
    tenant: { id: string; fullName: string };
    endDate: Date;
    currency: string;
    monthlyAmount: number | { toNumber?: () => number };
    securityDeposit: number | { toNumber?: () => number } | null;
    status: string;
    attachments?: unknown[];
  }): RentalListItem {
    const year =
      r.startDate instanceof Date
        ? r.startDate.getFullYear()
        : new Date(r.startDate).getFullYear();
    const shortId = String(r.id).replace(/-/g, '').slice(-6).toUpperCase();
    const n = (v: number | { toNumber?: () => number } | null | undefined): number | null => {
      if (v == null) return null;
      return typeof v === 'number' ? v : v.toNumber?.() ?? Number(v);
    };
    return new RentalListItem(
      r.id,
      `ALQ-${year}-${shortId}`,
      r.property.id,
      r.property.addressLine,
      r.property.code,
      r.tenant.id,
      r.tenant.fullName,
      r.property.owner.id,
      r.property.owner.fullName,
      r.startDate,
      r.endDate,
      r.currency,
      n(r.monthlyAmount) ?? 0,
      n(r.securityDeposit),
      r.status,
      Array.isArray(r.attachments) && r.attachments.length > 0,
    );
  }

  static toDomain(r: {
    id: string;
    applicationId: string;
    propertyId: string;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    currency: string;
    monthlyAmount: number | { toNumber?: () => number };
    securityDeposit: number | { toNumber?: () => number } | null;
    paymentDueDay: number;
    notes: string | null;
    status: string;
    enableAlerts: boolean;
  }): Rental {
    const n = (v: number | { toNumber?: () => number } | null | undefined): number | null => {
      if (v == null) return null;
      return typeof v === 'number' ? v : v.toNumber?.() ?? Number(v);
    };
    return new Rental(
      r.id,
      r.applicationId,
      r.propertyId,
      r.tenantId,
      r.startDate,
      r.endDate,
      r.currency,
      n(r.monthlyAmount) ?? 0,
      n(r.securityDeposit),
      r.paymentDueDay,
      r.notes,
      r.status,
      r.enableAlerts,
    );
  }
}
