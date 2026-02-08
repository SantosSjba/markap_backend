/**
 * Password Reset Code Repository Interface
 *
 * Define el contrato para gestionar códigos de recuperación de contraseña.
 */
export interface PasswordResetCodeData {
  id: string;
  userId: string;
  code: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreatePasswordResetCodeData {
  userId: string;
  code: string;
  expiresAt: Date;
}

export abstract class PasswordResetCodeRepository {
  /**
   * Crea un nuevo código de recuperación
   */
  abstract create(data: CreatePasswordResetCodeData): Promise<PasswordResetCodeData>;

  /**
   * Busca un código válido (no usado, no expirado) por código y email del usuario
   */
  abstract findValidByCodeAndUserId(
    code: string,
    userId: string
  ): Promise<PasswordResetCodeData | null>;

  /**
   * Marca un código como usado
   */
  abstract markAsUsed(id: string): Promise<void>;

  /**
   * Invalida códigos anteriores del usuario (opcional, para seguridad)
   */
  abstract invalidateUserCodes(userId: string): Promise<void>;
}
