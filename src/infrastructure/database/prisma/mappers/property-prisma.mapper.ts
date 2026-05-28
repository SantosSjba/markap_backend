import { Prisma } from '@prisma/client';
import type {
  PropertyDistrict,
  PropertyLocationCustom,
  PropertyMediaItem,
  PropertyOwnerSummary,
} from '@domain/entities/property.entity';
import { Property } from '@domain/entities/property.entity';
import { parseLocationCustom } from '@application/validators/client-address-location.validator';

export class PropertyPrismaMapper {
  static parseMediaItems(raw: Prisma.JsonValue | null | undefined): PropertyMediaItem[] | null {
    if (raw == null) return null;
    if (!Array.isArray(raw)) return null;
    const out: PropertyMediaItem[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const o = item as Record<string, unknown>;
      const url = typeof o.url === 'string' ? o.url.trim() : '';
      const kind = o.kind === 'plan' ? 'plan' : o.kind === 'photo' ? 'photo' : null;
      if (!url || !kind) continue;
      out.push({ url, kind });
    }
    return out.length ? out : null;
  }

  static locationToJson(
    value: PropertyLocationCustom | null | undefined,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    if (value === undefined) return undefined;
    if (value === null) return Prisma.JsonNull;
    return value as Prisma.InputJsonValue;
  }

  static mediaToJson(
    items: PropertyMediaItem[] | null | undefined,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (items == null) return Prisma.JsonNull;
    const cleaned = items
      .map((m) => ({
        url: typeof m.url === 'string' ? m.url.trim() : '',
        kind: m.kind === 'plan' ? 'plan' : 'photo',
      }))
      .filter((m) => m.url.length > 0);
    return cleaned.length ? (cleaned as Prisma.InputJsonValue) : Prisma.JsonNull;
  }

  static mapOwners(
    rows:
      | {
          isPrimary: boolean;
          owner: { id: string; fullName: string; documentNumber: string };
        }[]
      | undefined,
  ): PropertyOwnerSummary[] {
    if (!rows?.length) return [];
    return rows.map((r) => ({
      id: r.owner.id,
      fullName: r.owner.fullName,
      documentNumber: r.owner.documentNumber,
      isPrimary: r.isPrimary,
    }));
  }

  static toDomain(property: {
    id: string;
    applicationId: string;
    code: string;
    propertyTypeId: string;
    addressLine: string;
    districtId: string;
    district: Prisma.PropertyGetPayload<{
      include: {
        district: {
          include: { province: { include: { department: true } } };
        };
      };
    }>['district'];
    locationCustom: Prisma.JsonValue | null;
    description: string | null;
    area: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    ageYears: number | null;
    floorLevel: string | null;
    parkingSpaces: number | null;
    partida1: string | null;
    partida2: string | null;
    partida3: string | null;
    ownerId: string;
    monthlyRent: number | null;
    maintenanceAmount: number | null;
    depositMonths: number | null;
    salePrice: number | null;
    saleCurrency: string | null;
    projectName: string | null;
    mediaItems: Prisma.JsonValue | null;
    listingStatus: string | null;
    isActive: boolean;
    owner?: { id: string; fullName: string; documentNumber: string };
    owners?: {
      isPrimary: boolean;
      owner: { id: string; fullName: string; documentNumber: string };
    }[];
  }): Property {
    const district: PropertyDistrict = property.district
      ? {
          id: property.district.id,
          name: property.district.name,
          province: {
            id: property.district.province.id,
            name: property.district.province.name,
            department: {
              id: property.district.province.department.id,
              name: property.district.province.department.name,
            },
          },
        }
      : null;

    const mappedOwners = PropertyPrismaMapper.mapOwners(property.owners);
    const owners =
      mappedOwners.length > 0
        ? mappedOwners
        : property.owner
          ? [
              {
                id: property.owner.id,
                fullName: property.owner.fullName,
                documentNumber: property.owner.documentNumber,
                isPrimary: true,
              },
            ]
          : [];

    return new Property(
      property.id,
      property.applicationId,
      property.code,
      property.propertyTypeId,
      property.addressLine,
      property.districtId,
      district,
      parseLocationCustom(property.locationCustom),
      property.description,
      property.area,
      property.bedrooms,
      property.bathrooms,
      property.ageYears,
      property.floorLevel,
      property.parkingSpaces,
      property.partida1,
      property.partida2,
      property.partida3,
      property.ownerId,
      owners,
      property.monthlyRent,
      property.maintenanceAmount,
      property.depositMonths,
      property.salePrice,
      property.saleCurrency ?? 'PEN',
      property.projectName,
      PropertyPrismaMapper.parseMediaItems(property.mediaItems),
      property.listingStatus,
      property.isActive,
    );
  }
}
