import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma/prisma.service';
import { PropertyLookupPort } from '../../application/ports/property-lookup.port';
@Injectable()
export class PropertyLookupAdapter extends PropertyLookupPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async owners(applicationSlug?: string, search?: string) {
    const slug = applicationSlug ?? 'alquileres';
    const app = await this.prisma.application.findUnique({
      where: { slug },
    });
    if (!app) return [];

    const where: Prisma.ClientWhereInput = {
      applicationId: app.id,
      clientType: 'OWNER',
      deletedAt: null,
    };
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q } },
        { documentNumber: { contains: q } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        documentNumber: true,
        primaryPhone: true,
        primaryEmail: true,
      },
      orderBy: { fullName: 'asc' },
      take: 500,
    });
  }
  async applicationSlug(applicationId: string) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, deletedAt: null },
      select: { slug: true },
    });
    return app?.slug ?? null;
  }
}
