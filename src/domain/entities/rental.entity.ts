/** Adjunto de contrato u otro documento del alquiler. */
export class RentalAttachment {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly filePath: string,
    public readonly originalFileName: string,
  ) {}
}

/** Contrato de alquiler. */
export class Rental {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly propertyId: string,
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly currency: string,
    public readonly monthlyAmount: number,
    public readonly securityDeposit: number | null,
    public readonly paymentDueDay: number,
    public readonly notes: string | null,
    public readonly status: string,
    public readonly enableAlerts: boolean,
  ) {}
}

/** Fila de listado de alquileres. */
export class RentalListItem {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly propertyId: string,
    public readonly propertyAddress: string,
    public readonly propertyCode: string,
    public readonly tenantId: string,
    public readonly tenantName: string,
    public readonly ownerId: string,
    public readonly ownerName: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly currency: string,
    public readonly monthlyAmount: number,
    public readonly securityDeposit: number | null,
    public readonly status: string,
    public readonly hasContract: boolean,
  ) {}
}

/** Detalle de alquiler con propiedad, inquilino y adjuntos. */
export class RentalDetail extends Rental {
  constructor(
    rental: Rental,
    public readonly code: string,
    public readonly property: {
      id: string;
      code: string;
      addressLine: string;
      ownerId: string;
      owner: { id: string; fullName: string };
    },
    public readonly tenant: { id: string; fullName: string },
    public readonly hasContract: boolean,
    public readonly hasDeliveryAct: boolean,
    public readonly attachments: RentalAttachment[],
  ) {
    super(
      rental.id,
      rental.applicationId,
      rental.propertyId,
      rental.tenantId,
      rental.startDate,
      rental.endDate,
      rental.currency,
      rental.monthlyAmount,
      rental.securityDeposit,
      rental.paymentDueDay,
      rental.notes,
      rental.status,
      rental.enableAlerts,
    );
  }
}

/** Contadores de alquileres para dashboard. */
export class RentalStats {
  constructor(
    public readonly total: number,
    public readonly vigentes: number,
    public readonly porVencer: number,
    public readonly vencidos: number,
  ) {}
}
