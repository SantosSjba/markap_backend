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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateProduccionMaterialUseCase,
  DeleteProduccionMaterialUseCase,
  GetProduccionInventoryStatsUseCase,
  GetProduccionMaterialByIdUseCase,
  ListProduccionMaterialsUseCase,
  UpdateProduccionMaterialUseCase,
} from '../../../application/use-cases/produccion-materials';
import {
  CreateProduccionMaterialDto,
  UpdateProduccionMaterialDto,
} from '../dtos/produccion-inventory/material.dto';

@ApiTags('Producción — Inventario (materiales)')
@Controller('produccion-materials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionMaterialsController {
  constructor(
    private readonly listUc: ListProduccionMaterialsUseCase,
    private readonly statsUc: GetProduccionInventoryStatsUseCase,
    private readonly getByIdUc: GetProduccionMaterialByIdUseCase,
    private readonly createUc: CreateProduccionMaterialUseCase,
    private readonly updateUc: UpdateProduccionMaterialUseCase,
    private readonly deleteUc: DeleteProduccionMaterialUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar materiales de inventario' })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
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
      lowStockOnly: lowStockOnly === 'true',
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de inventario' })
  stats(@Query('applicationSlug') applicationSlug?: string) {
    return this.statsUc.execute(applicationSlug ?? 'produccion');
  }

  @Post()
  create(
    @Body() dto: CreateProduccionMaterialDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'produccion', dto);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProduccionMaterialDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  delete(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.deleteUc.execute(id, applicationSlug ?? 'produccion');
  }
}
