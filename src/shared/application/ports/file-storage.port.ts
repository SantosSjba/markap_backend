import type { StorageObjectKeyParams } from '../../utils/build-storage-object-key.util';
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

export interface StoredFileMetadata extends GenArchivoRecord {
  module: string;
  entityType: string;
  entityId: string;
  category: string | null;
  createdAt: Date;
}
export abstract class FileStoragePort {
  abstract findById(id: string): Promise<GenArchivoRecord | null>;
  abstract getPresignedDownloadUrl(
    id: string,
    expiresInSeconds?: number,
  ): Promise<string>;
  abstract upload(
    input: StoreFileInput,
    file: UploadedFileBuffer,
  ): Promise<GenArchivoRecord>;
  abstract findByIdWithMeta(id: string): Promise<StoredFileMetadata | null>;
  abstract listByEntity(
    module: string,
    entityType: string,
    entityId: string,
    filters?: { category?: string },
  ): Promise<StoredFileMetadata[]>;
  abstract resolveDownloadUrl(
    id: string | null | undefined,
    legacyPath: string | null | undefined,
    expiresInSeconds?: number,
  ): Promise<string | null>;
  abstract softDelete(id: string): Promise<void>;
}
