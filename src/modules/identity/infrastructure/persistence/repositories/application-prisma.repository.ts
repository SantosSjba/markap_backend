import { Injectable } from '@nestjs/common';
import {
  parseDateOnly,
  startOfTodayLima,
  todayDateOnlyLima,
} from '../../../../../shared/domain/utils/peru-date.util';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import { Application } from '../../../domain/entities/application.entity';
import { ApplicationRepository } from '../../../domain/repositories/application.repository';
import { ApplicationPrismaMapper } from '../mappers/application-prisma.mapper';

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

    return applications.map((row) => ApplicationPrismaMapper.toDomain(row));
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
    const admin = await this.prisma.role.count({
      where: {
        code: 'ADMIN',
        isActive: true,
        deletedAt: null,
        userRoles: { some: { userId, isActive: true, revokedAt: null } },
      },
    });
    // Get applications through user's roles
    const applications = await this.prisma.application.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(admin
          ? {}
          : {
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
            }),
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

    return appsWithCounts.map((row) => ApplicationPrismaMapper.toDomain(row));
  }

  /** Indicadores del selector calculados desde los mismos registros del negocio. */
  private async getDynamicCounts(
    applicationId: string,
    slug: string,
  ): Promise<{ activeCount: number; pendingCount: number }> {
    let counts: [number, number];
    switch (slug) {
      case 'alquileres':
        counts = await Promise.all([
          this.prisma.rental.count({
            where: {
              applicationId,
              deletedAt: null,
              status: 'ACTIVE',
              endDate: { gte: startOfTodayLima() },
            },
          }),
          this.prisma.payment.count({
            where: {
              rental: { applicationId, deletedAt: null, status: 'ACTIVE' },
              status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            },
          }),
        ]);
        break;
      case 'ventas':
        counts = await Promise.all([
          this.prisma.saleProcess.count({
            where: { applicationId, deletedAt: null, status: 'ACTIVE' },
          }),
          this.prisma.saleBuyerPayment.count({
            where: {
              closing: { applicationId },
              status: 'PENDING',
            },
          }),
        ]);
        break;
      case 'interiorismo':
        counts = await Promise.all([
          this.prisma.interiorProject.count({
            where: {
              applicationId,
              deletedAt: null,
              status: { in: ['DESIGN', 'QUOTE', 'APPROVED', 'IN_PROGRESS'] },
            },
          }),
          this.prisma.interiorProject.count({
            where: { applicationId, deletedAt: null, status: 'QUOTE' },
          }),
        ]);
        break;
      case 'arquitectura':
        counts = await Promise.all([
          this.prisma.arquitecturaProject.count({
            where: {
              applicationId,
              deletedAt: null,
              status: { in: ['DESIGN', 'QUOTE', 'APPROVED', 'IN_PROGRESS'] },
            },
          }),
          this.prisma.arquitecturaProject.count({
            where: { applicationId, deletedAt: null, status: 'QUOTE' },
          }),
        ]);
        break;
      case 'produccion':
        counts = await Promise.all([
          this.prisma.produccionWorkOrder.count({
            where: {
              applicationId,
              status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
          }),
          this.prisma.produccionPurchaseOrder.count({
            where: {
              applicationId,
              status: { in: ['DRAFT', 'SENT', 'PARTIAL'] },
            },
          }),
        ]);
        break;
      case 'contabilidad': {
        const monthStart = parseDateOnly(
          `${todayDateOnlyLima().slice(0, 7)}-01`,
        );
        const nextMonth = new Date(monthStart);
        nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
        counts = await Promise.all([
          this.prisma.contabilidadJournalEntry.count({
            where: {
              applicationId,
              entryDate: { gte: monthStart, lt: nextMonth },
            },
          }),
          this.prisma.contabilidadSalesInvoice.count({
            where: {
              applicationId,
              status: { not: 'CANCELLED' },
              electronicStatus: 'NONE',
            },
          }),
        ]);
        break;
      }
      default:
        counts = [0, 0];
    }
    return { activeCount: counts[0], pendingCount: counts[1] };
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

    return applications.map((row) => ApplicationPrismaMapper.toDomain(row));
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
