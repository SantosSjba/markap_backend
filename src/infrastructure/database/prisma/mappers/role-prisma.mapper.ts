import { Role as PrismaRole } from '@prisma/client';
import { Role } from '../../../../application/entities';

/**
 * Role Prisma Mapper
 * Maps between Prisma Role and Domain Role
 */
export class RolePrismaMapper {
  static toDomain(prismaRole: PrismaRole): Role {
    return Role.create({
      id: prismaRole.id,
      name: prismaRole.name,
      code: prismaRole.code,
      description: prismaRole.description,
      isActive: prismaRole.isActive,
      createdAt: prismaRole.createdAt,
      updatedAt: prismaRole.updatedAt,
      deletedAt: prismaRole.deletedAt,
    });
  }

  static toPrisma(role: Role): Omit<PrismaRole, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: role.name,
      code: role.code,
      description: role.description,
      isActive: role.isActive,
      deletedAt: role.deletedAt,
    };
  }
}
