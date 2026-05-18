import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { MinioObjectStorageService } from '../../infrastructure/storage/minio-object-storage.service';
import {
  buildStorageObjectKey,
  type StorageObjectKeyParams,
} from '../../common/utils/build-storage-object-key.util';
import { safeFilename } from '../../common/utils/safe-filename.util';

export type StoreFileInput = StorageObjectKeyParams & {
  applicationId?: string | null;
  createdBy?: string | null;
};

export type UploadedFileBuffer = {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
};

export type GenArchivoRecord = {
  id: string;
  bucket: string;
  objectKey: string;
  originalFileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  legacyFilePath: string | null;
};

@Injectable()
export class GenArchivoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MinioObjectStorageService,
  ) {}

  async resolveApplicationId(slug: string): Promise<string | null> {
    const app = await this.prisma.application.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    return app?.id ?? null;
  }

  async upload(
    input: StoreFileInput,
    file: UploadedFileBuffer,
  ): Promise<GenArchivoRecord> {
    if (!file.buffer?.length) {
      throw new Error('Archivo vacío');
    }

    const originalFileName = safeFilename(file.originalname);
    const objectKey = buildStorageObjectKey({
      ...input,
      originalFileName,
    });
    const bucket = this.storage.getBucket();

    await this.storage.putObject(objectKey, file.buffer, file.mimetype);

    const applicationId =
      input.applicationId ??
      (await this.resolveApplicationId(input.applicationSlug));

    const row = await this.prisma.genArchivo.create({
      data: {
        applicationId,
        applicationSlug: input.applicationSlug,
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId,
        category: input.category ?? null,
        bucket,
        objectKey,
        originalFileName,
        mimeType: file.mimetype ?? null,
        sizeBytes: file.buffer.length,
        createdBy: input.createdBy ?? null,
      },
    });

    return {
      id: row.id,
      bucket: row.bucket,
      objectKey: row.objectKey,
      originalFileName: row.originalFileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      legacyFilePath: row.legacyFilePath,
    };
  }

  async findById(id: string): Promise<GenArchivoRecord | null> {
    const row = await this.prisma.genArchivo.findFirst({
      where: { id, deletedAt: null },
    });
    if (!row) return null;
    return {
      id: row.id,
      bucket: row.bucket,
      objectKey: row.objectKey,
      originalFileName: row.originalFileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      legacyFilePath: row.legacyFilePath,
    };
  }

  async getPresignedDownloadUrl(
    archivoId: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const archivo = await this.findById(archivoId);
    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return this.storage.getPresignedDownloadUrl(
      archivo.objectKey,
      expiresInSeconds,
    );
  }

  /** URL de descarga para respuestas API (MinIO o legacy /uploads). */
  async resolveDownloadUrl(
    archivoId: string | null | undefined,
    legacyFilePath: string | null | undefined,
    expiresInSeconds = 3600,
  ): Promise<string | null> {
    if (archivoId) {
      return this.getPresignedDownloadUrl(archivoId, expiresInSeconds);
    }
    if (legacyFilePath?.trim()) {
      const base =
        process.env.API_PUBLIC_URL?.replace(/\/$/, '') ||
        `http://localhost:${process.env.PORT ?? 4001}`;
      const path = legacyFilePath.replace(/^uploads\//, '');
      return `${base}/uploads/${path}`;
    }
    return null;
  }

  async softDelete(archivoId: string): Promise<void> {
    const archivo = await this.findById(archivoId);
    if (!archivo) return;
    await this.storage.deleteObject(archivo.objectKey);
    await this.prisma.genArchivo.update({
      where: { id: archivoId },
      data: { deletedAt: new Date() },
    });
  }
}
