import { Injectable } from '@nestjs/common';
import { User } from '@domain/entities/user.entity';
import { HashService, UserRepository } from '@common/constants/injection-tokens';
import { EmailAlreadyExistsException } from '@domain/exceptions';
import { Email } from '@domain/value-objects';

/**
 * Input para registrar un nuevo usuario
 */
export interface RegisterUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdBy: string;
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
    const email = Email.create(input.email);
    const existingUser = await this.userRepository.existsByEmail(email.value);
    if (existingUser) {
      throw new EmailAlreadyExistsException(email.value);
    }

    // Encriptar la contraseña
    const hashedPassword = await this.hashService.hash(input.password);

    // Crear el usuario
    const user = await this.userRepository.create({
      email: email.value,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      createdBy: input.createdBy,
    });

    return user;
  }
}
