import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { parseInteriorBudgetExcel } from '@domain/interior-project-budget/parse-interior-budget-excel';
import { INTERIOR_PROJECT_BUDGET_REPOSITORY } from '@domain/repositories/interior-project-budget.repository';
import type { InteriorProjectBudgetRepository } from '@domain/repositories/interior-project-budget.repository';

@Injectable()
export class ImportInteriorProjectBudgetFromExcelUseCase {
  constructor(
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
    const parsed = parseInteriorBudgetExcel(file.buffer);
    return this.repo.importBudgetSections(
      projectId,
      parsed.sections,
      options.replace ?? false,
      applicationSlug,
    ).then((result) => ({
      ...result,
      sheetName: parsed.sheetName,
      sourceFileName: file.originalname ?? null,
    }));
  }
}
