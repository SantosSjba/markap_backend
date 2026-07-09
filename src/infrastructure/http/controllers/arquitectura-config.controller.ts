import { Body, Controller, Get, Put, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ArquitecturaConfigOperationsService } from '../../../application/services/arquitectura-config-operations.service';
import type { ArquitecturaProjectStageInput } from '@domain/repositories/arquitectura-config.repository';

@ApiTags('Arquitectura — Configuración')
@Controller('arquitectura-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ArquitecturaConfigController {
  constructor(private readonly arquitecturaConfig: ArquitecturaConfigOperationsService) {}

  @Get('bootstrap')
  @ApiOperation({
    summary: 'Parametrización Arquitectura: etapas de proyecto, numeración de códigos de proyecto',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async bootstrap(@Query('applicationSlug') applicationSlug?: string) {
    return this.arquitecturaConfig.bootstrap(applicationSlug);
  }

  @Put('project-stages')
  @ApiOperation({ summary: 'Reemplazar etiquetas y orden de etapas del ciclo de proyecto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async replaceStages(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { stages: ArquitecturaProjectStageInput[] },
  ) {
    return this.arquitecturaConfig.replaceProjectStages(applicationSlug, body);
  }

  @Patch('numbering/arquitectura-project')
  @ApiOperation({ summary: 'Ajustar prefijo y/o último correlativo de códigos de proyecto (ARQ-PRY-####)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async patchNumbering(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { prefix?: string; lastNumber?: number },
  ) {
    return this.arquitecturaConfig.patchArquitecturaProjectNumbering(applicationSlug, body);
  }
}
