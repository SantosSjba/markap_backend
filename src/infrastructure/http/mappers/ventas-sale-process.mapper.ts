import { prismaAmountToNumber } from '@infrastructure/database/prisma/mappers/ventas-sales-prisma.mapper';
import { mapCommissionEnrichment } from '@common/utils/sale-commission.util';

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

type OwnerClientShape = OwnerLink['owner'];

type PropertyOwnerLinkRow = {
  isPrimary?: boolean;
  owner: OwnerClientShape;
};

function mapParticipantClient(client: OwnerClientShape, isPrimary?: boolean) {
  return {
    id: client.id,
    fullName: client.fullName,
    documentNumber: client.documentNumber,
    documentTypeName: client.documentType?.name ?? null,
    primaryPhone: client.primaryPhone,
    primaryEmail: client.primaryEmail,
    clientType: client.clientType,
    ...(isPrimary !== undefined ? { isPrimary } : {}),
  };
}

function ownersFromPropertyRecord(property: Record<string, unknown>): ReturnType<typeof mapParticipantClient>[] {
  const seen = new Set<string>();
  const out: ReturnType<typeof mapParticipantClient>[] = [];

  const push = (client: OwnerClientShape | null | undefined) => {
    if (!client?.id || seen.has(client.id)) return;
    seen.add(client.id);
    out.push(mapParticipantClient(client));
  };

  push(property.owner as OwnerClientShape | null | undefined);

  const links = (property.owners as PropertyOwnerLinkRow[] | undefined) ?? [];
  for (const link of links) {
    push(link.owner);
  }

  return out;
}

function mapCommissionRow(c: Record<string, unknown>) {
  const amount = prismaAmountToNumber(c.amount);
  const deductiblesRaw = (c.deductibles as Record<string, unknown>[] | undefined) ?? [];
  const paymentPartsRaw = (c.paymentParts as Record<string, unknown>[] | undefined) ?? [];
  const deductibles = deductiblesRaw.map((d) => ({
    id: d.id,
    deductibleType: d.deductibleType,
    description: d.description ?? null,
    amount: prismaAmountToNumber(d.amount),
  }));
  const paymentParts = paymentPartsRaw.map((p) => ({
    id: p.id,
    partNumber: p.partNumber,
    label: p.label ?? null,
    amount: prismaAmountToNumber(p.amount),
    dueDate: p.dueDate ?? null,
    status: p.status,
    paidAt: p.paidAt ?? null,
  }));
  const enrichment = mapCommissionEnrichment({
    amount,
    deductibles,
    paymentParts,
  });
  return {
    id: c.id,
    amount,
    ...enrichment,
    calculationType: c.calculationType as string,
    percentApplied:
      c.percentApplied != null ? Number(c.percentApplied) : null,
    status: c.status,
    paidAt: c.paidAt,
    saleClosingId: c.saleClosingId ?? null,
    agent: c.agent as { id: string; fullName: string; type?: string },
    deductibles,
    paymentParts,
  };
}

/** Normaliza detalle de proceso para la API (participantes planos, montos numéricos). */
export function mapSaleProcessDetail(row: Record<string, unknown>): Record<string, unknown> {
  const property = row.property as Record<string, unknown> | null;
  const financingChannel = row.financingChannel as Record<string, unknown> | null;

  const buyersRaw = (row.buyers as BuyerLink[] | undefined) ?? [];
  const ownersRaw = (row.owners as OwnerLink[] | undefined) ?? [];
  const commissionsRaw =
    (row.commissions as Record<string, unknown>[] | undefined) ??
    (row.commission ? [row.commission as Record<string, unknown>] : []);

  const buyers = buyersRaw.map((l) => ({
    ...mapParticipantClient(l.buyer),
    isPrimary: l.isPrimary,
  }));

  let owners = ownersRaw.map((l) => mapParticipantClient(l.owner));

  if (!owners.length && property) {
    owners = ownersFromPropertyRecord(property);
  }

  const commissions = commissionsRaw.map(mapCommissionRow);

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

  const primaryOwner = owners[0] ?? null;

  return {
    ...row,
    buyer: buyers.find((b) => b.isPrimary) ?? buyers[0] ?? row.buyer,
    buyers,
    owners,
    commissions,
    commission: commissions[0] ?? null,
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
          primaryOwner,
        }
      : property,
  };
}
