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
  CancelProduccionWorkOrderUseCase,
  CompleteProduccionWorkOrderUseCase,
  ConsumeProduccionWorkOrderMaterialsUseCase,
  CreateProduccionWorkOrderUseCase,
  DeleteProduccionWorkOrderUseCase,
  GetProduccionWorkOrderByIdUseCase,
  GetProduccionWorkOrderStatsUseCase,
  ListProduccionWorkOrdersUseCase,
  StartProduccionWorkOrderUseCase,
  UpdateProduccionWorkOrderStageUseCase,
  UpdateProduccionWorkOrderUseCase,
} from '../../../application/use-cases/produccion-work-orders';
import type {
  ProduccionWorkOrderPriority,
  ProduccionWorkOrderStatus,
} from '@domain/repositories/produccion-work-order.repository';
import {
  ConsumeProduccionWorkOrderMaterialsDto,
  CreateProduccionWorkOrderDto,
  UpdateProduccionWorkOrderDto,
  UpdateProduccionWorkOrderStageDto,
} from '../dtos/produccion-work-orders/work-order.dto';

@ApiTags('Producción — Órdenes de trabajo')
@Controller('produccion-work-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionWorkOrdersController {
  constructor(
    private readonly listUc: ListProduccionWorkOrdersUseCase,
    private readonly statsUc: GetProduccionWorkOrderStatsUseCase,
    private readonly getByIdUc: GetProduccionWorkOrderByIdUseCase,
    private readonly createUc: CreateProduccionWorkOrderUseCase,
    private readonly updateUc: UpdateProduccionWorkOrderUseCase,
    private readonly startUc: StartProduccionWorkOrderUseCase,
    private readonly updateStageUc: UpdateProduccionWorkOrderStageUseCase,
    private readonly completeUc: CompleteProduccionWorkOrderUseCase,
    private readonly cancelUc: CancelProduccionWorkOrderUseCase,
    private readonly consumeUc: ConsumeProduccionWorkOrderMaterialsUseCase,
    private readonly deleteUc: DeleteProduccionWorkOrderUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar órdenes de trabajo' })
  list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('stageKey') stageKey?: string,
    @Query('clientId') clientId?: string,
    @Query('priority') priority?: string,
  ) {
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
      status: validStatuses.includes(status as ProduccionWorkOrderStatus)
        ? (status as ProduccionWorkOrderStatus)
        : undefined,
      stageKey: stageKey?.trim() || undefined,
      clientId: clientId?.trim() || undefined,
      priority: validPriorities.includes(priority as ProduccionWorkOrderPriority)
        ? (priority as ProduccionWorkOrderPriority)
        : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de OT' })
  stats(@Query('applicationSlug') applicationSlug?: string) {
    return this.statsUc.execute(applicationSlug ?? 'produccion');
  }

  @Post()
  create(
    @Body() dto: CreateProduccionWorkOrderDto,
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
    @Body() dto: UpdateProduccionWorkOrderDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Iniciar producción' })
  start(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.startUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Patch(':id/stages/:stageId')
  @ApiOperation({ summary: 'Actualizar etapa (asignar, completar)' })
  updateStage(
    @Param('id') id: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateProduccionWorkOrderStageDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateStageUc.execute(id, stageId, applicationSlug ?? 'produccion', dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Marcar OT como terminada' })
  complete(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.completeUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.cancelUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/consume-materials')
  @ApiOperation({ summary: 'Registrar consumo de materiales (salida inventario)' })
  consumeMaterials(
    @Param('id') id: string,
    @Body() dto: ConsumeProduccionWorkOrderMaterialsDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.consumeUc.execute(id, applicationSlug ?? 'produccion', dto.items);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  delete(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.deleteUc.execute(id, applicationSlug ?? 'produccion');
  }
}
