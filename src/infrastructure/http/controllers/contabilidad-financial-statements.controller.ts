import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
}
