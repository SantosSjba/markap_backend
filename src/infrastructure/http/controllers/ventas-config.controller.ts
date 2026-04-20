import { Body, Controller, Get, Put, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { VentasConfigOperationsService } from '../../../application/services';
import type { VentasPipelineStageInput } from '@domain/repositories/ventas-config.repository';

@ApiTags('Ventas — Configuración')
@Controller('ventas-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VentasConfigController {
  constructor(private readonly ventasConfig: VentasConfigOperationsService) {}

  @Get('bootstrap')
  @ApiOperation({
    summary: 'Parametrización Ventas: pipeline, numeración de procesos, tipos de propiedad (catálogo)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async bootstrap(@Query('applicationSlug') applicationSlug?: string) {
    return this.ventasConfig.bootstrap(applicationSlug);
  }

  @Put('pipeline-stages')
  @ApiOperation({ summary: 'Reemplazar etiquetas y orden de etapas del pipeline CRM' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async replacePipeline(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { stages: VentasPipelineStageInput[] },
  ) {
    return this.ventasConfig.replacePipelineStages(applicationSlug, body);
  }

  @Patch('numbering/sale-process')
  @ApiOperation({ summary: 'Ajustar prefijo y/o último correlativo de códigos de proceso (VNT-PRC-####)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async patchNumbering(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { prefix?: string; lastNumber?: number },
  ) {
    return this.ventasConfig.patchNumbering(applicationSlug, body);
  }
}
