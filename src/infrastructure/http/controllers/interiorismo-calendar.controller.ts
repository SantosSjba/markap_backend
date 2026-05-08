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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateInteriorCalendarEventUseCase,
  DeleteInteriorCalendarEventUseCase,
  GetInteriorCalendarFeedUseCase,
  UpdateInteriorCalendarEventUseCase,
  parseRange,
} from '../../../application/use-cases/interior-calendar';
import { CreateInteriorCalendarEventDto } from '../dtos/interiorismo-calendar/create-calendar-event.dto';
import { UpdateInteriorCalendarEventDto } from '../dtos/interiorismo-calendar/update-calendar-event.dto';

function parseIsoDateTime(s?: string | null): Date | null | undefined {
  if (s === undefined) return undefined;
  if (s === null || String(s).trim() === '') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@ApiTags('Interiorismo — Calendario')
@Controller('interiorismo-calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoCalendarController {
  constructor(
    private readonly feedUc: GetInteriorCalendarFeedUseCase,
    private readonly createUc: CreateInteriorCalendarEventUseCase,
    private readonly updateUc: UpdateInteriorCalendarEventUseCase,
    private readonly deleteUc: DeleteInteriorCalendarEventUseCase,
  ) {}

  @Get('feed')
  @ApiOperation({
    summary:
      'Agenda unificada: eventos manuales + hitos + tareas de ejecución + vencimientos de cobranzas programados',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'from', required: true, example: '2026-05-01' })
  @ApiQuery({ name: 'to', required: true, example: '2026-05-31' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'agentId', required: false })
  async feed(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('projectId') projectId?: string,
    @Query('agentId') agentId?: string,
  ) {
    const range = parseRange(from, to);
    return this.feedUc.execute({
      applicationSlug: applicationSlug ?? 'interiorismo',
      from: range.from,
      to: range.to,
      projectId: projectId?.trim() || undefined,
      agentId: agentId?.trim() || undefined,
    });
  }

  @Post('events')
  @ApiOperation({ summary: 'Crear reunión, visita, instalación agendada, fecha límite o bloque de equipo' })
  async create(
    @Body() dto: CreateInteriorCalendarEventDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'interiorismo', {
      projectId: dto.projectId ?? null,
      eventType: dto.eventType,
      title: dto.title,
      description: dto.description ?? null,
      location: dto.location ?? null,
      startsAt: new Date(dto.startsAt),
      endsAt: parseIsoDateTime(dto.endsAt ?? undefined) ?? null,
      allDay: dto.allDay ?? false,
      assignedAgentId: dto.assignedAgentId ?? null,
    });
  }

  @Patch('events/:eventId')
  @ApiOperation({ summary: 'Actualizar evento manual' })
  async update(
    @Param('eventId') eventId: string,
    @Body() dto: UpdateInteriorCalendarEventDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(eventId, applicationSlug ?? 'interiorismo', {
      projectId: dto.projectId,
      eventType: dto.eventType,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      startsAt: dto.startsAt !== undefined ? new Date(dto.startsAt) : undefined,
      endsAt:
        dto.endsAt === undefined
          ? undefined
          : dto.endsAt === null
            ? null
            : parseIsoDateTime(dto.endsAt),
      allDay: dto.allDay,
      assignedAgentId: dto.assignedAgentId,
    });
  }

  @Delete('events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar evento manual' })
  async delete(@Param('eventId') eventId: string, @Query('applicationSlug') applicationSlug?: string) {
    await this.deleteUc.execute(eventId, applicationSlug ?? 'interiorismo');
  }
}
