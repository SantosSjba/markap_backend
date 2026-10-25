import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  PipelineStagesDto,
  ProjectNumberingDto,
} from '../../../../shared/presentation/dtos/configuracion/module-config-requests.dto';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { VentasConfigOperationsService } from '../../application/services/ventas-config-operations.service';

@ApiTags('Ventas — Configuración')
@Controller('ventas-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VentasConfigController {
  constructor(private readonly ventasConfig: VentasConfigOperationsService) {}

  @Get('bootstrap')
  @ApiOperation({
    summary:
      'Parametrización Ventas: pipeline, numeración de procesos, tipos de propiedad (catálogo)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async bootstrap(@Query('applicationSlug') applicationSlug?: string) {
    return this.ventasConfig.bootstrap(applicationSlug);
  }

  @Put('pipeline-stages')
  @ApiOperation({
    summary: 'Reemplazar etiquetas y orden de etapas del pipeline CRM',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async replacePipeline(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: PipelineStagesDto,
  ) {
    return this.ventasConfig.replacePipelineStages(applicationSlug, body);
  }

  @Patch('numbering/sale-process')
  @ApiOperation({
    summary:
      'Ajustar prefijo y/o último correlativo de códigos de proceso (VNT-PRC-####)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async patchNumbering(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: ProjectNumberingDto,
  ) {
    return this.ventasConfig.patchNumbering(applicationSlug, body);
  }
}
