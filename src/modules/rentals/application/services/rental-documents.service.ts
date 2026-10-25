import { Injectable } from '@nestjs/common';
import {
  FileStoragePort,
  type UploadedFileBuffer,
} from '../../../../shared/application/ports/file-storage.port';
import {
  RentalDocumentPort,
  type RentalAttachmentType,
} from '../ports/rental-document.port';
@Injectable()
export class RentalDocumentsService {
  constructor(
    private readonly documents: RentalDocumentPort,
    private readonly files: FileStoragePort,
  ) {}
  async persistAttachment(
    rentalId: string,
    applicationSlug: string,
    type: RentalAttachmentType,
    file: UploadedFileBuffer,
  ): Promise<void> {
    const stored = await this.files.upload(
      {
        applicationSlug,
        module: 'rentals',
        entityType: 'rental',
        entityId: rentalId,
        category: type,
      },
      file,
    );
    await this.documents.replaceAttachment(rentalId, type, stored);
  }
  async saveCommunicationNote(id: string, note: string) {
    await this.documents.saveCommunicationNote(id, note.trim(), new Date());
    return { message: 'Nota guardada correctamente' };
  }
}
