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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CancelProduccionDeliveryUseCase,
  CompleteProduccionDeliveryUseCase,
  CreateProduccionDeliveryUseCase,
  DeleteProduccionDeliveryUseCase,
  GetProduccionDeliveryByIdUseCase,
  ListProduccionDeliveriesUseCase,
  UpdateProduccionDeliveryUseCase,
} from '../../../application/use-cases/produccion-sales';
import type { ProduccionDeliveryStatus } from '@domain/repositories/produccion-sales.repository';
import {
  CreateProduccionDeliveryDto,
  UpdateProduccionDeliveryDto,
} from '../dtos/produccion-sales/sales.dto';

@ApiTags('Producción — Entregas')
@Controller('produccion-deliveries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionDeliveriesController {
  constructor(
    private readonly listUc: ListProduccionDeliveriesUseCase,
    private readonly getByIdUc: GetProduccionDeliveryByIdUseCase,
    private readonly createUc: CreateProduccionDeliveryUseCase,
    private readonly updateUc: UpdateProduccionDeliveryUseCase,
    private readonly completeUc: CompleteProduccionDeliveryUseCase,
    private readonly cancelUc: CancelProduccionDeliveryUseCase,
    private readonly deleteUc: DeleteProduccionDeliveryUseCase,
  ) {}

  @Get()
  list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
  ) {
    const validStatuses = ['SCHEDULED', 'DELIVERED', 'CANCELLED'] as const;
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
      status: validStatuses.includes(status as ProduccionDeliveryStatus)
        ? (status as ProduccionDeliveryStatus)
        : undefined,
      orderId: orderId?.trim() || undefined,
    });
  }

  @Post()
  create(
    @Body() dto: CreateProduccionDeliveryDto,
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
    @Body() dto: UpdateProduccionDeliveryDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Confirmar entrega realizada' })
  complete(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.completeUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.cancelUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  delete(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.deleteUc.execute(id, applicationSlug ?? 'produccion');
  }
}
