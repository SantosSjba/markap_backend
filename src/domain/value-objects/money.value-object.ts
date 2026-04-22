import { ValidationException } from '@domain/exceptions';

/**
 * Monto monetario con precisión decimal (número de punto flotante; redondeo en bordes de negocio).
 */
export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  static create(amount: number, currency: string): Money {
    const c = currency.trim().toUpperCase();
    if (!c) {
      throw new ValidationException('La moneda es obligatoria');
    }
    if (!Number.isFinite(amount)) {
      throw new ValidationException('El monto no es un número válido');
    }
    return new Money(Math.round(amount * 100) / 100, c);
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new ValidationException('No se pueden sumar montos de distinta moneda');
    }
    return Money.create(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amount === other.amount;
  }
}
