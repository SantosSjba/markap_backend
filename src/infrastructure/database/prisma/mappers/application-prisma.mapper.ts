import { Application as PrismaApplication } from '@prisma/client';
import { Application } from '../../../../application/entities';

/**
 * Application Prisma Mapper
 * Maps between Prisma Application and Domain Application
 */
export class ApplicationPrismaMapper {
  static toDomain(prismaApp: PrismaApplication): Application {
    return Application.create({
      id: prismaApp.id,
      name: prismaApp.name,
      slug: prismaApp.slug,
      description: prismaApp.description,
      icon: prismaApp.icon,
      color: prismaApp.color,
      url: prismaApp.url,
      activeCount: prismaApp.activeCount,
      pendingCount: prismaApp.pendingCount,
      isActive: prismaApp.isActive,
      order: prismaApp.order,
      createdAt: prismaApp.createdAt,
      updatedAt: prismaApp.updatedAt,
      deletedAt: prismaApp.deletedAt,
    });
  }

  static toPrisma(
    app: Application,
  ): Omit<PrismaApplication, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: app.name,
      slug: app.slug,
      description: app.description,
      icon: app.icon,
      color: app.color,
      url: app.url,
      activeCount: app.activeCount,
      pendingCount: app.pendingCount,
      isActive: app.isActive,
      order: app.order,
      deletedAt: app.deletedAt,
    };
  }
}
