import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BudgetSpreadsheetPort } from '../../../../../shared/application/ports/budget-spreadsheet.port';
import type { ArquitecturaProjectBudgetRepository } from '../../../domain/repositories/arquitectura-project-budget.repository';
import { ARQUITECTURA_PROJECT_BUDGET_REPOSITORY } from '../../../domain/repositories/arquitectura-project-budget.repository';
@Injectable()
export class ImportArquitecturaProjectBudgetFromExcelUseCase {
  constructor(
    private readonly spreadsheet: BudgetSpreadsheetPort,
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: ArquitecturaProjectBudgetRepository,
  ) {}

  execute(
    projectId: string,
    file: { buffer: Buffer; originalname?: string; mimetype?: string },
    options: { replace?: boolean } = {},
    applicationSlug = 'arquitectura',
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
