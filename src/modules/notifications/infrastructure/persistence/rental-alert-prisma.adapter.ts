import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma/prisma.service';
import { RentalAlertQueryPort } from '../../application/ports/rental-alert-query.port';
@Injectable()
export class RentalAlertPrismaAdapter extends RentalAlertQueryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  findRentalSettings(id: string) {
    return this.prisma.rental.findUnique({
      where: { id },
      select: {
        applicationId: true,
        enableExpirationAlerts: true,
        enableCollectionAlerts: true,
      },
    });
  }
  async getUserIdsByRoleCodes(roleCodes: string[]): Promise<string[]> {
    if (roleCodes.length === 0) return [];
    const roles = await this.prisma.role.findMany({
      where: { code: { in: roleCodes }, isActive: true },
      select: { id: true },
    });
    const roleIds = roles.map((r: { id: string }) => r.id);
    if (roleIds.length === 0) return [];
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId: { in: roleIds }, isActive: true, revokedAt: null },
      select: { userId: true },
      distinct: ['userId'],
    });
    return userRoles.map((ur: { userId: string }) => ur.userId);
  }
  async listActiveRentals() {
    return await this.prisma.rental.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: {
        application: { select: { id: true, slug: true } },
        property: { select: { addressLine: true } },
        tenant: { select: { fullName: true } },
        tenants: {
          orderBy: { sortOrder: 'asc' },
          include: { client: { select: { fullName: true } } },
        },
      },
    });
  }
  async listPendingPayments() {
    return await this.prisma.payment.findMany({
      where: {
        status: 'PENDING',
        rental: { deletedAt: null, status: 'ACTIVE' },
      },
      include: {
        rental: {
          include: {
            application: { select: { id: true, slug: true } },
            tenant: { select: { fullName: true } },
            tenants: {
              orderBy: { sortOrder: 'asc' },
              include: { client: { select: { fullName: true } } },
            },
          },
        },
      },
    });
  }
  async recentNotificationData(type: string, since: Date) {
    return await this.prisma.notification.findMany({
      where: { type, createdAt: { gte: since } },
      select: { data: true },
      take: 200,
    });
  }
}
