import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Application } from '../../../../application/entities';
import { ApplicationRepository } from '../../../../application/repositories';
import { ApplicationPrismaMapper } from '../mappers';

/**
 * Application Prisma Repository
 * Implements ApplicationRepository using Prisma
 */
@Injectable()
export class ApplicationPrismaRepository implements ApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Application[]> {
    const applications = await this.prisma.application.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: { order: 'asc' },
    });

    return applications.map(ApplicationPrismaMapper.toDomain);
  }

  async findById(id: string): Promise<Application | null> {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application || application.deletedAt) {
      return null;
    }

    return ApplicationPrismaMapper.toDomain(application);
  }

  async findBySlug(slug: string): Promise<Application | null> {
    const application = await this.prisma.application.findUnique({
      where: { slug },
    });

    if (!application || application.deletedAt) {
      return null;
    }

    return ApplicationPrismaMapper.toDomain(application);
  }

  async findByUserId(userId: string): Promise<Application[]> {
    // Get applications through user's roles
    const applications = await this.prisma.application.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        roleApplications: {
          some: {
            role: {
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
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return applications.map(ApplicationPrismaMapper.toDomain);
  }

  async findByRoleId(roleId: string): Promise<Application[]> {
    const applications = await this.prisma.application.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        roleApplications: {
          some: { roleId },
        },
      },
      orderBy: { order: 'asc' },
    });

    return applications.map(ApplicationPrismaMapper.toDomain);
  }

  async create(
    data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Application> {
    const application = await this.prisma.application.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        url: data.url,
        activeCount: data.activeCount,
        pendingCount: data.pendingCount,
        isActive: data.isActive,
        order: data.order,
      },
    });

    return ApplicationPrismaMapper.toDomain(application);
  }

  async update(id: string, data: Partial<Application>): Promise<Application> {
    const application = await this.prisma.application.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
        url: data.url,
        activeCount: data.activeCount,
        pendingCount: data.pendingCount,
        isActive: data.isActive,
        order: data.order,
      },
    });

    return ApplicationPrismaMapper.toDomain(application);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
