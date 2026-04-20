import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { GetPaymentStatsUseCase } from '../../../application/use-cases/payments/get-payment-stats.use-case';
import { ListPendingPaymentsUseCase } from '../../../application/use-cases/payments/list-pending-payments.use-case';
import { RegisterPaymentUseCase } from '../../../application/use-cases/payments/register-payment.use-case';
import { ListPaymentHistoryUseCase } from '../../../application/use-cases/payments/list-payment-history.use-case';
import { ListOverduePaymentsUseCase } from '../../../application/use-cases/payments/list-overdue-payments.use-case';
import { RegisterPaymentDto } from '../dtos/payments';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly getStatsUseCase: GetPaymentStatsUseCase,
    private readonly listPendingUseCase: ListPendingPaymentsUseCase,
    private readonly registerPaymentUseCase: RegisterPaymentUseCase,
    private readonly listHistoryUseCase: ListPaymentHistoryUseCase,
    private readonly listOverdueUseCase: ListOverduePaymentsUseCase,
  ) {}

  /** GET /payments/stats?applicationSlug=alquileres */
  @Get('stats')
  async getStats(@Query('applicationSlug') applicationSlug: string) {
    return this.getStatsUseCase.execute(applicationSlug ?? 'alquileres');
  }

  /** GET /payments/pending?applicationSlug=alquileres&search=&status= */
  @Get('pending')
  async listPending(
    @Query('applicationSlug') applicationSlug: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.listPendingUseCase.execute({
      applicationSlug: applicationSlug ?? 'alquileres',
      search,
      status,
    });
  }

  /** POST /payments/:id/register */
  @Post(':id/register')
  @HttpCode(HttpStatus.OK)
  async registerPayment(
    @Param('id') id: string,
    @Body() dto: RegisterPaymentDto,
    @Request() req: any,
  ) {
    return this.registerPaymentUseCase.execute({
      paymentId: id,
      paidDate: new Date(dto.paidDate),
      paidAmount: dto.paidAmount,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      notes: dto.notes,
      registeredBy: req.user?.id ?? null,
    });
  }

  /** GET /payments/history?applicationSlug=&search=&periodYear=&periodMonth=&paymentMethod=&page=&limit= */
  @Get('history')
  async listHistory(
    @Query('applicationSlug') applicationSlug: string,
    @Query('search') search?: string,
    @Query('periodYear') periodYear?: string,
    @Query('periodMonth') periodMonth?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listHistoryUseCase.execute({
      applicationSlug: applicationSlug ?? 'alquileres',
      search,
      periodYear: periodYear ? parseInt(periodYear, 10) : undefined,
      periodMonth: periodMonth ? parseInt(periodMonth, 10) : undefined,
      paymentMethod: paymentMethod || undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /** GET /payments/overdue?applicationSlug=alquileres&search= */
  @Get('overdue')
  async listOverdue(
    @Query('applicationSlug') applicationSlug: string,
    @Query('search') search?: string,
  ) {
    return this.listOverdueUseCase.execute(applicationSlug ?? 'alquileres', search);
  }
}
