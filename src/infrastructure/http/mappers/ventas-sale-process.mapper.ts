import { prismaAmountToNumber } from '@infrastructure/database/prisma/mappers/ventas-sales-prisma.mapper';

type BuyerLink = {
  isPrimary: boolean;
  buyer: {
    id: string;
    fullName: string;
    documentNumber: string;
    primaryPhone: string;
    primaryEmail: string | null;
    clientType: string;
    documentType?: { name: string } | null;
  };
};

type OwnerLink = {
  owner: {
    id: string;
    fullName: string;
    documentNumber: string;
    primaryPhone: string;
    primaryEmail: string | null;
    clientType: string;
    documentType?: { name: string } | null;
  };
};

/** Normaliza detalle de proceso para la API (participantes planos, montos numéricos). */
export function mapSaleProcessDetail(row: Record<string, unknown>): Record<string, unknown> {
  const property = row.property as Record<string, unknown> | null;
  const financingChannel = row.financingChannel as Record<string, unknown> | null;

  const buyersRaw = (row.buyers as BuyerLink[] | undefined) ?? [];
  const ownersRaw = (row.owners as OwnerLink[] | undefined) ?? [];

  const buyers = buyersRaw.map((l) => ({
    id: l.buyer.id,
    fullName: l.buyer.fullName,
    documentNumber: l.buyer.documentNumber,
    documentTypeName: l.buyer.documentType?.name ?? null,
    primaryPhone: l.buyer.primaryPhone,
    primaryEmail: l.buyer.primaryEmail,
    clientType: l.buyer.clientType,
    isPrimary: l.isPrimary,
  }));

  const owners = ownersRaw.map((l) => ({
    id: l.owner.id,
    fullName: l.owner.fullName,
    documentNumber: l.owner.documentNumber,
    documentTypeName: l.owner.documentType?.name ?? null,
    primaryPhone: l.owner.primaryPhone,
    primaryEmail: l.owner.primaryEmail,
    clientType: l.owner.clientType,
  }));

  const district = property?.district as
    | {
        name: string;
        province?: { name: string; department?: { name: string } };
      }
    | null
    | undefined;

  const locationParts = district
    ? [
        district.name,
        district.province?.name,
        district.province?.department?.name,
      ].filter(Boolean)
    : [];

  return {
    ...row,
    buyer: buyers.find((b) => b.isPrimary) ?? buyers[0] ?? row.buyer,
    buyers,
    owners,
    financingChannel: financingChannel
      ? {
          id: financingChannel.id,
          code: financingChannel.code,
          name: financingChannel.name,
          category: financingChannel.category,
        }
      : null,
    property: property
      ? {
          ...property,
          salePrice: prismaAmountToNumber(property.salePrice as unknown),
          propertyTypeName:
            (property.propertyType as { name?: string } | null | undefined)?.name ?? null,
          locationLabel: locationParts.length ? locationParts.join(', ') : null,
        }
      : property,
  };
}
