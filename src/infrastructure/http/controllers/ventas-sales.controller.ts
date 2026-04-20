import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { VentasSalesOperationsService } from '../../../application/services';
import type { UploadedFile as MulterUploadedFile } from '../../../common/types';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

@ApiTags('Ventas — CRM')
@Controller('ventas-sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VentasSalesController {
  constructor(private readonly ventasSales: VentasSalesOperationsService) {}

  @Get('processes')
  @ApiOperation({ summary: 'Listar procesos de venta (pipeline CRM)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'pipelineStage', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'WON', 'LOST'] })
  async listProcesses(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('pipelineStage') pipelineStage?: string,
    @Query('status') status?: 'ACTIVE' | 'WON' | 'LOST',
  ) {
    return this.ventasSales.listProcesses({
      applicationSlug: applicationSlug ?? 'ventas',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(500, Math.max(1, parseInt(limit ?? '10', 10))),
      search: search?.trim() || undefined,
      pipelineStage: pipelineStage as never,
      status,
    });
  }

  @Post('processes')
  @ApiOperation({ summary: 'Crear proceso de venta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async createProcess(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      buyerClientId: string;
      propertyId: string;
      agentId?: string | null;
      title?: string | null;
      pipelineStage?: string;
    },
  ) {
    return this.ventasSales.createProcess(applicationSlug, body);
  }

  @Get('processes/:id')
  @ApiOperation({ summary: 'Detalle proceso (notas, actividades, recordatorios)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async getProcess(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.ventasSales.getProcessById(id, applicationSlug);
  }

  @Patch('processes/:id')
  @ApiOperation({ summary: 'Actualizar etapa / estado del proceso' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async patchProcess(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      pipelineStage?: string;
      status?: 'ACTIVE' | 'WON' | 'LOST';
      agentId?: string | null;
      title?: string | null;
    },
  ) {
    return this.ventasSales.updateProcess(id, applicationSlug, body);
  }

  @Post('processes/:id/notes')
  @ApiOperation({ summary: 'Agregar nota al proceso' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async addNote(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { text: string; createdBy?: string | null },
  ) {
    return this.ventasSales.addNote(id, applicationSlug, body);
  }

  @Post('processes/:id/activities')
  @ApiOperation({ summary: 'Registrar actividad de seguimiento' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async addActivity(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      activityType: string;
      title: string;
      description?: string | null;
      scheduledAt?: string | null;
      completedAt?: string | null;
    },
  ) {
    return this.ventasSales.addActivity(id, applicationSlug, body);
  }

  @Post('processes/:id/reminders')
  @ApiOperation({ summary: 'Crear recordatorio' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async addReminder(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { title: string; dueAt: string },
  ) {
    return this.ventasSales.addReminder(id, applicationSlug, body);
  }

  @Patch('reminders/:reminderId/complete')
  @ApiOperation({ summary: 'Marcar recordatorio como cumplido' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async completeReminder(
    @Param('reminderId') reminderId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.ventasSales.completeReminder(reminderId, applicationSlug);
  }

  @Get('separations')
  @ApiOperation({ summary: 'Listar separaciones (reservas)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listSeparations(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.ventasSales.listSeparations({
      applicationSlug: applicationSlug ?? 'ventas',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
      status: status as never,
    });
  }

  @Post('separations')
  @ApiOperation({ summary: 'Registrar separación (bloquea propiedad como RESERVED)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async createSeparation(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      propertyId: string;
      buyerClientId: string;
      saleProcessId?: string | null;
      amount: number;
      currency?: string;
      separationDate: string;
      expiresAt?: string | null;
      notes?: string | null;
    },
  ) {
    return this.ventasSales.createSeparation(applicationSlug, body);
  }

  @Patch('separations/:id')
  @ApiOperation({ summary: 'Actualizar separación (estado, notas, vencimiento)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async patchSeparation(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED';
      notes?: string | null;
      expiresAt?: string | null;
    },
  ) {
    return this.ventasSales.patchSeparation(id, applicationSlug, body);
  }

  @Post('separations/:id/receipt')
  @ApiOperation({ summary: 'Subir comprobante de separación' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSeparationReceipt(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      return { error: 'Archivo requerido' };
    }
    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const dir = join(process.cwd(), 'uploads', 'ventas', 'separations', id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, safeName), file.buffer);
    const relativePath = `ventas/separations/${id}/${safeName}`;
    return this.ventasSales.saveSeparationReceiptPath(id, applicationSlug, relativePath);
  }

  @Get('closings')
  @ApiOperation({ summary: 'Listar cierres de venta' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listClosings(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ventasSales.listClosings({
      applicationSlug: applicationSlug ?? 'ventas',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(50, Math.max(1, parseInt(limit ?? '10', 10))),
    });
  }

  @Post('closings')
  @ApiOperation({
    summary: 'Registrar cierre — vende propiedad, cierra separación, gana proceso, comisión PENDING',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async createClosing(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body()
    body: {
      propertyId: string;
      buyerClientId: string;
      saleProcessId?: string | null;
      saleSeparationId?: string | null;
      agentId?: string | null;
      finalPrice: number;
      paymentType: string;
      notes?: string | null;
      commissionAgentId?: string | null;
      commissionAmount?: number;
      commissionPercent?: number | null;
      commissionAutoFromProfile?: boolean;
    },
  ) {
    return this.ventasSales.createClosing(applicationSlug, body);
  }

  @Post('closings/:id/contract')
  @ApiOperation({ summary: 'Adjuntar contrato generado al cierre' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiQuery({ name: 'applicationSlug', required: false })
  async uploadClosingContract(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    if (!file?.buffer?.length) {
      return { error: 'Archivo requerido' };
    }
    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const dir = join(process.cwd(), 'uploads', 'ventas', 'closings', id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, safeName), file.buffer);
    const relativePath = `ventas/closings/${id}/${safeName}`;
    return this.ventasSales.attachClosingContract(id, applicationSlug, relativePath);
  }
}
