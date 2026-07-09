import {
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
  CreateArquitecturaCatalogMaterialUseCase,
  DeleteArquitecturaCatalogMaterialUseCase,
  GetArquitecturaCatalogMaterialByIdUseCase,
  ListArquitecturaCatalogMaterialsUseCase,
  UpdateArquitecturaCatalogMaterialUseCase,
} from '../../../application/use-cases/arquitectura-catalog-materials';
import { CreateArquitecturaCatalogMaterialDto } from '../dtos/arquitectura-catalog-materials/create-catalog-material.dto';
import { UpdateArquitecturaCatalogMaterialDto } from '../dtos/arquitectura-catalog-materials/update-catalog-material.dto';

@ApiTags('Arquitectura — Materiales (catálogo)')
@Controller('arquitectura-catalog-materials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaCatalogMaterialsController {
  constructor(
    private readonly listUc: ListArquitecturaCatalogMaterialsUseCase,
    private readonly getByIdUc: GetArquitecturaCatalogMaterialByIdUseCase,
    private readonly createUc: CreateArquitecturaCatalogMaterialUseCase,
    private readonly updateUc: UpdateArquitecturaCatalogMaterialUseCase,
    private readonly deleteUc: DeleteArquitecturaCatalogMaterialUseCase,
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
      applicationSlug: applicationSlug ?? 'arquitectura',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
      category: category?.trim() || undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Crear material en catálogo' })
  async create(
    @Body() dto: CreateArquitecturaCatalogMaterialDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'arquitectura', {
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
    return this.getByIdUc.execute(id, applicationSlug ?? 'arquitectura');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar material' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArquitecturaCatalogMaterialDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'arquitectura', dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar material del catálogo' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteUc.execute(id, applicationSlug ?? 'arquitectura');
  }
}
