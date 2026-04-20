import type { PasswordResetCode } from '@domain/entities/password-reset-code.entity';

export interface CreatePasswordResetCodeData {
  userId: string;
  code: string;
  expiresAt: Date;
}

export abstract class PasswordResetCodeRepository {
  abstract create(data: CreatePasswordResetCodeData): Promise<PasswordResetCode>;

  abstract findValidByCodeAndUserId(
    code: string,
    userId: string,
  ): Promise<PasswordResetCode | null>;

  abstract markAsUsed(id: string): Promise<void>;

  abstract invalidateUserCodes(userId: string): Promise<void>;
}
