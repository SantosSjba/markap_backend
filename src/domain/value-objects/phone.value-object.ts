import { ValidationException } from '@domain/exceptions';

const DIGITS_RE = /^\+?[0-9\s().-]{6,20}$/;

/**
 * Teléfono de contacto (validación ligera; no fuerza E.164).
 */
export class Phone {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Phone {
    const v = raw.trim();
    if (!v) {
      throw new ValidationException('El teléfono es obligatorio');
    }
    if (!DIGITS_RE.test(v)) {
      throw new ValidationException('El formato del teléfono no es válido');
    }
    return new Phone(v);
  }

  static optional(raw: string | null | undefined): Phone | null {
    if (raw == null || !String(raw).trim()) return null;
    return Phone.create(String(raw));
  }

  get value(): string {
    return this._value;
  }

  equals(other: Phone): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
