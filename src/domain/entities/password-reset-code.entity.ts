/** Código de un solo uso para recuperación de contraseña. */
export class PasswordResetCode {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly code: string,
    public readonly expiresAt: Date,
    public readonly usedAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
