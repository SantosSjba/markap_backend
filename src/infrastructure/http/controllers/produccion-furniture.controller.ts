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
  CreateProduccionFurnitureUseCase,
  DeleteProduccionFurnitureUseCase,
  GetProduccionFurnitureByIdUseCase,
  GetProduccionFurnitureStatsUseCase,
  ListProduccionFurnitureUseCase,
  UpdateProduccionFurnitureUseCase,
} from '../../../application/use-cases/produccion-furniture';
import { CreateProduccionFurnitureDto } from '../dtos/produccion-furniture/create-furniture.dto';
import { UpdateProduccionFurnitureDto } from '../dtos/produccion-furniture/update-furniture.dto';

@ApiTags('Producción — Catálogo de muebles')
@Controller('produccion-furniture')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionFurnitureController {
  constructor(
    private readonly listUc: ListProduccionFurnitureUseCase,
    private readonly statsUc: GetProduccionFurnitureStatsUseCase,
    private readonly getByIdUc: GetProduccionFurnitureByIdUseCase,
    private readonly createUc: CreateProduccionFurnitureUseCase,
    private readonly updateUc: UpdateProduccionFurnitureUseCase,
    private readonly deleteUc: DeleteProduccionFurnitureUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar muebles del catálogo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    let activeFilter: boolean | undefined;
    if (isActive === 'true') activeFilter = true;
    if (isActive === 'false') activeFilter = false;

    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
      category: category?.trim() || undefined,
      isActive: activeFilter,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas del catálogo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async stats(@Query('applicationSlug') applicationSlug?: string) {
    return this.statsUc.execute(applicationSlug ?? 'produccion');
  }

  @Post()
  @ApiOperation({ summary: 'Crear mueble en catálogo' })
  async create(
    @Body() dto: CreateProduccionFurnitureDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'produccion', {
      code: dto.code,
      name: dto.name,
      category: dto.category,
      description: dto.description ?? null,
      widthCm: dto.widthCm ?? null,
      depthCm: dto.depthCm ?? null,
      heightCm: dto.heightCm ?? null,
      referencePrice: dto.referencePrice,
      technicalSheetUrl: dto.technicalSheetUrl ?? null,
      notes: dto.notes ?? null,
      isActive: dto.isActive,
      imageUrls: dto.imageUrls,
      bomLines: dto.bomLines?.map((l) => ({
        materialName: l.materialName,
        unit: l.unit,
        quantity: l.quantity,
        notes: l.notes ?? null,
      })),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de mueble' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar mueble' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProduccionFurnitureDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar mueble del catálogo' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteUc.execute(id, applicationSlug ?? 'produccion');
  }
}
