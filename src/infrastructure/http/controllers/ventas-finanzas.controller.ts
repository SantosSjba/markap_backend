import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { VentasFinanzasOperationsService } from '../../../application/services';

@ApiTags('Ventas — Finanzas')
@Controller('ventas-finanzas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VentasFinanzasController {
  constructor(private readonly finanzas: VentasFinanzasOperationsService) {}

  @Get('buyer-payments')
  @ApiOperation({ summary: 'Pagos del comprador (inicial / cuotas) por cierre' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'buyerClientId', required: false })
  @ApiQuery({ name: 'kind', required: false, enum: ['DOWN_PAYMENT', 'INSTALLMENT'] })
  @ApiQuery({
    name: 'displayStatus',
    required: false,
    enum: ['PENDING', 'PAID', 'OVERDUE'],
  })
  async listBuyerPayments(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('buyerClientId') buyerClientId?: string,
    @Query('kind') kind?: string,
    @Query('displayStatus') displayStatus?: 'PENDING' | 'PAID' | 'OVERDUE',
  ) {
    return this.finanzas.listBuyerPayments({
      applicationSlug: applicationSlug ?? 'ventas',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      buyerClientId: buyerClientId?.trim() || undefined,
      kind: kind as never,
      displayStatus,
    });
  }

  @Post('buyer-payments')
  @ApiOperation({ summary: 'Registrar cuota o inicial' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async createBuyerPayment(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      saleClosingId: string;
      kind: string;
      amount: number;
      currency?: string;
      dueDate: string;
      notes?: string | null;
    },
  ) {
    return this.finanzas.createBuyerPayment(applicationSlug, body);
  }

  @Patch('buyer-payments/:id/mark-paid')
  @ApiOperation({ summary: 'Marcar pago como pagado' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async markBuyerPaymentPaid(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body?: { paidAt?: string | null },
  ) {
    return this.finanzas.markBuyerPaymentPaid(id, applicationSlug, body);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Comisiones por cierre' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID'] })
  @ApiQuery({ name: 'agentId', required: false })
  async listCommissions(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'PENDING' | 'PAID',
    @Query('agentId') agentId?: string,
  ) {
    return this.finanzas.listCommissions({
      applicationSlug: applicationSlug ?? 'ventas',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      status,
      agentId: agentId?.trim() || undefined,
    });
  }

  @Patch('commissions/:id/mark-paid')
  @ApiOperation({ summary: 'Marcar comisión como pagada' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async markCommissionPaid(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body?: { paidAt?: string | null },
  ) {
    return this.finanzas.markCommissionPaid(id, applicationSlug, body);
  }

  @Post('commissions/:id/recalculate-from-profile')
  @ApiOperation({ summary: 'Recalcular monto según % configurado del asesor y precio final' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async recalculateCommission(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.finanzas.recalculateCommission(id, applicationSlug);
  }

  @Get('agent-commission-profiles')
  @ApiOperation({ summary: 'Configuración de % de comisión por asesor' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async listProfiles(@Query('applicationSlug') applicationSlug?: string) {
    return this.finanzas.listAgentCommissionProfiles(applicationSlug);
  }

  @Put('agent-commission-profiles')
  @ApiOperation({ summary: 'Crear o actualizar % de comisión del asesor' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async upsertProfile(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { agentId: string; commissionPercent: number },
  ) {
    return this.finanzas.upsertAgentCommissionProfile(applicationSlug, body);
  }

  @Get('documentation-costs')
  @ApiOperation({ summary: 'Costos de documentación (notaría, registros, etc.)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'saleClosingId', required: false })
  @ApiQuery({ name: 'buyerClientId', required: false })
  async listDocCosts(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('saleClosingId') saleClosingId?: string,
    @Query('buyerClientId') buyerClientId?: string,
  ) {
    return this.finanzas.listDocumentationCosts({
      applicationSlug: applicationSlug ?? 'ventas',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
      saleClosingId: saleClosingId?.trim() || undefined,
      buyerClientId: buyerClientId?.trim() || undefined,
    });
  }

  @Post('documentation-costs')
  @ApiOperation({ summary: 'Registrar costo asociado a un cierre' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async createDocCost(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      saleClosingId: string;
      costType: string;
      amount: number;
      currency?: string;
      description?: string | null;
      expenseDate?: string | null;
    },
  ) {
    return this.finanzas.createDocumentationCost(applicationSlug, body);
  }

  @Get('closings/:closingId/profitability')
  @ApiOperation({ summary: 'Resumen de rentabilidad (precio − gastos docs − comisión)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async profitability(
    @Param('closingId') closingId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.finanzas.getClosingProfitability(closingId, applicationSlug);
  }
}
