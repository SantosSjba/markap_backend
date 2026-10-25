import { Module } from '@nestjs/common';
import { FileStoragePort } from '../../application/ports/file-storage.port';
import { PrismaModule } from '../database/prisma.module';
import { GenArchivoService } from './gen-archivo.service';
import { MinioObjectStorageService } from './minio-object-storage.service';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: FileStoragePort, useExisting: GenArchivoService },
    MinioObjectStorageService,
    GenArchivoService,
  ],
  exports: [FileStoragePort, MinioObjectStorageService, GenArchivoService],
})
export class StorageModule {}
