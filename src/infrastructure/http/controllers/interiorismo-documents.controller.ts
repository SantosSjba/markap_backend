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
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
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
    @Body() dto: CreateInteriorProjectDocumentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
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
    @Body() dto: UpdateInteriorProjectDocumentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'interiorismo', dto);
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
