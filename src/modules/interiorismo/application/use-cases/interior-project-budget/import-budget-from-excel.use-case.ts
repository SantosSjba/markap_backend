import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BudgetSpreadsheetPort } from '../../../../../shared/application/ports/budget-spreadsheet.port';
import type { InteriorProjectBudgetRepository } from '../../../domain/repositories/interior-project-budget.repository';
import { INTERIOR_PROJECT_BUDGET_REPOSITORY } from '../../../domain/repositories/interior-project-budget.repository';

@Injectable()
export class ImportInteriorProjectBudgetFromExcelUseCase {
  constructor(
    private readonly spreadsheet: BudgetSpreadsheetPort,
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    options: { replace?: boolean } = {},
    applicationSlug = 'interiorismo',
  ) {
    if (!file.buffer?.length) {
      throw new BadRequestException('Archivo Excel vacío');
    }
    const parsed = this.spreadsheet.parse(file.buffer);
    return this.repo
      .importBudgetSections(
        projectId,
        parsed.sections,
        options.replace ?? false,
        applicationSlug,
      )
      .then((result) => ({
        ...result,
        sheetName: parsed.sheetName,
        sourceFileName: file.originalname ?? null,
      }));
  }
}
