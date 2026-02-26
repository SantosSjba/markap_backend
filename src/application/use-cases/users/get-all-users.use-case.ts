import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';

/**
 * Get All Users Use Case
 * Clean Architecture: depends only on application port (UserRepository).
 */
@Injectable()
export class GetAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute() {
    return this.userRepository.findAllWithRoles();
  }
}
