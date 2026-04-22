import { Injectable } from '@nestjs/common';
import {
  UserRepository,
  PasswordResetCodeRepository,
  HashService,
} from '@common/constants/injection-tokens';
import {
  InvalidPasswordResetCodeException,
  UserNotFoundException,
} from '@domain/exceptions';
import { Email } from '@domain/value-objects';

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
  }
}
