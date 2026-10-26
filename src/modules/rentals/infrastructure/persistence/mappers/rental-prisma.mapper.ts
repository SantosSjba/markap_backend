import { legacyRentalCode } from '../../../domain/utils/rental-code.util';
import { Rental, RentalListItem } from '../../../domain/entities/rental.entity';

export class RentalPrismaMapper {
  static toListItem(r: {
    id: string;
    code: string | null;
    startDate: Date;
    property: {
      id: string;
      addressLine: string;
      code: string;
      owner: { id: string; fullName: string };
    };
    tenant: { id: string; fullName: string };
    tenants?: { client: { id: string; fullName: string } }[];
    endDate: Date;
    currency: string;
    monthlyAmount: number | { toNumber?: () => number };
    securityDeposit: number | { toNumber?: () => number } | null;
    status: string;
    attachments?: unknown[];
  }): RentalListItem {
    const n = (
      v: number | { toNumber?: () => number } | null | undefined,
    ): number | null => {
      if (v == null) return null;
      return typeof v === 'number' ? v : (v.toNumber?.() ?? Number(v));
    };
    const tenantClients = r.tenants?.length
      ? r.tenants.map((rt) => rt.client)
      : [r.tenant];
    const primary = tenantClients[0] ?? r.tenant;
    const tenantName = tenantClients.map((t) => t.fullName).join(', ');

    return new RentalListItem(
      r.id,
      r.code ?? legacyRentalCode(r.id, r.startDate),
      r.property.id,
      r.property.addressLine,
      r.property.code,
      primary.id,
      tenantName,
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
    enableExpirationAlerts: boolean;
    enableCollectionAlerts: boolean;
  }): Rental {
    const n = (
      v: number | { toNumber?: () => number } | null | undefined,
    ): number | null => {
      if (v == null) return null;
      return typeof v === 'number' ? v : (v.toNumber?.() ?? Number(v));
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
      r.enableExpirationAlerts,
      r.enableCollectionAlerts,
    );
  }
}
