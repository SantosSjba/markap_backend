import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
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
  InteriorismoProjectStagesDto,
  ProjectNumberingDto,
} from '../../../../shared/presentation/dtos/configuracion/module-config-requests.dto';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { InteriorismoConfigOperationsService } from '../../application/services/interiorismo-config-operations.service';

@ApiTags('Interiorismo — Configuración')
@RequiresApplication('interiorismo')
@Controller('interiorismo-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InteriorismoConfigController {
  constructor(
    private readonly interiorismoConfig: InteriorismoConfigOperationsService,
  ) {}

  @Get('bootstrap')
  @ApiOperation({
    summary:
      'Parametrización Interiorismo: etapas de proyecto, numeración de códigos de proyecto',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async bootstrap(@Query('applicationSlug') applicationSlug?: string) {
    return this.interiorismoConfig.bootstrap(applicationSlug);
  }

  @Put('project-stages')
  @ApiOperation({
    summary: 'Reemplazar etiquetas y orden de etapas del ciclo de proyecto',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async replaceStages(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: InteriorismoProjectStagesDto,
  ) {
    return this.interiorismoConfig.replaceProjectStages(applicationSlug, body);
  }

  @Patch('numbering/interior-project')
  @ApiOperation({
    summary:
      'Ajustar prefijo y/o último correlativo de códigos de proyecto (INT-PRY-####)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async patchNumbering(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: ProjectNumberingDto,
  ) {
    return this.interiorismoConfig.patchInteriorProjectNumbering(
      applicationSlug,
      body,
    );
  }
}
