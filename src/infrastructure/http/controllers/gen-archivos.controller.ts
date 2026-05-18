import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GenArchivoService } from '../../../application/services/gen-archivo.service';

@ApiTags('Archivos')
@Controller('gen-archivos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GenArchivosController {
  constructor(private readonly genArchivo: GenArchivoService) {}

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
    const seconds = expiresIn ? Math.min(86400, Math.max(60, parseInt(expiresIn, 10))) : 3600;
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
