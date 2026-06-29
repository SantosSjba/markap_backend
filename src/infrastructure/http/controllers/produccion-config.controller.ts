import { Body, Controller, Get, Param, Patch, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProduccionConfigOperationsService } from '../../../application/services/produccion-config-operations.service';
import type {
  ProduccionFurnitureCategoryInput,
  ProduccionProductionStageInput,
  ProduccionUnitInput,
} from '@domain/repositories/produccion-config.repository';

@ApiTags('Producción — Configuración')
@Controller('produccion-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionConfigController {
  constructor(private readonly produccionConfig: ProduccionConfigOperationsService) {}

  @Get('bootstrap')
  @ApiOperation({ summary: 'Parametrización: categorías, etapas, unidades, numeración y defaults' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  bootstrap(@Query('applicationSlug') applicationSlug?: string) {
    return this.produccionConfig.bootstrap(applicationSlug);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Parámetros por defecto (IGV, desperdicio madera, vigencia cotización)' })
  updateSettings(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { igvPercent?: number; woodWastePercent?: number; quotationValidDays?: number },
  ) {
    return this.produccionConfig.updateSettings(applicationSlug, body);
  }

  @Put('furniture-categories')
  replaceCategories(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { categories: ProduccionFurnitureCategoryInput[] },
  ) {
    return this.produccionConfig.replaceFurnitureCategories(applicationSlug, body);
  }

  @Put('production-stages')
  replaceStages(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { stages: ProduccionProductionStageInput[] },
  ) {
    return this.produccionConfig.replaceProductionStages(applicationSlug, body);
  }

  @Put('units')
  replaceUnits(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: { units: ProduccionUnitInput[] },
  ) {
    return this.produccionConfig.replaceUnits(applicationSlug, body);
  }

  @Patch('numbering/:seriesKey')
  @ApiOperation({ summary: 'Ajustar prefijo/correlativo de una serie documental' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  patchNumbering(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('seriesKey') seriesKey: string,
    @Body() body: { prefix?: string; lastNumber?: number; padLength?: number; includeYear?: boolean },
  ) {
    return this.produccionConfig.patchNumbering(applicationSlug, seriesKey, body);
  }

  @Get('numbering/:seriesKey/preview')
  @ApiQuery({ name: 'applicationSlug', required: false })
  previewCode(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('seriesKey') seriesKey: string,
  ) {
    return this.produccionConfig.previewCode(applicationSlug, seriesKey);
  }
}
