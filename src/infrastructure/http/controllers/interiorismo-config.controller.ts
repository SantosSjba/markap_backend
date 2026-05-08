import { Body, Controller, Get, Put, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { InteriorismoConfigOperationsService } from '../../../application/services/interiorismo-config-operations.service';
import type { InteriorismoProjectStageInput } from '@domain/repositories/interiorismo-config.repository';

@ApiTags('Interiorismo — Configuración')
@Controller('interiorismo-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoConfigController {
  constructor(private readonly interiorismoConfig: InteriorismoConfigOperationsService) {}

  @Get('bootstrap')
  @ApiOperation({
    summary: 'Parametrización Interiorismo: etapas de proyecto, numeración de códigos de proyecto',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async bootstrap(@Query('applicationSlug') applicationSlug?: string) {
    return this.interiorismoConfig.bootstrap(applicationSlug);
  }

  @Put('project-stages')
  @ApiOperation({ summary: 'Reemplazar etiquetas y orden de etapas del ciclo de proyecto' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async replaceStages(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { stages: InteriorismoProjectStageInput[] },
  ) {
    return this.interiorismoConfig.replaceProjectStages(applicationSlug, body);
  }

  @Patch('numbering/interior-project')
  @ApiOperation({ summary: 'Ajustar prefijo y/o último correlativo de códigos de proyecto (INT-PRY-####)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async patchNumbering(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { prefix?: string; lastNumber?: number },
  ) {
    return this.interiorismoConfig.patchInteriorProjectNumbering(applicationSlug, body);
  }
}
