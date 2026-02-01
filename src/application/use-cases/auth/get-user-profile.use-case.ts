import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { UserRepository } from '../../repositories/user.repository';
import { EntityNotFoundException } from '../../exceptions';

/**
 * Get User Profile Use Case
 *
 * Caso de uso para obtener el perfil de un usuario autenticado.
 */
@Injectable()
export class GetUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    return user;
  }
}
