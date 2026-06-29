import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateProduccionStockMovementUseCase,
  ListProduccionStockMovementsUseCase,
} from '../../../application/use-cases/produccion-materials';
import { CreateProduccionStockMovementDto } from '../dtos/produccion-inventory/stock-movement.dto';
import type { ProduccionStockMovementType } from '@domain/repositories/produccion-material.repository';

@ApiTags('Producción — Inventario (movimientos)')
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
    const typeFilter = validTypes.includes(movementType as ProduccionStockMovementType)
      ? (movementType as ProduccionStockMovementType)
      : undefined;

    return this.listUc.execute({
      applicationSlug: applicationSlug ?? 'produccion',
      page: Math.max(1, parseInt(page ?? '1', 10)),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10))),
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
