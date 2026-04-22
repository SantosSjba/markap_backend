import { ValidationException } from '@domain/exceptions';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email normalizado (minúsculas, sin espacios laterales).
 */
export class Email {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Email {
    const v = raw.trim().toLowerCase();
    if (!v) {
      throw new ValidationException('El email es obligatorio');
    }
    if (!EMAIL_RE.test(v)) {
      throw new ValidationException('El formato del email no es válido');
    }
    return new Email(v);
  }

  static optional(raw: string | null | undefined): string | null {
    if (raw == null || !String(raw).trim()) return null;
    return Email.create(String(raw)).value;
  }

  /** Crea sin validar formato estricto (solo recortar). Solo para datos ya validados en capa externa. */
  static unsafeFromTrusted(raw: string): Email {
    return new Email(raw.trim().toLowerCase());
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
