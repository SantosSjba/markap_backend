export abstract class PeriodTransactionPort {
  abstract withLockedPeriod<T>(id: string, work: () => Promise<T>): Promise<T>;
}
