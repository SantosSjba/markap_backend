import { Prisma } from '@prisma/client';
import type { PropertyDistrict, PropertyMediaItem } from '@domain/entities/property.entity';
import { Property } from '@domain/entities/property.entity';

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

  static toDomain(
    property: Prisma.PropertyGetPayload<{
      include: {
        district: {
          include: {
            province: { include: { department: true } };
          };
        };
      };
    }>,
  ): Property {
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

    return new Property(
      property.id,
      property.applicationId,
      property.code,
      property.propertyTypeId,
      property.addressLine,
      property.districtId,
      district,
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
      property.monthlyRent,
      property.maintenanceAmount,
      property.depositMonths,
      property.salePrice,
      property.projectName,
      PropertyPrismaMapper.parseMediaItems(property.mediaItems),
      property.listingStatus,
      property.isActive,
    );
  }
}
