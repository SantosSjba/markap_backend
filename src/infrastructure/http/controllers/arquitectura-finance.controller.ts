import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateArquitecturaFinancePaymentUseCase,
  CreateArquitecturaFinanceScheduleUseCase,
  DeleteArquitecturaFinancePaymentUseCase,
  DeleteArquitecturaFinanceScheduleUseCase,
  GetArquitecturaFinanceOverviewUseCase,
  UpdateArquitecturaFinancePaymentUseCase,
  UpdateArquitecturaFinanceScheduleUseCase,
} from '../../../application/use-cases/arquitectura-finance';
import { CreateArquitecturaFinanceScheduleDto } from '../dtos/arquitectura-finance/create-finance-schedule.dto';
import { UpdateArquitecturaFinanceScheduleDto } from '../dtos/arquitectura-finance/update-finance-schedule.dto';
import { CreateArquitecturaFinancePaymentDto } from '../dtos/arquitectura-finance/create-finance-payment.dto';
import { UpdateArquitecturaFinancePaymentDto } from '../dtos/arquitectura-finance/update-finance-payment.dto';

function parseIsoDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('INVALID_DATE');
  return d;
}

@ApiTags('Arquitectura — Finanzas')
@Controller('arquitectura-finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaFinanceController {
  constructor(
    private readonly overviewUc: GetArquitecturaFinanceOverviewUseCase,
    private readonly createScheduleUc: CreateArquitecturaFinanceScheduleUseCase,
    private readonly updateScheduleUc: UpdateArquitecturaFinanceScheduleUseCase,
    private readonly deleteScheduleUc: DeleteArquitecturaFinanceScheduleUseCase,
    private readonly createPaymentUc: CreateArquitecturaFinancePaymentUseCase,
    private readonly updatePaymentUc: UpdateArquitecturaFinancePaymentUseCase,
    private readonly deletePaymentUc: DeleteArquitecturaFinancePaymentUseCase,
  ) {}

  @Get('projects/:projectId/overview')
  @ApiOperation({
    summary:
      'Panel financiero: presupuesto, programación (adelantos/cuotas), pagos, egresos por ejecución, flujo de caja y rentabilidad',
  })
  @ApiParam({ name: 'projectId' })
  async overview(@Param('projectId') projectId: string, @Query('applicationSlug') applicationSlug?: string) {
    const row = await this.overviewUc.execute(projectId, applicationSlug ?? 'arquitectura');
    if (!row) throw new NotFoundException('Proyecto no encontrado');
    return row;
  }

  @Post('projects/:projectId/schedules')
  @ApiOperation({ summary: 'Crear adelanto o cuota programada' })
  async createSchedule(
    @Param('projectId') projectId: string,
    @Body() dto: CreateArquitecturaFinanceScheduleDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createScheduleUc.execute(projectId, applicationSlug ?? 'arquitectura', {
      kind: dto.kind,
      dueDate: parseIsoDate(dto.dueDate),
      amount: dto.amount,
      concept: dto.concept,
      sortOrder: dto.sortOrder,
    });
  }

  @Patch('projects/:projectId/schedules/:scheduleId')
  @ApiOperation({ summary: 'Actualizar programación de cobro (puede marcar WAIVED)' })
  async updateSchedule(
    @Param('projectId') projectId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateArquitecturaFinanceScheduleDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateScheduleUc.execute(projectId, scheduleId, applicationSlug ?? 'arquitectura', {
      kind: dto.kind,
      dueDate: dto.dueDate !== undefined ? parseIsoDate(dto.dueDate) : undefined,
      amount: dto.amount,
      concept: dto.concept,
      sortOrder: dto.sortOrder,
      status: dto.status,
    });
  }

  @Delete('projects/:projectId/schedules/:scheduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar programación de cobro' })
  async deleteSchedule(
    @Param('projectId') projectId: string,
    @Param('scheduleId') scheduleId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deleteScheduleUc.execute(projectId, scheduleId, applicationSlug ?? 'arquitectura');
  }

  @Post('projects/:projectId/payments')
  @ApiOperation({ summary: 'Registrar pago del cliente (opcionalmente ligado a una cuota)' })
  async createPayment(
    @Param('projectId') projectId: string,
    @Body() dto: CreateArquitecturaFinancePaymentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createPaymentUc.execute(projectId, applicationSlug ?? 'arquitectura', {
      paidAt: parseIsoDate(dto.paidAt),
      amount: dto.amount,
      concept: dto.concept,
      paymentType: dto.paymentType ?? 'OTHER',
      status: dto.status,
      scheduleItemId: dto.scheduleItemId ?? null,
    });
  }

  @Patch('projects/:projectId/payments/:paymentId')
  @ApiOperation({ summary: 'Actualizar pago (estado, montos, vínculo a cuota)' })
  async updatePayment(
    @Param('projectId') projectId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateArquitecturaFinancePaymentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updatePaymentUc.execute(projectId, paymentId, applicationSlug ?? 'arquitectura', {
      paidAt: dto.paidAt !== undefined ? parseIsoDate(dto.paidAt) : undefined,
      amount: dto.amount,
      concept: dto.concept,
      paymentType: dto.paymentType,
      status: dto.status,
      scheduleItemId: dto.scheduleItemId,
    });
  }

  @Delete('projects/:projectId/payments/:paymentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar registro de pago' })
  async deletePayment(
    @Param('projectId') projectId: string,
    @Param('paymentId') paymentId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    await this.deletePaymentUc.execute(projectId, paymentId, applicationSlug ?? 'arquitectura');
  }
}
