export interface RentalAlertSettings {
  applicationId: string;
  enableExpirationAlerts: boolean;
  enableCollectionAlerts: boolean;
}
export interface ScheduledRental extends RentalAlertSettings {
  id: string;
  endDate: Date;
  application: { id: string; slug: string };
  property: { addressLine: string };
  tenant: { fullName: string };
  tenants: { client: { fullName: string } }[];
}
export interface ScheduledPayment {
  id: string;
  dueDate: Date;
  rental: Omit<ScheduledRental, 'property' | 'endDate'>;
}
export abstract class RentalAlertQueryPort {
  abstract getUserIdsByRoleCodes(roleCodes: string[]): Promise<string[]>;
  abstract findRentalSettings(id: string): Promise<RentalAlertSettings | null>;
  abstract listActiveRentals(): Promise<ScheduledRental[]>;
  abstract listPendingPayments(): Promise<ScheduledPayment[]>;
  abstract recentNotificationData(
    type: string,
    since: Date,
  ): Promise<{ data: unknown }[]>;
}
