import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
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
import { FileStoragePort } from '../../../../shared/application/ports/file-storage.port';
import { ProjectDocumentUploadDto } from '../../../../shared/presentation/dtos/uploads/upload-requests.dto';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import type { UploadedFile as MulterUploadedFile } from '../../../../shared/types/uploaded-file.types';
import { parseIntegerQuery } from '../../../../shared/utils/parse-integer-query.util';
import { CreateArquitecturaProjectDocumentUseCase } from '../../application/use-cases/arquitectura-project-documents/create-arquitectura-project-document.use-case';
import { DeleteArquitecturaProjectDocumentUseCase } from '../../application/use-cases/arquitectura-project-documents/delete-arquitectura-project-document.use-case';
import { ListArquitecturaProjectDocumentsUseCase } from '../../application/use-cases/arquitectura-project-documents/list-arquitectura-project-documents.use-case';
import { UpdateArquitecturaProjectDocumentUseCase } from '../../application/use-cases/arquitectura-project-documents/update-arquitectura-project-document.use-case';
import {
  ARQUITECTURA_DOCUMENT_TYPES,
  type ArquitecturaDocumentType,
} from '../../domain/repositories/arquitectura-project-document.repository';
import { CreateArquitecturaProjectDocumentDto } from '../dtos/arquitectura-documents/create-arquitectura-project-document.dto';
import { UpdateArquitecturaProjectDocumentDto } from '../dtos/arquitectura-documents/update-arquitectura-project-document.dto';

@ApiTags('Arquitectura - Documentos')
@RequiresApplication('arquitectura')
@Controller('arquitectura-documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaDocumentsController {
  constructor(
    private readonly listUc: ListArquitecturaProjectDocumentsUseCase,
    private readonly createUc: CreateArquitecturaProjectDocumentUseCase,
    private readonly updateUc: UpdateArquitecturaProjectDocumentUseCase,
    private readonly deleteUc: DeleteArquitecturaProjectDocumentUseCase,
    private readonly genArchivo: FileStoragePort,
  ) {}

  private parseDocType(raw?: string): ArquitecturaDocumentType {
    const v = raw?.trim();
    if (!v || !(ARQUITECTURA_DOCUMENT_TYPES as readonly string[]).includes(v)) {
      throw new BadRequestException(
        `docType inválido. Valores: ${ARQUITECTURA_DOCUMENT_TYPES.join(', ')}`,
      );
    }
    return v as ArquitecturaDocumentType;
  }

  private async withDownloadUrl<
    T extends { archivoId: string | null; fileUrl: string | null },
  >(row: T): Promise<T & { downloadUrl: string | null }> {
    if (row.archivoId) {
      const downloadUrl = await this.genArchivo.resolveDownloadUrl(
        row.archivoId,
        null,
      );
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
    @Query('docType') docType?: ArquitecturaDocumentType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
  ) {
    const result = await this.listUc.execute({
      applicationSlug: applicationSlug ?? 'arquitectura',
      docType: this.parseDocType(docType),
      page: Math.max(1, parseIntegerQuery(page, 1, 1, 1000000)),
      limit: Math.min(50, Math.max(1, parseIntegerQuery(limit, 10, 1, 100))),
      search: search?.trim() || undefined,
      projectId: projectId?.trim() || undefined,
    });
    return {
      ...result,
      data: await Promise.all(
        result.data.map((row) => this.withDownloadUrl(row)),
      ),
    };
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Subir archivo y registrar documento en un proyecto',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: ProjectDocumentUploadDto,
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
    const slug = applicationSlug ?? 'arquitectura';
    const archivo = await this.genArchivo.upload(
      {
        applicationSlug: slug,
        module: 'arquitectura-documents',
        entityType: 'arquitectura_project',
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
    @Body() dto: CreateArquitecturaProjectDocumentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const row = await this.createUc.execute({
      applicationSlug: applicationSlug ?? 'arquitectura',
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
    @Body() dto: UpdateArquitecturaProjectDocumentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    const row = await this.updateUc.execute(
      id,
      applicationSlug ?? 'arquitectura',
      dto,
    );
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
    await this.deleteUc.execute(id, applicationSlug ?? 'arquitectura');
  }
}
