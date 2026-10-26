import { RequiresApplication } from '../../../../shared/presentation/decorators/application-access.decorators';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { parseIntegerQuery } from '../../../../shared/utils/parse-integer-query.util';
import {
  CreateProduccionStockMovementUseCase,
  ListProduccionStockMovementsUseCase,
} from '../../application/use-cases/produccion-materials/produccion-materials.use-cases';
import type { ProduccionStockMovementType } from '../../domain/repositories/produccion-material.repository';
import { CreateProduccionStockMovementDto } from '../dtos/produccion-inventory/stock-movement.dto';

@ApiTags('Producción — Inventario (movimientos)')
@RequiresApplication('produccion')
@Controller('produccion-stock-movements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProduccionStockMovementsController {
  constructor(
    private readonly listUc: ListProduccionStockMovementsUseCase,
    private readonly createUc: CreateProduccionStockMovementUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Kardex de movimientos de stock' })
  list(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('materialId') materialId?: string,
    @Query('movementType') movementType?: string,
    @Query('search') search?: string,
  ) {
    const validTypes = ['IN', 'OUT', 'ADJUST'] as const;
    const typeFilter = validTypes.includes(
      movementType as ProduccionStockMovementType,
    )
      ? (movementType as ProduccionStockMovementType)
      : undefined;

    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseIntegerQuery(page, 1, 1, 1000000)),
      limit: Math.min(100, Math.max(1, parseIntegerQuery(limit, 20, 1, 100))),
      materialId: materialId?.trim() || undefined,
      movementType: typeFilter,
      search: search?.trim() || undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Registrar movimiento (ingreso, salida o ajuste)' })
  create(
    @Body() dto: CreateProduccionStockMovementDto,
    @Query('applicationSlug') applicationSlug?: string,
  ) {
    return this.createUc.execute(applicationSlug ?? 'produccion', dto);
  }
}
