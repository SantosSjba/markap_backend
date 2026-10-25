import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma/prisma.service';
import {
  RentalDocumentPort,
  type RentalAttachmentType,
  type RentalStoredAttachment,
} from '../../application/ports/rental-document.port';
@Injectable()
export class RentalDocumentAdapter extends RentalDocumentPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async replaceAttachment(
    rentalId: string,
    type: RentalAttachmentType,
    archivo: RentalStoredAttachment,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rentals WHERE id = ${rentalId} FOR UPDATE`;
      await tx.rentalAttachment.deleteMany({ where: { rentalId, type } });
      await tx.rentalAttachment.create({
        data: {
          rentalId,
          type,
          archivoId: archivo.id,
          filePath: archivo.objectKey,
          originalFileName: archivo.originalFileName,
        },
      });
    });
  }
  async saveCommunicationNote(
    id: string,
    note: string,
    date: Date,
  ): Promise<void> {
    await this.prisma.rental.update({
      where: { id },
      data: { lastCommunicationNote: note, lastCommunicationDate: date },
    });
  }
}
