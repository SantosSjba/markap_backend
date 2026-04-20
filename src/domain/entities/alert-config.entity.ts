/** Preferencias de alertas por usuario y aplicación. */
export class AlertConfig {
  constructor(
    public readonly id: string,
    public readonly applicationId: string,
    public readonly userId: string,
    public readonly alert30Days: boolean,
    public readonly alert60Days: boolean,
    public readonly alert90Days: boolean,
    public readonly alertPendingPayment: boolean,
    public readonly alertOverduePayment: boolean,
    public readonly channelInApp: boolean,
    public readonly channelEmail: boolean,
    public readonly channelWhatsapp: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
