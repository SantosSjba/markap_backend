import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { parseIntegerQuery } from '../../../../shared/utils/parse-integer-query.util';
import {
  CancelProduccionOrderUseCase,
  ConfirmProduccionOrderUseCase,
  CreateProduccionOrderUseCase,
  CreateWorkOrderFromProduccionOrderUseCase,
  DeleteProduccionOrderUseCase,
  GetProduccionOrderByIdUseCase,
  ListProduccionOrdersUseCase,
  MarkProduccionOrderReadyUseCase,
  UpdateProduccionOrderUseCase,
} from '../../application/use-cases/produccion-sales/produccion-sales.use-cases';
import type { ProduccionOrderStatus } from '../../domain/repositories/produccion-sales.repository';
import {
  CreateProduccionOrderDto,
  UpdateProduccionOrderDto,
} from '../dtos/produccion-sales/sales.dto';

@ApiTags('Producción — Pedidos')
@RequiresApplication('produccion')
@Controller('produccion-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionOrdersController {
  constructor(
    private readonly listUc: ListProduccionOrdersUseCase,
    private readonly getByIdUc: GetProduccionOrderByIdUseCase,
    private readonly createUc: CreateProduccionOrderUseCase,
    private readonly updateUc: UpdateProduccionOrderUseCase,
    private readonly confirmUc: ConfirmProduccionOrderUseCase,
    private readonly createWorkOrderUc: CreateWorkOrderFromProduccionOrderUseCase,
    private readonly markReadyUc: MarkProduccionOrderReadyUseCase,
    private readonly cancelUc: CancelProduccionOrderUseCase,
    private readonly deleteUc: DeleteProduccionOrderUseCase,
  ) {}

  @Get()
  list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'IN_PRODUCTION',
      'READY',
      'DELIVERED',
      'CANCELLED',
    ] as const;
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseIntegerQuery(page, 1, 1, 1000000)),
      limit: Math.min(100, Math.max(1, parseIntegerQuery(limit, 20, 1, 100))),
      search: search?.trim() || undefined,
      status: validStatuses.includes(status as ProduccionOrderStatus)
        ? (status as ProduccionOrderStatus)
        : undefined,
      clientId: clientId?.trim() || undefined,
    });
  }

  @Post()
  create(
    @Body() dto: CreateProduccionOrderDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'produccion', dto);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getByIdUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProduccionOrderDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirmar pedido' })
  confirm(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.confirmUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/create-work-order')
  @ApiOperation({ summary: 'Generar orden de trabajo desde pedido' })
  createWorkOrder(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createWorkOrderUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/mark-ready')
  @ApiOperation({ summary: 'Marcar pedido listo para entrega' })
  markReady(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.markReadyUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.cancelUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  delete(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.deleteUc.execute(id, applicationSlug ?? 'produccion');
  }
}
