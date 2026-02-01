import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user.repository';
import { HashService } from '../../services/hash.service';
import { EmailAlreadyExistsException } from '../../exceptions';

/**
 * Input para registrar un nuevo usuario
 */
export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Register User Use Case
 *
 * Caso de uso para registrar un nuevo usuario en el sistema.
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.existsByEmail(input.email);
    if (existingUser) {
      throw new EmailAlreadyExistsException(input.email);
    }

    // Encriptar la contraseña
    const hashedPassword = await this.hashService.hash(input.password);

    // Crear el usuario
    const user = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    return user;
  }
}
