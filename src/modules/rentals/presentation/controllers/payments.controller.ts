import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { parseDateOnly } from '../../../../shared/domain/utils/peru-date.util';
import type { AuthenticatedRequest } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { parseIntegerQuery } from '../../../../shared/utils/parse-integer-query.util';
import {
  PAYMENT_PORT,
  type PaymentPort,
} from '../../application/ports/payment.port';
import { RegisterPaymentDto } from '../dtos/payments/register-payment.dto';

@UseGuards(JwtAuthGuard)
@RequiresApplication('alquileres')
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
    @Request() req: AuthenticatedRequest,
  ) {
    return this.payments.registerPayment({
      paymentId: id,
      paidDate: parseDateOnly(dto.paidDate),
      paidAmount: dto.paidAmount,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      notes: dto.notes,
      registeredBy: req.user?.sub ?? null,
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
      page: page ? parseIntegerQuery(page, 1, 1, 1000000) : 1,
      limit: limit ? parseIntegerQuery(limit, 20, 1, 100) : 20,
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
