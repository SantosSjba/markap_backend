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
  AcceptProduccionQuotationUseCase,
  ConvertProduccionQuotationToOrderUseCase,
  CreateProduccionQuotationUseCase,
  DeleteProduccionQuotationUseCase,
  GetProduccionQuotationByIdUseCase,
  ListProduccionQuotationsUseCase,
  RejectProduccionQuotationUseCase,
  SendProduccionQuotationUseCase,
  UpdateProduccionQuotationUseCase,
} from '../../../application/use-cases/produccion-sales';
import type { ProduccionQuotationStatus } from '@domain/repositories/produccion-sales.repository';
import {
  CreateProduccionQuotationDto,
  UpdateProduccionQuotationDto,
} from '../dtos/produccion-sales/sales.dto';

@ApiTags('Producción — Cotizaciones')
@Controller('produccion-quotations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionQuotationsController {
  constructor(
    private readonly listUc: ListProduccionQuotationsUseCase,
    private readonly getByIdUc: GetProduccionQuotationByIdUseCase,
    private readonly createUc: CreateProduccionQuotationUseCase,
    private readonly updateUc: UpdateProduccionQuotationUseCase,
    private readonly sendUc: SendProduccionQuotationUseCase,
    private readonly acceptUc: AcceptProduccionQuotationUseCase,
    private readonly rejectUc: RejectProduccionQuotationUseCase,
    private readonly convertUc: ConvertProduccionQuotationToOrderUseCase,
    private readonly deleteUc: DeleteProduccionQuotationUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar cotizaciones' })
  list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const;
    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      search: search?.trim() || undefined,
      status: validStatuses.includes(status as ProduccionQuotationStatus)
        ? (status as ProduccionQuotationStatus)
        : undefined,
      clientId: clientId?.trim() || undefined,
    });
  }

  @Post()
  create(
    @Body() dto: CreateProduccionQuotationDto,
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
    @Body() dto: UpdateProduccionQuotationDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(id, applicationSlug ?? 'produccion', dto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Enviar cotización al cliente' })
  send(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.sendUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Marcar cotización como aceptada' })
  accept(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.acceptUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.rejectUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Post(':id/convert-to-order')
  @ApiOperation({ summary: 'Generar pedido desde cotización aceptada' })
  convertToOrder(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.convertUc.execute(id, applicationSlug ?? 'produccion');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  delete(@Param('id') id: string, @Query('applicationSlug') applicationSlug?: string) {
    return this.deleteUc.execute(id, applicationSlug ?? 'produccion');
  }
}
