import { Inject, Injectable } from '@nestjs/common';
import {
  InvalidPasswordResetCodeException,
  UserNotFoundException,
} from '../../../../../shared/domain/exceptions/domain.exception';
import { HashService } from '../../../../../shared/domain/services/hash.service';
import { Email } from '../../../../../shared/domain/value-objects/email.value-object';
import { PasswordResetCodeRepository } from '../../../domain/repositories/password-reset-code.repository';
import { UserRepository } from '../../../domain/repositories/user.repository';

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

/**
 * Reset Password Use Case
 *
 * Valida el código de recuperación y actualiza la contraseña del usuario.
 */
import {
  AUDIT_RECORDER,
  type AuditRecorder,
} from '../../../../../shared/application/ports/audit-recorder.port';
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(AUDIT_RECORDER) private readonly audit: AuditRecorder,
    private readonly userRepository: UserRepository,
    private readonly passwordResetCodeRepository: PasswordResetCodeRepository,
    private readonly hashService: HashService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const user = await this.userRepository.findByEmail(
      Email.create(input.email).value,
    );

    if (!user) {
      throw new UserNotFoundException();
    }

    const resetCode =
      await this.passwordResetCodeRepository.findValidByCodeAndUserId(
        input.code.trim(),
        user.id,
      );

    if (!resetCode) {
      throw new InvalidPasswordResetCodeException();
    }

    const hashedPassword = await this.hashService.hash(input.newPassword);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      updatedBy: user.id,
    });

    await this.passwordResetCodeRepository.markAsUsed(resetCode.id);
    await this.audit.record({
      action: 'PASSWORD_RESET',
      userId: user.id,
      metadata: { step: 'CONFIRM' },
    });
  }
}
