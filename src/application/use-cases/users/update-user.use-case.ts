import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';

interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  updatedBy?: string;
}

/**
 * Update User Use Case
 * Clean Architecture: depends only on application port (UserRepository).
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInput) {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    await this.userRepository.update(input.userId, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      updatedBy: input.updatedBy,
    });
    const updated = await this.userRepository.findByIdWithRoles(input.userId);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return updated;
  }
}
