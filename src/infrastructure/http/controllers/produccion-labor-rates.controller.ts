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
  CreateProduccionLaborRateUseCase,
  DeleteProduccionLaborRateUseCase,
  GetProduccionLaborRateByIdUseCase,
  ListProduccionLaborRatesUseCase,
  UpdateProduccionLaborRateUseCase,
} from '../../../application/use-cases/produccion-labor-rates';
import {
  CreateProduccionLaborRateDto,
  UpdateProduccionLaborRateDto,
} from '../dtos/produccion-costs/labor-rate.dto';

@ApiTags('Producción — Mano de obra')
@Controller('produccion-labor-rates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionLaborRatesController {
  constructor(
    private readonly listUc: ListProduccionLaborRatesUseCase,
    private readonly getByIdUc: GetProduccionLaborRateByIdUseCase,
    private readonly createUc: CreateProduccionLaborRateUseCase,
    private readonly updateUc: UpdateProduccionLaborRateUseCase,
    private readonly deleteUc: DeleteProduccionLaborRateUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar tarifas de mano de obra' })
  async list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    let activeFilter: boolean | undefined;
    if (isActive === 'true') activeFilter = true;
    if (isActive === 'false') activeFilter = false;

    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '50', 10))),
      search: search?.trim() || undefined,
      isActive: activeFilter,
    });
  }

  @Post()
  async create(
    @Body() dto: CreateProduccionLaborRateDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'produccion', dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProduccionLaborRateDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    await this.deleteUc.execute(id, applicationSlug ?? 'produccion');
  }
}
