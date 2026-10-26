import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infrastructure/database/prisma/prisma.service';
import {
  ApplicationAccessRepository,
  type AccessAssignment,
} from '../../../domain/repositories/application-access.repository';
@Injectable()
export class ApplicationAccessPrismaRepository implements ApplicationAccessRepository {
  constructor(private readonly prisma: PrismaService) {}
  async resolveResourceApplication(
    resource: string,
    id: string,
  ): Promise<string | null> {
    const args = { where: { id }, select: { applicationId: true } } as const;
    const row =
      resource === 'clients'
        ? await this.prisma.client.findUnique(args)
        : resource === 'properties'
          ? await this.prisma.property.findUnique(args)
          : resource === 'agents'
            ? await this.prisma.agent.findUnique(args)
            : null;
    return row?.applicationId ?? null;
  }
  async getAssignments(userId: string): Promise<AccessAssignment[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        userRoles: { some: { userId, isActive: true, revokedAt: null } },
      },
      include: { roleApplications: { include: { application: true } } },
    });
    if (roles.some((r) => r.code === 'ADMIN')) {
      const apps = await this.prisma.application.findMany({
        where: { isActive: true, deletedAt: null },
      });
      return apps.map((a) => ({
        slug: a.slug,
        applicationId: a.id,
        name: a.name,
        level: 'ADMIN',
      }));
    }
    return roles.flatMap((r) =>
      r.roleApplications
        .filter((a) => a.application.isActive && !a.application.deletedAt)
        .map((a) => ({
          slug: a.application.slug,
          applicationId: a.applicationId,
          name: a.application.name,
          level: a.accessLevel,
        })),
    );
  }
}
