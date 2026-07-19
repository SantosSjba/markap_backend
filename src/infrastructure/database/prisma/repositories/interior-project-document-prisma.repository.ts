import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import type {
  CreateInteriorProjectDocumentData,
  InteriorProjectDocumentListItem,
  InteriorProjectDocumentRepository,
  ListInteriorProjectDocumentsFilters,
  ListInteriorProjectDocumentsResult,
  UpdateInteriorProjectDocumentData,
} from '@domain/repositories/interior-project-document.repository';

@Injectable()
export class InteriorProjectDocumentPrismaRepository implements InteriorProjectDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapRow(
    doc: {
      id: string;
      projectId: string;
      docType: string;
      title: string;
      fileUrl: string | null;
      archivoId: string | null;
      createdAt: Date;
    },
    project: { code: string; name: string },
  ): InteriorProjectDocumentListItem {
    return {
      id: doc.id,
      projectId: doc.projectId,
      projectCode: project.code,
      projectName: project.name,
      docType: doc.docType,
      title: doc.title,
      fileUrl: doc.fileUrl,
      archivoId: doc.archivoId,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  async findMany(filters: ListInteriorProjectDocumentsFilters): Promise<ListInteriorProjectDocumentsResult> {
    const app = await this.prisma.application.findUnique({
      where: { slug: filters.applicationSlug },
    });
    if (!app) {
      return { data: [], total: 0, page: filters.page, limit: filters.limit };
    }

    const andParts: Prisma.InteriorProjectDocumentWhereInput[] = [
      {
        project: {
          applicationId: app.id,
          deletedAt: null,
        },
      },
      { docType: filters.docType },
    ];

    if (filters.projectId?.trim()) {
      andParts.push({ projectId: filters.projectId.trim() });
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      andParts.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { project: { code: { contains: q, mode: 'insensitive' } } },
          { project: { name: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.InteriorProjectDocumentWhereInput = { AND: andParts };

    const [rows, total] = await Promise.all([
      this.prisma.interiorProjectDocument.findMany({
        where,
        include: {
          project: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.interiorProjectDocument.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.mapRow(r, r.project)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async create(data: CreateInteriorProjectDocumentData): Promise<InteriorProjectDocumentListItem | null> {
    const app = await this.prisma.application.findUnique({
      where: { slug: data.applicationSlug },
    });
    if (!app) return null;

    const project = await this.prisma.interiorProject.findFirst({
      where: {
        id: data.projectId,
        applicationId: app.id,
        deletedAt: null,
      },
      select: { id: true, code: true, name: true },
    });
    if (!project) return null;

    const row = await this.prisma.interiorProjectDocument.create({
      data: {
        projectId: project.id,
        docType: data.docType,
        title: data.title.trim(),
        fileUrl: data.fileUrl?.trim() || null,
        archivoId: data.archivoId?.trim() || null,
      },
    });

    return this.mapRow(row, project);
  }

  async update(
    id: string,
    applicationSlug: string,
    data: UpdateInteriorProjectDocumentData,
  ): Promise<InteriorProjectDocumentListItem | null> {
    const existing = await this.prisma.interiorProjectDocument.findFirst({
      where: {
        id,
        project: {
          application: { slug: applicationSlug },
          deletedAt: null,
        },
      },
      include: {
        project: { select: { code: true, name: true } },
      },
    });
    if (!existing) return null;

    const patch: Prisma.InteriorProjectDocumentUncheckedUpdateInput = {};
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.fileUrl !== undefined) patch.fileUrl = data.fileUrl?.trim() || null;
    if (data.archivoId !== undefined) patch.archivoId = data.archivoId?.trim() || null;
    if (data.docType !== undefined) patch.docType = data.docType;

    const row = await this.prisma.interiorProjectDocument.update({
      where: { id },
      data: patch,
      include: {
        project: { select: { code: true, name: true } },
      },
    });

    return this.mapRow(row, row.project);
  }

  async delete(id: string, applicationSlug: string): Promise<boolean> {
    const existing = await this.prisma.interiorProjectDocument.findFirst({
      where: {
        id,
        project: {
          application: { slug: applicationSlug },
          deletedAt: null,
        },
      },
      select: { id: true },
    });
    if (!existing) return false;

    await this.prisma.interiorProjectDocument.delete({ where: { id } });
    return true;
  }
}
