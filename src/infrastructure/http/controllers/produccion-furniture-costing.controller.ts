import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateProduccionFurnitureCostingSnapshotUseCase,
  GetProduccionFurnitureCostingUseCase,
  ListProduccionFurnitureCostingSnapshotsUseCase,
  UpdateProduccionFurnitureCostingUseCase,
} from '../../../application/use-cases/produccion-furniture-costing';
import {
  CreateCostingSnapshotDto,
  UpdateFurnitureCostingDto,
} from '../dtos/produccion-costs/furniture-costing.dto';

@ApiTags('Producción — Costeo de muebles')
@Controller('produccion-furniture-costing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionFurnitureCostingController {
  constructor(
    private readonly getUc: GetProduccionFurnitureCostingUseCase,
    private readonly updateUc: UpdateProduccionFurnitureCostingUseCase,
    private readonly snapshotUc: CreateProduccionFurnitureCostingSnapshotUseCase,
    private readonly listSnapshotsUc: ListProduccionFurnitureCostingSnapshotsUseCase,
  ) {}

  @Get(':furnitureId')
  @ApiOperation({ summary: 'Obtener costeo de un mueble' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getCosting(
    @Param('furnitureId') furnitureId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.getUc.execute(furnitureId, applicationSlug ?? 'produccion');
  }

  @Patch(':furnitureId')
  @ApiOperation({ summary: 'Actualizar costeo (materiales, MO, gastos)' })
  updateCosting(
    @Param('furnitureId') furnitureId: string,
    @Body() dto: UpdateFurnitureCostingDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.updateUc.execute(furnitureId, applicationSlug ?? 'produccion', {
      bomUnitCosts: dto.bomUnitCosts?.map((b) => ({
        id: b.id,
        unitCost: b.unitCost ?? null,
      })),
      laborEntries: dto.laborEntries,
      extraExpenses: dto.extraExpenses,
    });
  }

  @Post(':furnitureId/snapshots')
  @ApiOperation({ summary: 'Guardar snapshot del costeo actual' })
  createSnapshot(
    @Param('furnitureId') furnitureId: string,
    @Body() dto: CreateCostingSnapshotDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.snapshotUc.execute(furnitureId, applicationSlug ?? 'produccion', dto);
  }

  @Get(':furnitureId/snapshots')
  @ApiOperation({ summary: 'Historial de snapshots de costeo' })
  listSnapshots(
    @Param('furnitureId') furnitureId: string,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.listSnapshotsUc.execute(furnitureId, applicationSlug ?? 'produccion');
  }
}
