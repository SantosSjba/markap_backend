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
  CreateArquitecturaCalendarEventUseCase,
  DeleteArquitecturaCalendarEventUseCase,
  GetArquitecturaCalendarFeedUseCase,
  UpdateArquitecturaCalendarEventUseCase,
  parseRange,
} from '../../../application/use-cases/arquitectura-calendar';
import { CreateArquitecturaCalendarEventDto } from '../dtos/arquitectura-calendar/create-calendar-event.dto';
import { UpdateArquitecturaCalendarEventDto } from '../dtos/arquitectura-calendar/update-calendar-event.dto';

function parseIsoDateTime(s?: string | null): Date | null | undefined {
  if (s === undefined) return undefined;
  if (s === null || String(s).trim() === '') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

@ApiTags('arquitectura â€” Calendario')
@Controller('arquitectura-calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaCalendarController {
  constructor(
    private readonly feedUc: GetArquitecturaCalendarFeedUseCase,
    private readonly createUc: CreateArquitecturaCalendarEventUseCase,
    private readonly updateUc: UpdateArquitecturaCalendarEventUseCase,
    private readonly deleteUc: DeleteArquitecturaCalendarEventUseCase,
  ) {}

  @Get('feed')
  @ApiOperation({
    summary:
      'Agenda unificada: eventos manuales + vencimientos de cobranzas programados',
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
      applicationSlug: applicationSlug ?? 'arquitectura',
      from: range.from,
      to: range.to,
      projectId: projectId?.trim() || undefined,
      agentId: agentId?.trim() || undefined,
    });
  }

  @Post('events')
  @ApiOperation({ summary: 'Crear reunion, visita, visita de obra, fecha limite o bloque de equipo' })
  async create(
    @Body() dto: CreateArquitecturaCalendarEventDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'arquitectura', {
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
    @Body() dto: UpdateArquitecturaCalendarEventDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(eventId, applicationSlug ?? 'arquitectura', {
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
    await this.deleteUc.execute(eventId, applicationSlug ?? 'arquitectura');
  }
}
