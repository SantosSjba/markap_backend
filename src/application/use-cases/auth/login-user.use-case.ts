import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user.repository';
import { HashService } from '../../services/hash.service';
import { TokenService, TokenResult } from '../../services/token.service';
import {
  InvalidCredentialsException,
  UserInactiveException,
} from '../../exceptions';

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
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(input.email);
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
