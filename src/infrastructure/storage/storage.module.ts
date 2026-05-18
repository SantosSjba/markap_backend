import { Global, Module } from '@nestjs/common';
import { GenArchivoService } from '../../application/services/gen-archivo.service';
import { DatabaseModule } from '../database/database.module';
import { MinioObjectStorageService } from './minio-object-storage.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [MinioObjectStorageService, GenArchivoService],
  exports: [MinioObjectStorageService, GenArchivoService],
})
export class StorageModule {}
