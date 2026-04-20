/** Elemento multimedia en ficha de propiedad. */
export type PropertyMediaItem = { url: string; kind: 'photo' | 'plan' };

export type PropertyDistrict = {
  id: string;
  name: string;
  province: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
    };
  };
} | null;

/** Inmueble en cartera. */
export class Property {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly code: string,
    public readonly propertyTypeId: string,
    public readonly addressLine: string,
    public readonly districtId: string,
    public readonly district: PropertyDistrict,
    public readonly description: string | null,
    public readonly area: number | null,
    public readonly bedrooms: number | null,
    public readonly bathrooms: number | null,
    public readonly ageYears: number | null,
    public readonly floorLevel: string | null,
    public readonly parkingSpaces: number | null,
    public readonly partida1: string | null,
    public readonly partida2: string | null,
    public readonly partida3: string | null,
    public readonly ownerId: string,
    public readonly monthlyRent: number | null,
    public readonly maintenanceAmount: number | null,
    public readonly depositMonths: number | null,
    public readonly salePrice: number | null,
    public readonly projectName: string | null,
    public readonly mediaItems: PropertyMediaItem[] | null,
    public readonly listingStatus: string | null,
    public readonly isActive: boolean,
  ) {}
}

/** Fila de listado de propiedades. */
export class PropertyListItem {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly addressLine: string,
    public readonly districtName: string,
    public readonly propertyTypeName: string,
    public readonly area: number | null,
    public readonly ownerId: string,
    public readonly ownerFullName: string,
    public readonly monthlyRent: number | null,
    public readonly salePrice: number | null,
    public readonly projectName: string | null,
    public readonly listingStatus: string | null,
    public readonly hasActiveRental: boolean,
    public readonly activeRentalEndDate: Date | null,
    public readonly activeRentalTenantName: string | null,
  ) {}
}

/** Contadores de inventario para listados / dashboard. */
export class PropertyStats {
  constructor(
    public readonly total: number,
    public readonly rented: number,
    public readonly available: number,
    public readonly expiring: number,
    public readonly maintenance: number,
    public readonly reserved: number,
    public readonly sold: number,
  ) {}
}
