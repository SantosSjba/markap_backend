import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadJournalOperationsService } from '../../../application/services/contabilidad-journal-operations.service';
import type {
  CreateContabilidadJournalEntryInput,
  ListContabilidadJournalEntriesFilters,
  UpdateContabilidadJournalEntryInput,
} from '@domain/repositories/contabilidad-journal.repository';

@ApiTags('Contabilidad — Asientos contables')
@Controller('contabilidad-journal-entries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadJournalEntriesController {
  constructor(private readonly journal: ContabilidadJournalOperationsService) {}

  @Get()
  @ApiOperation({ summary: 'Libro diario — listado de asientos' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'costCenterId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'legalEntityId', required: false })
  list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('legalEntityId') legalEntityId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('accountId') accountId?: string,
    @Query('costCenterId') costCenterId?: string,
    @Query('search') search?: string,
  ) {
    const filters: ListContabilidadJournalEntriesFilters = {
      legalEntityId,
      periodId,
      status,
      dateFrom,
      dateTo,
      accountId,
      costCenterId,
      search,
    };
    return this.journal.list(applicationSlug, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de asiento con líneas' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getById(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.journal.getById(applicationSlug, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear asiento en borrador' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  create(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateContabilidadJournalEntryInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.journal.create(applicationSlug, body, req.user?.sub ?? null);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar asiento en borrador' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  update(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateContabilidadJournalEntryInput,
  ) {
    return this.journal.update(applicationSlug, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar asiento en borrador' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  deleteDraft(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.journal.deleteDraft(applicationSlug, id);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Publicar asiento (partida doble validada)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  post(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.journal.post(applicationSlug, id, req.user?.sub ?? null);
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reversar asiento publicado' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  reverse(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.journal.reverse(applicationSlug, id, req.user?.sub ?? null);
  }
}
