import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '../../../../application/entities';
import { RoleRepository } from '../../../../application/repositories';
import { RolePrismaMapper } from '../mappers';

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

    return roles.map(RolePrismaMapper.toDomain);
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

    return roles.map(RolePrismaMapper.toDomain);
  }

  async create(data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
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

    return RolePrismaMapper.toDomain(role);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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
  }

  async assignApplication(roleId: string, applicationId: string): Promise<void> {
    await this.prisma.roleApplication.upsert({
      where: {
        roleId_applicationId: { roleId, applicationId },
      },
      create: {
        roleId,
        applicationId,
      },
      update: {},
    });
  }

  async revokeApplication(roleId: string, applicationId: string): Promise<void> {
    await this.prisma.roleApplication.delete({
      where: {
        roleId_applicationId: { roleId, applicationId },
      },
    });
  }
}
