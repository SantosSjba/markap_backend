import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileStoragePort } from '../../application/ports/file-storage.port';
import { parseIntegerQuery } from '../../utils/parse-integer-query.util';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Archivos')
@Controller('gen-archivos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GenArchivosController {
  constructor(private readonly genArchivo: FileStoragePort) {}

  @Get('resolve-url')
  @ApiOperation({
    summary: 'Resolver URL de descarga por objectKey (MinIO) o path legacy',
  })
  @ApiQuery({ name: 'objectKey', required: true })
  @ApiQuery({ name: 'expiresIn', required: false })
  async resolveByObjectKey(
    @Query('objectKey') objectKey: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    if (!objectKey?.trim()) {
      throw new BadRequestException('objectKey es obligatorio');
    }
    const seconds = expiresIn
      ? parseIntegerQuery(expiresIn, 3600, 60, 86400)
      : 3600;
    const url = await this.genArchivo.resolveDownloadUrl(
      null,
      objectKey.trim(),
      seconds,
    );
    if (!url) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return { url, expiresIn: seconds, objectKey: objectKey.trim() };
  }

  @Get(':id/url')
  @ApiOperation({
    summary: 'URL firmada temporal para descargar un archivo (MinIO)',
  })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    description: 'Segundos de validez (default 3600)',
  })
  async getDownloadUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const archivo = await this.genArchivo.findById(id);
    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }
    const seconds = expiresIn
      ? parseIntegerQuery(expiresIn, 3600, 60, 86400)
      : 3600;
    const url = await this.genArchivo.getPresignedDownloadUrl(id, seconds);
    return {
      id,
      url,
      expiresIn: seconds,
      originalFileName: archivo.originalFileName,
      mimeType: archivo.mimeType,
    };
  }
}
