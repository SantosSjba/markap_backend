import { User } from '../../../application/entities/user.entity';
import { UserResponseDto } from '../dtos/auth/auth-response.dto';

/**
 * User HTTP Mapper
 *
 * Convierte entidades de dominio a DTOs de respuesta HTTP.
 */
export class UserHttpMapper {
  /**
   * Convierte una entidad User a UserResponseDto
   */
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
