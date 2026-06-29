import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadTreasuryOperationsService } from '../../../application/services/contabilidad-treasury-operations.service';
import type {
  CreateBankAccountInput,
  CreateCashBoxInput,
  CreateTreasuryMovementInput,
  CreateTreasuryTransferInput,
  ListTreasuryMovementsFilters,
  UpdateBankAccountInput,
  UpdateCashBoxInput,
  UpsertReconciliationInput,
} from '@domain/repositories/contabilidad-treasury.repository';

@ApiTags('Contabilidad — Tesorería')
@Controller('contabilidad-treasury')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadTreasuryController {
  constructor(private readonly treasury: ContabilidadTreasuryOperationsService) {}

  @Get('cash-boxes')
  @ApiOperation({ summary: 'Listar cajas con saldo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listCashBoxes(@Query('applicationSlug') applicationSlug?: string) {
    return this.treasury.listCashBoxes(applicationSlug);
  }

  @Post('cash-boxes')
  @ApiOperation({ summary: 'Crear caja' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createCashBox(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateCashBoxInput,
  ) {
    return this.treasury.createCashBox(applicationSlug, body);
  }

  @Patch('cash-boxes/:id')
  @ApiOperation({ summary: 'Actualizar caja' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateCashBox(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateCashBoxInput,
  ) {
    return this.treasury.updateCashBox(applicationSlug, id, body);
  }

  @Get('bank-accounts')
  @ApiOperation({ summary: 'Listar cuentas bancarias con saldo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listBankAccounts(@Query('applicationSlug') applicationSlug?: string) {
    return this.treasury.listBankAccounts(applicationSlug);
  }

  @Post('bank-accounts')
  @ApiOperation({ summary: 'Crear cuenta bancaria' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createBankAccount(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateBankAccountInput,
  ) {
    return this.treasury.createBankAccount(applicationSlug, body);
  }

  @Patch('bank-accounts/:id')
  @ApiOperation({ summary: 'Actualizar cuenta bancaria' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  updateBankAccount(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateBankAccountInput,
  ) {
    return this.treasury.updateBankAccount(applicationSlug, id, body);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Listar movimientos de tesorería' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  listMovements(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('cashBoxId') cashBoxId?: string,
    @Query('bankAccountId') bankAccountId?: string,
    @Query('movementType') movementType?: string,
    @Query('sourceType') sourceType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('unreconciledOnly') unreconciledOnly?: string,
  ) {
    const filters: ListTreasuryMovementsFilters = {
      periodId,
      cashBoxId,
      bankAccountId,
      movementType,
      sourceType,
      dateFrom,
      dateTo,
      search,
      unreconciledOnly: unreconciledOnly === 'true',
    };
    return this.treasury.listMovements(applicationSlug, filters);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Registrar ingreso/egreso con asiento automático' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createMovement(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateTreasuryMovementInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.treasury.createMovement(applicationSlug, body, req.user?.sub ?? null);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Transferencia entre caja/bancos con asiento puente' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  createTransfer(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: CreateTreasuryTransferInput,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.treasury.createTransfer(applicationSlug, body, req.user?.sub ?? null);
  }

  @Get('reconciliations')
  @ApiOperation({ summary: 'Obtener conciliación bancaria del periodo' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  getReconciliation(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Query('bankAccountId') bankAccountId: string,
    @Query('periodId') periodId: string,
  ) {
    return this.treasury.getReconciliation(applicationSlug, bankAccountId, periodId);
  }

  @Put('reconciliations')
  @ApiOperation({ summary: 'Crear/actualizar conciliación (saldo extracto)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  upsertReconciliation(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Body() body: UpsertReconciliationInput,
  ) {
    return this.treasury.upsertReconciliation(applicationSlug, body);
  }

  @Patch('reconciliations/:id/close')
  @ApiOperation({ summary: 'Cerrar conciliación bancaria' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  closeReconciliation(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') id: string,
  ) {
    return this.treasury.closeReconciliation(applicationSlug, id);
  }

  @Patch('reconciliations/:id/movements/:movementId')
  @ApiOperation({ summary: 'Marcar/desmarcar movimiento conciliado' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  toggleMovementReconciled(
    @Query('applicationSlug') applicationSlug: string | undefined,
    @Param('id') reconciliationId: string,
    @Param('movementId') movementId: string,
    @Body() body: { reconciled: boolean },
  ) {
    return this.treasury.toggleMovementReconciled(
      applicationSlug,
      reconciliationId,
      movementId,
      Boolean(body.reconciled),
    );
  }
}
