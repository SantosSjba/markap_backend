import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';

/**
 * Toggle User Active Status Use Case
 * Clean Architecture: depends only on application port (UserRepository).
 */
@Injectable()
export class ToggleUserActiveUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, updatedBy?: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    await this.userRepository.update(userId, {
      isActive: !user.isActive,
      updatedBy,
    });
    const updated = await this.userRepository.findByIdWithRoles(userId);
    if (!updated) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return updated;
  }
}
