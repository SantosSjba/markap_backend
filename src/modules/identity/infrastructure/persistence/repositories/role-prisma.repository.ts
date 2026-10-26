import { invalidateAccessCache } from '../../../../../shared/application/ports/application-access.port';
import type { AccessLevel } from '../../../../../shared/domain/access-level';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import { Role } from '../../../domain/entities/role.entity';
import { RoleRepository } from '../../../domain/repositories/role.repository';
import { RolePrismaMapper } from '../mappers/role-prisma.mapper';

/**
 * Role Prisma Repository
 * Implements RoleRepository using Prisma
 */
@Injectable()
export class RolePrismaRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((row) => RolePrismaMapper.toDomain(row));
  }

  async findById(id: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role || role.deletedAt) {
      return null;
    }

    return RolePrismaMapper.toDomain(role);
  }

  async findByCode(code: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { code },
    });

    if (!role || role.deletedAt) {
      return null;
    }

    return RolePrismaMapper.toDomain(role);
  }

  async findByUserId(userId: string): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        userRoles: {
          some: {
            userId,
            isActive: true,
            revokedAt: null,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((row) => RolePrismaMapper.toDomain(row));
  }

  async create(
    data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Role> {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: data.isActive,
      },
    });

    return RolePrismaMapper.toDomain(role);
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        isActive: data.isActive,
      },
    });
    // Tras escribir: si se invalida antes, una lectura concurrente puede cachear el valor viejo
    invalidateAccessCache();

    return RolePrismaMapper.toDomain(role);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    invalidateAccessCache();
  }

  async assignToUser(
    userId: string,
    roleId: string,
    assignedBy?: string,
  ): Promise<void> {
    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: { userId, roleId },
      },
      create: {
        userId,
        roleId,
        assignedBy,
        isActive: true,
      },
      update: {
        isActive: true,
        revokedAt: null,
        revokedBy: null,
        assignedBy,
      },
    });
    invalidateAccessCache();
  }

  async revokeFromUser(
    userId: string,
    roleId: string,
    revokedBy?: string,
  ): Promise<void> {
    await this.prisma.userRole.update({
      where: {
        userId_roleId: { userId, roleId },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy,
      },
    });
    invalidateAccessCache();
  }

  async assignApplication(
    roleId: string,
    applicationId: string,
  ): Promise<void> {
    return this.setApplicationAccess(roleId, applicationId, 'WRITE');
  }

  async setApplicationAccess(
    roleId: string,
    applicationId: string,
    level: AccessLevel,
  ): Promise<void> {
    await this.prisma.roleApplication.upsert({
      where: { roleId_applicationId: { roleId, applicationId } },
      create: { roleId, applicationId, accessLevel: level },
      update: { accessLevel: level },
    });
    invalidateAccessCache();
  }
  async getApplicationsMatrix() {
    const [roles, applications, rows] = await Promise.all([
      this.findAll(),
      this.prisma.application.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
      this.prisma.roleApplication.findMany(),
    ]);
    const access: Record<string, Record<string, AccessLevel>> = {};
    for (const row of rows) {
      access[row.roleId] ??= {};
      access[row.roleId][row.applicationId] = row.accessLevel;
    }
    return { roles, applications, access };
  }

  async revokeApplication(
    roleId: string,
    applicationId: string,
  ): Promise<void> {
    await this.prisma.roleApplication.delete({
      where: {
        roleId_applicationId: { roleId, applicationId },
      },
    });
    invalidateAccessCache();
  }
}
