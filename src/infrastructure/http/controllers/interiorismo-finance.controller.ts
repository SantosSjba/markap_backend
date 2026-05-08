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
  CreateInteriorFinancePaymentUseCase,
  CreateInteriorFinanceScheduleUseCase,
  DeleteInteriorFinancePaymentUseCase,
  DeleteInteriorFinanceScheduleUseCase,
  GetInteriorFinanceOverviewUseCase,
  UpdateInteriorFinancePaymentUseCase,
  UpdateInteriorFinanceScheduleUseCase,
} from '../../../application/use-cases/interior-finance';
import { CreateInteriorFinanceScheduleDto } from '../dtos/interiorismo-finance/create-finance-schedule.dto';
import { UpdateInteriorFinanceScheduleDto } from '../dtos/interiorismo-finance/update-finance-schedule.dto';
import { CreateInteriorFinancePaymentDto } from '../dtos/interiorismo-finance/create-finance-payment.dto';
import { UpdateInteriorFinancePaymentDto } from '../dtos/interiorismo-finance/update-finance-payment.dto';

function parseIsoDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('INVALID_DATE');
  return d;
}

@ApiTags('Interiorismo — Finanzas')
@Controller('interiorismo-finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoFinanceController {
  constructor(
    private readonly overviewUc: GetInteriorFinanceOverviewUseCase,
    private readonly createScheduleUc: CreateInteriorFinanceScheduleUseCase,
    private readonly updateScheduleUc: UpdateInteriorFinanceScheduleUseCase,
    private readonly deleteScheduleUc: DeleteInteriorFinanceScheduleUseCase,
    private readonly createPaymentUc: CreateInteriorFinancePaymentUseCase,
    private readonly updatePaymentUc: UpdateInteriorFinancePaymentUseCase,
    private readonly deletePaymentUc: DeleteInteriorFinancePaymentUseCase,
  ) {}

  @Get('projects/:projectId/overview')
  @ApiOperation({
    summary:
      'Panel financiero: presupuesto, programación (adelantos/cuotas), pagos, egresos por ejecución, flujo de caja y rentabilidad',
  })
  @ApiParam({ name: 'projectId' })
  async overview(@Param('projectId') projectId: string, @Query('applicationSlug') applicationSlug?: string) {
    const row = await this.overviewUc.execute(projectId, applicationSlug ?? 'interiorismo');
    if (!row) throw new NotFoundException('Proyecto no encontrado');
    return row;
  }

  @Post('projects/:projectId/schedules')
  @ApiOperation({ summary: 'Crear adelanto o cuota programada' })
  async createSchedule(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInteriorFinanceScheduleDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createScheduleUc.execute(projectId, applicationSlug ?? 'interiorismo', {
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
    @Body() dto: UpdateInteriorFinanceScheduleDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateScheduleUc.execute(projectId, scheduleId, applicationSlug ?? 'interiorismo', {
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
    await this.deleteScheduleUc.execute(projectId, scheduleId, applicationSlug ?? 'interiorismo');
  }

  @Post('projects/:projectId/payments')
  @ApiOperation({ summary: 'Registrar pago del cliente (opcionalmente ligado a una cuota)' })
  async createPayment(
    @Param('projectId') projectId: string,
    @Body() dto: CreateInteriorFinancePaymentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createPaymentUc.execute(projectId, applicationSlug ?? 'interiorismo', {
      paidAt: parseIsoDate(dto.paidAt),
      amount: dto.amount,
      concept: dto.concept,
      status: dto.status,
      scheduleItemId: dto.scheduleItemId ?? null,
    });
  }

  @Patch('projects/:projectId/payments/:paymentId')
  @ApiOperation({ summary: 'Actualizar pago (estado, montos, vínculo a cuota)' })
  async updatePayment(
    @Param('projectId') projectId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateInteriorFinancePaymentDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updatePaymentUc.execute(projectId, paymentId, applicationSlug ?? 'interiorismo', {
      paidAt: dto.paidAt !== undefined ? parseIsoDate(dto.paidAt) : undefined,
      amount: dto.amount,
      concept: dto.concept,
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
    await this.deletePaymentUc.execute(projectId, paymentId, applicationSlug ?? 'interiorismo');
  }
}
