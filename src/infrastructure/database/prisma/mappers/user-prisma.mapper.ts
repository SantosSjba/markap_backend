import { User as PrismaUser } from '@prisma/client';
import { User } from '../../../../application/entities/user.entity';

/**
 * User Prisma Mapper
 *
 * Convierte entre el modelo de Prisma y la entidad de dominio.
 */
export class UserPrismaMapper {
  /**
   * Convierte un registro de Prisma a una entidad de dominio
   */
  static toDomain(raw: PrismaUser): User {
    return new User(
      raw.id,
      raw.email,
      raw.password,
      raw.firstName,
      raw.lastName,
      raw.isActive,
      raw.createdAt,
      raw.updatedAt,
      raw.createdBy,
      raw.updatedBy,
      raw.deletedAt,
      raw.deletedBy,
    );
  }

  /**
   * Convierte múltiples registros de Prisma a entidades de dominio
   */
  static toDomainList(rawList: PrismaUser[]): User[] {
    return rawList.map(UserPrismaMapper.toDomain);
  }
}
