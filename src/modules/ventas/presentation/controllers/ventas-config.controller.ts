import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { PipelineStagesDto } from '../../../../shared/presentation/dtos/configuracion/module-config-requests.dto';
import {
  CreateFinancingChannelDto,
  UpdateFinancingChannelDto,
} from '../dtos/ventas/ventas-config-requests.dto';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { VentasConfigOperationsService } from '../../application/services/ventas-config-operations.service';

@ApiTags('Ventas — Configuración')
@RequiresApplication('ventas')
@Controller('ventas-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VentasConfigController {
  constructor(private readonly ventasConfig: VentasConfigOperationsService) {}

  @Get('bootstrap')
  @ApiOperation({
    summary: 'Parametrización Ventas: etapas del pipeline',
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

  @Get('financing-channels')
  @ApiOperation({
    summary: 'Bancos y medios de pago (incluye inactivos y su uso)',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async listFinancingChannels(
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.ventasConfig.listFinancingChannels(applicationSlug);
  }

  @Post('financing-channels')
  @ApiOperation({ summary: 'Agregar banco o medio de pago' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async createFinancingChannel(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateFinancingChannelDto,
  ) {
    return this.ventasConfig.createFinancingChannel(applicationSlug, body);
  }

  @Patch('financing-channels/:id')
  @ApiOperation({
    summary: 'Editar, activar o desactivar un banco o medio de pago',
  })
  @ApiQuery({ name: 'applicationSlug', required: false })
  async updateFinancingChannel(
    @Param('id') id: string,
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: UpdateFinancingChannelDto,
  ) {
    return this.ventasConfig.updateFinancingChannel(applicationSlug, id, body);
  }
}
