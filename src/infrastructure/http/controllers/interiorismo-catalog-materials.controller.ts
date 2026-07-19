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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateInteriorCatalogMaterialUseCase,
  DeleteInteriorCatalogMaterialUseCase,
  GetInteriorCatalogMaterialByIdUseCase,
  ListInteriorCatalogMaterialsUseCase,
  UpdateInteriorCatalogMaterialUseCase,
} from '../../../application/use-cases/interior-catalog-materials';
import { CreateInteriorCatalogMaterialDto } from '../dtos/interiorismo-catalog-materials/create-catalog-material.dto';
import { UpdateInteriorCatalogMaterialDto } from '../dtos/interiorismo-catalog-materials/update-catalog-material.dto';
import { GenArchivoService } from '../../../application/services/gen-archivo.service';
import type { UploadedFile as MulterUploadedFile } from '../../../common/types';
import { randomUUID } from 'crypto';

@ApiTags('Interiorismo — Materiales (catálogo)')
@Controller('interiorismo-catalog-materials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoCatalogMaterialsController {
  constructor(
    private readonly listUc: ListInteriorCatalogMaterialsUseCase,
    private readonly getByIdUc: GetInteriorCatalogMaterialByIdUseCase,
    private readonly createUc: CreateInteriorCatalogMaterialUseCase,
    private readonly updateUc: UpdateInteriorCatalogMaterialUseCase,
    private readonly deleteUc: DeleteInteriorCatalogMaterialUseCase,
    private readonly genArchivo: GenArchivoService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar materiales del catálogo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
      category: category?.trim() || undefined,
    });
  }

  @Post('upload')
  @ApiOperation({
    summary:
      'Subir ficha técnica o imagen a MinIO; retorna objectKey para guardar en technicalSheetUrl / imageUrls',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: {
          type: 'string',
          enum: ['technical-sheet', 'image'],
          description: 'Default: image',
        },
        materialId: { type: 'string', description: 'Opcional; agrupa archivos bajo el material' },
      },
    },
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { kind?: string; materialId?: string },
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }
    const slug = applicationSlug ?? 'interiorismo';
    const kind = body.kind === 'technical-sheet' ? 'technical-sheet' : 'image';
    const entityId = body.materialId?.trim() || `pending_${randomUUID()}`;
    const archivo = await this.genArchivo.upload(
      {
        applicationSlug: slug,
        module: 'interiorismo-catalog-materials',
        entityType: 'catalog_material',
        entityId,
        category: kind,
      },
      file,
    );
    const downloadUrl = await this.genArchivo.resolveDownloadUrl(
      archivo.id,
      archivo.objectKey,
    );
    return {
      objectKey: archivo.objectKey,
      url: archivo.objectKey,
      archivoId: archivo.id,
      downloadUrl,
      kind,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear material en catálogo' })
  async create(
    @Body() dto: CreateInteriorCatalogMaterialDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'interiorismo', {
      code: dto.code,
      name: dto.name,
      category: dto.category,
      brand: dto.brand,
      unit: dto.unit,
      price: dto.price,
      stock: dto.stock,
      technicalSheetUrl: dto.technicalSheetUrl ?? null,
      imageUrls: dto.imageUrls,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle material' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'interiorismo');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar material' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInteriorCatalogMaterialDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'interiorismo', dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar material del catálogo' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteUc.execute(id, applicationSlug ?? 'interiorismo');
  }
}
