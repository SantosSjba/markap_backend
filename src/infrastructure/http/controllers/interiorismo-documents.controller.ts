import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { UploadedFile as MulterUploadedFile } from '../../../common/types';
import { GenArchivoService } from '../../../application/services/gen-archivo.service';
import {
  INTERIOR_DOCUMENT_TYPES,
  type InteriorDocumentType,
} from '@domain/repositories/interior-project-document.repository';
import {
  CreateInteriorProjectDocumentUseCase,
  DeleteInteriorProjectDocumentUseCase,
  ListInteriorProjectDocumentsUseCase,
  UpdateInteriorProjectDocumentUseCase,
} from '../../../application/use-cases/interior-project-documents';
import { CreateInteriorProjectDocumentDto } from '../dtos/interiorismo-documents/create-interior-project-document.dto';
import { UpdateInteriorProjectDocumentDto } from '../dtos/interiorismo-documents/update-interior-project-document.dto';

@ApiTags('Interiorismo — Documentos')
@Controller('interiorismo-documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoDocumentsController {
  constructor(
    private readonly listUc: ListInteriorProjectDocumentsUseCase,
    private readonly createUc: CreateInteriorProjectDocumentUseCase,
    private readonly updateUc: UpdateInteriorProjectDocumentUseCase,
    private readonly deleteUc: DeleteInteriorProjectDocumentUseCase,
    private readonly genArchivo: GenArchivoService,
  ) {}

  private parseDocType(raw?: string): InteriorDocumentType {
    const v = raw?.trim();
    if (!v || !(INTERIOR_DOCUMENT_TYPES as readonly string[]).includes(v)) {
      throw new BadRequestException(
        `docType inválido. Valores: ${INTERIOR_DOCUMENT_TYPES.join(', ')}`,
      );
    }
    return v as InteriorDocumentType;
  }

  private async withDownloadUrl<T extends { archivoId: string | null; fileUrl: string | null }>(
    row: T,
  ): Promise<T & { downloadUrl: string | null }> {
    if (row.archivoId) {
      const downloadUrl = await this.genArchivo.resolveDownloadUrl(row.archivoId, null);
      return { ...row, downloadUrl };
    }
    const url = row.fileUrl?.trim() || null;
    if (url && /^https?:\/\//i.test(url)) {
      return { ...row, downloadUrl: url };
    }
    return { ...row, downloadUrl: null };
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos por tipo y aplicación' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'docType', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200 })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('docType') docType?: InteriorDocumentType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
  ) {
    const result = await this.listUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
      docType: this.parseDocType(docType),
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      projectId: projectId?.trim() || undefined,
    });
    return {
      ...result,
      data: await Promise.all(result.data.map((row) => this.withDownloadUrl(row))),
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Subir archivo y registrar documento en un proyecto' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      projectId?: string;
      docType?: string;
      title?: string;
    },
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    const projectId = body.projectId?.trim();
    const title = body.title?.trim();
    if (!projectId || !title) {
      throw new BadRequestException('projectId y title son obligatorios');
    }
    const docType = this.parseDocType(body.docType);
    const slug = applicationSlug ?? 'interiorismo';
    const archivo = await this.genArchivo.upload(
      {
        applicationSlug: slug,
        module: 'interiorismo-documents',
        entityType: 'interior_project',
        entityId: projectId,
        category: docType,
      },
      file,
    );
    const row = await this.createUc.execute({
      applicationSlug: slug,
      projectId,
      docType,
      title,
      fileUrl: archivo.objectKey,
      archivoId: archivo.id,
    });
    return this.withDownloadUrl(row);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar documento en un proyecto (JSON legacy)' })
  async create(
    @Body() dto: CreateInteriorProjectDocumentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const row = await this.createUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
      projectId: dto.projectId,
      docType: dto.docType,
      title: dto.title,
      fileUrl: dto.fileUrl,
    });
    return this.withDownloadUrl(row);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar documento' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInteriorProjectDocumentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const row = await this.updateUc.execute(id, applicationSlug ?? 'interiorismo', dto);
    return this.withDownloadUrl(row);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar documento' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteUc.execute(id, applicationSlug ?? 'interiorismo');
  }
}
