import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ContabilidadFinancialStatementsOperationsService } from '../../../application/services/contabilidad-financial-statements-operations.service';

@ApiTags('Contabilidad — Estados financieros')
@Controller('contabilidad-financial-statements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ContabilidadFinancialStatementsController {
  constructor(private readonly statements: ContabilidadFinancialStatementsOperationsService) {}

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance general con comparativo periodo anterior' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  @ApiQuery({ name: 'comparePrior', required: false, type: Boolean })
  getBalanceSheet(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('comparePrior') comparePrior?: string,
  ) {
    const compare = comparePrior !== 'false';
    return this.statements.getBalanceSheet(applicationSlug, periodId, compare);
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'Estado de resultados con comparativo periodo anterior' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  @ApiQuery({ name: 'comparePrior', required: false, type: Boolean })
  getIncomeStatement(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('comparePrior') comparePrior?: string,
  ) {
    const compare = comparePrior !== 'false';
    return this.statements.getIncomeStatement(applicationSlug, periodId, compare);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Estado de flujo de efectivo (método indirecto v1)' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  @ApiQuery({ name: 'comparePrior', required: false, type: Boolean })
  getCashFlow(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('comparePrior') comparePrior?: string,
  ) {
    const compare = comparePrior !== 'false';
    return this.statements.getCashFlowStatement(applicationSlug, periodId, compare);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Exportar balance, EE.RR. o balance de comprobación a Excel' })
  @ApiQuery({ name: 'applicationSlug', required: false })
  @ApiQuery({ name: 'periodId', required: true })
  @ApiQuery({ name: 'type', required: true, enum: ['balance-sheet', 'income-statement', 'trial-balance'] })
  async exportExcel(
    @Query('applicationSlug') applicationSlug?: string,
    @Query('periodId') periodId?: string,
    @Query('type') type?: string,
    @Res() res?: Response,
  ) {
    const { buffer, fileName } = await this.statements.exportExcel(applicationSlug, periodId, type);
    res!.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res!.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res!.send(buffer);
  }
}
