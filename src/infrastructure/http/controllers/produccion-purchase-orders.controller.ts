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
  CancelProduccionPurchaseOrderUseCase,
  CreateProduccionPurchaseOrderUseCase,
  DeleteProduccionPurchaseOrderUseCase,
  GetProduccionPurchaseOrderByIdUseCase,
  ListProduccionPurchaseOrdersUseCase,
  ReceiveProduccionPurchaseOrderUseCase,
  SendProduccionPurchaseOrderUseCase,
  UpdateProduccionPurchaseOrderUseCase,
} from '../../../application/use-cases/produccion-purchase-orders';
import type { ProduccionPurchaseOrderStatus } from '@domain/repositories/produccion-purchase-order.repository';
import {
  CreateProduccionPurchaseOrderDto,
  ReceiveProduccionPurchaseOrderDto,
  UpdateProduccionPurchaseOrderDto,
} from '../dtos/produccion-purchases/purchase-order.dto';

@ApiTags('Producción — Compras (órdenes)')
@Controller('produccion-purchase-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionPurchaseOrdersController {
  constructor(
    private readonly listUc: ListProduccionPurchaseOrdersUseCase,
    private readonly getByIdUc: GetProduccionPurchaseOrderByIdUseCase,
    private readonly createUc: CreateProduccionPurchaseOrderUseCase,
    private readonly updateUc: UpdateProduccionPurchaseOrderUseCase,
    private readonly sendUc: SendProduccionPurchaseOrderUseCase,
    private readonly receiveUc: ReceiveProduccionPurchaseOrderUseCase,
    private readonly cancelUc: CancelProduccionPurchaseOrderUseCase,
    private readonly deleteUc: DeleteProduccionPurchaseOrderUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    const validStatuses = ['DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const;
    const statusFilter = validStatuses.includes(status as ProduccionPurchaseOrderStatus)
      ? (status as ProduccionPurchaseOrderStatus)
      : undefined;

    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
      status: statusFilter,
      supplierId: supplierId?.trim() || undefined,
    });
  }

  @Post()
  create(
    @Body() dto: CreateProduccionPurchaseOrderDto,
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
    @Body() dto: UpdateProduccionPurchaseOrderDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Enviar orden (borrador → enviada)' })
  send(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.sendUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Registrar recepción parcial o total' })
  receive(
    @Param('id') id: string,
    @Body() dto: ReceiveProduccionPurchaseOrderDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.receiveUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar orden' })
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
