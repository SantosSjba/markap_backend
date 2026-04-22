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
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PAYMENT_PORT, type PaymentPort } from '@application/ports';
import { RegisterPaymentDto } from '../dtos/payments';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(@Inject(PAYMENT_PORT) private readonly payments: PaymentPort) {}

  /** GET /payments/stats?applicationSlug=alquileres */
  @Get('stats')
  async getStats(@Query('applicationSlug') applicationSlug: string) {
    return this.payments.getStats(applicationSlug ?? 'alquileres');
  }

  /** GET /payments/pending?applicationSlug=alquileres&search=&status= */
  @Get('pending')
  async listPending(
    @Query('applicationSlug') applicationSlug: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.payments.listPending({
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
    return this.payments.registerPayment({
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
    return this.payments.listHistory({
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
    return this.payments.listOverdue(applicationSlug ?? 'alquileres', search);
  }
}
