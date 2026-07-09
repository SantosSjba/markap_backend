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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  ARQUITECTURA_DOCUMENT_TYPES,
  type ArquitecturaDocumentType,
} from '@domain/repositories/arquitectura-project-document.repository';
import {
  CreateArquitecturaProjectDocumentUseCase,
  DeleteArquitecturaProjectDocumentUseCase,
  ListArquitecturaProjectDocumentsUseCase,
  UpdateArquitecturaProjectDocumentUseCase,
} from '../../../application/use-cases/arquitectura-project-documents';
import { CreateArquitecturaProjectDocumentDto } from '../dtos/arquitectura-documents/create-arquitectura-project-document.dto';
import { UpdateArquitecturaProjectDocumentDto } from '../dtos/arquitectura-documents/update-arquitectura-project-document.dto';

@ApiTags('Arquitectura - Documentos')
@Controller('arquitectura-documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaDocumentsController {
  constructor(
    private readonly listUc: ListArquitecturaProjectDocumentsUseCase,
    private readonly createUc: CreateArquitecturaProjectDocumentUseCase,
    private readonly updateUc: UpdateArquitecturaProjectDocumentUseCase,
    private readonly deleteUc: DeleteArquitecturaProjectDocumentUseCase,
  ) {}

  private parseDocType(raw?: string): ArquitecturaDocumentType {
    const v = raw?.trim();
    if (!v || !(ARQUITECTURA_DOCUMENT_TYPES as readonly string[]).includes(v)) {
      throw new BadRequestException(
        `docType invÃ¡lido. Valores: ${ARQUITECTURA_DOCUMENT_TYPES.join(', ')}`,
      );
    }
    return v as ArquitecturaDocumentType;
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos por tipo y aplicaciÃ³n' })
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
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'arquitectura',
      docType: this.parseDocType(docType),
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      projectId: projectId?.trim() || undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Registrar documento en un proyecto' })
  async create(
    @Body() dto: CreateArquitecturaProjectDocumentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute({
      applicationSlug: applicationSlug ?? 'arquitectura',
      projectId: dto.projectId,
      docType: dto.docType,
      title: dto.title,
      fileUrl: dto.fileUrl,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar documento' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArquitecturaProjectDocumentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'arquitectura', dto);
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
