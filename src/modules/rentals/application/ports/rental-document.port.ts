export type RentalAttachmentType = 'CONTRACT' | 'DELIVERY_ACT';
export interface RentalStoredAttachment {
  id: string;
  objectKey: string;
  originalFileName: string;
}
export abstract class RentalDocumentPort {
  abstract replaceAttachment(
    rentalId: string,
    type: RentalAttachmentType,
    file: RentalStoredAttachment,
  ): Promise<void>;
  abstract saveCommunicationNote(
    id: string,
    note: string,
    date: Date,
  ): Promise<void>;
}
