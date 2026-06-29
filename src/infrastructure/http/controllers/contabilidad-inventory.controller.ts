import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadInventoryOperationsService } from '../../../application/services/contabilidad-inventory-operations.service';
import type {
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  UpdateInventoryItemInput,
} from '@domain/repositories/contabilidad-inventory.repository';

@ApiTags('Contabilidad — Inventario permanente')
@Controller('contabilidad-inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadInventoryController {
  constructor(private readonly inventory: ContabilidadInventoryOperationsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Etiquetas de catálogo inventario' })
  getCatalog() {
    return this.inventory.getCatalog();
  }

  @Get('items')
  @ApiOperation({ summary: 'Listar ítems de inventario' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listItems(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('search') search?: string,
    @Query('accountId') accountId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.inventory.listItems(applicationSlug, {
      search,
      accountId,
      activeOnly: activeOnly !== 'false',
    });
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Detalle de ítem' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getItem(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.inventory.getItem(applicationSlug, id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Registrar ítem de inventario' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createItem(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateInventoryItemInput,
  ) {
    return this.inventory.createItem(applicationSlug, body);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Actualizar ítem' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateItem(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateInventoryItemInput,
  ) {
    return this.inventory.updateItem(applicationSlug, id, body);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Listar movimientos de inventario' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listMovements(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('itemId') itemId?: string,
    @Query('movementType') movementType?: string,
  ) {
    return this.inventory.listMovements(applicationSlug, { periodId, itemId, movementType });
  }

  @Post('movements')
  @ApiOperation({ summary: 'Registrar movimiento con asiento automático' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createMovement(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateInventoryMovementInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventory.createMovement(applicationSlug, body, req.user?.sub);
  }

  @Get('items/:id/kardex')
  @ApiOperation({ summary: 'Kardex valorizado del ítem' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getKardex(@Query('applicationSlug') applicationSlug: string | undefined, @Param('id') id: string) {
    return this.inventory.getKardex(applicationSlug, id);
  }

  @Get('valued-balance')
  @ApiOperation({ summary: 'Saldo valorizado de inventario' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getValuedBalance(@Query('applicationSlug') applicationSlug?: string) {
    return this.inventory.getValuedBalance(applicationSlug);
  }
}
