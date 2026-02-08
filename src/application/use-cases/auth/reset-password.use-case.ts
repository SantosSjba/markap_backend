import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { PasswordResetCodeRepository } from '../../repositories/password-reset-code.repository';
import { HashService } from '../../services/hash.service';
import {
  InvalidPasswordResetCodeException,
  UserNotFoundException,
} from '../../exceptions';

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
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetCodeRepository: PasswordResetCodeRepository,
    private readonly hashService: HashService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const user = await this.userRepository.findByEmail(
      input.email.toLowerCase().trim(),
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
  }
}
