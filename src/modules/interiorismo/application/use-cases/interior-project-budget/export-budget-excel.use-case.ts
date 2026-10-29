import { Inject, Injectable } from '@nestjs/common';
import { InteriorBudgetSpreadsheetPort } from '../../ports/interior-budget-spreadsheet.port';
import {
  INTERIOR_PROJECT_BUDGET_REPOSITORY,
  type InteriorProjectBudgetRepository,
} from '../../../domain/repositories/interior-project-budget.repository';

/** Excel del presupuesto activo (estructura de la hoja + totales). */
@Injectable()
export class ExportInteriorProjectBudgetExcelUseCase {
  constructor(
    private readonly spreadsheet: InteriorBudgetSpreadsheetPort,
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  async execute(projectId: string, applicationSlug = 'interiorismo') {
    const sheet = await this.repo.getSheet(projectId, applicationSlug);
    return {
      fileName: `Presupuesto ${sheet.project.code} v${sheet.budget.version}.xlsx`,
      buffer: await this.spreadsheet.build(sheet),
    };
  }
}
