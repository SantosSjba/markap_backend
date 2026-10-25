import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  FileStoragePort,
  type UploadedFileBuffer,
} from '../../../../../shared/application/ports/file-storage.port';
import type { PropertyMediaItem } from '../../../domain/entities/property.entity';
import { PropertyLookupPort } from '../../ports/property-lookup.port';
import { PROPERTY_PORT, type PropertyPort } from '../../ports/property.port';
@Injectable()
export class UploadPropertyMediaUseCase {
  constructor(
    @Inject(PROPERTY_PORT) private readonly properties: PropertyPort,
    private readonly genArchivo: FileStoragePort,
    private readonly lookup: PropertyLookupPort,
  ) {}
  async execute(
    id: string,
    applicationSlug: string | undefined,
    kindInput: string | undefined,
    file?: UploadedFileBuffer,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    const kind = kindInput === 'plan' ? 'plan' : 'photo';
    const property = await this.properties.getPropertyById(id, applicationSlug);
    const resolvedSlug = await this.lookup.applicationSlug(
      property.applicationId,
    );
    const slug = applicationSlug?.trim() || resolvedSlug || 'alquileres';

    const archivo = await this.genArchivo.upload(
      {
        applicationSlug: slug,
        module: 'properties',
        entityType: 'property',
        entityId: id,
        category: kind,
      },
      file,
    );

    const existing: PropertyMediaItem[] = [...(property.mediaItems ?? [])];
    const item: PropertyMediaItem = {
      url: archivo.objectKey,
      kind,
      archivoId: archivo.id,
    };
    existing.push(item);

    const updated = await this.properties.updateProperty(
      { id, mediaItems: existing },
      applicationSlug,
    );

    const downloadUrl = await this.genArchivo.resolveDownloadUrl(
      archivo.id,
      archivo.objectKey,
    );

    return {
      mediaItem: item,
      downloadUrl,
      mediaItems: updated.mediaItems,
      property: updated,
    };
  }
}
