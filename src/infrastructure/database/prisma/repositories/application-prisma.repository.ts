import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Application } from '@domain/entities';
import { ApplicationRepository } from '@domain/repositories';
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

    // Calculate dynamic counts for each application
    const appsWithCounts = await Promise.all(
      applications.map(async (app) => {
        const counts = await this.getDynamicCounts(app.id, app.slug);
        return { ...app, ...counts };
      }),
    );

    return appsWithCounts.map(ApplicationPrismaMapper.toDomain);
  }

  /**
   * Calculates activeCount and pendingCount dynamically based on real data.
   * - activeCount: active rentals/contracts for this application
   * - pendingCount: pending payments across those rentals
   */
  private async getDynamicCounts(
    applicationId: string,
    slug: string,
  ): Promise<{ activeCount: number; pendingCount: number }> {
    // Only calculate for applications that have rentals (e.g. alquileres)
    // For others, fall back to stored values
    const RENTAL_SLUGS = ['alquileres'];

    if (!RENTAL_SLUGS.includes(slug)) {
      return { activeCount: 0, pendingCount: 0 };
    }

    const [activeCount, pendingCount] = await Promise.all([
      this.prisma.rental.count({
        where: {
          applicationId,
          status: 'ACTIVE',
        },
      }),
      this.prisma.payment.count({
        where: {
          rental: { applicationId },
          status: 'PENDING',
        },
      }),
    ]);

    return { activeCount, pendingCount };
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
