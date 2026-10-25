import { Injectable } from '@nestjs/common';
import {
  InvalidCredentialsException,
  UserInactiveException,
} from '../../../../../shared/domain/exceptions/domain.exception';
import { HashService } from '../../../../../shared/domain/services/hash.service';
import type { TokenResult } from '../../../../../shared/domain/services/token.service';
import { TokenService } from '../../../../../shared/domain/services/token.service';
import { Email } from '../../../../../shared/domain/value-objects/email.value-object';
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
/**
 * Input para iniciar sesión
 */
export interface LoginUserInput {
  email: string;
  password: string;
}

/**
 * Output del login
 */
export interface LoginUserOutput {
  user: User;
  accessToken: string;
  expiresIn: number;
}

/**
 * Login User Use Case
 *
 * Caso de uso para autenticar un usuario.
 */
@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const email = Email.create(input.email);
    const user = await this.userRepository.findByEmail(email.value);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    // Verificar si el usuario puede autenticarse
    if (!user.canAuthenticate) {
      throw new UserInactiveException();
    }

    // Verificar la contraseña
    const isPasswordValid = await this.hashService.compare(
      input.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Generar token
    const tokenResult: TokenResult = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
    });

    return {
      user,
      accessToken: tokenResult.accessToken,
      expiresIn: tokenResult.expiresIn,
    };
  }
}
