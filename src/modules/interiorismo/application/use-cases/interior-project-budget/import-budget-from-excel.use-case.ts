import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InteriorBudgetSpreadsheetPort } from '../../ports/interior-budget-spreadsheet.port';
import {
  INTERIOR_PROJECT_BUDGET_REPOSITORY,
  type InteriorProjectBudgetRepository,
} from '../../../domain/repositories/interior-project-budget.repository';

/**
 * Importa un Excel de presupuesto (formato Markap Spaces o PRIZE) al presupuesto activo.
 * `replace` borra las filas actuales; si no, las importadas se agregan al final.
 */
@Injectable()
export class ImportInteriorProjectBudgetFromExcelUseCase {
  constructor(
    private readonly spreadsheet: InteriorBudgetSpreadsheetPort,
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly repo: InteriorProjectBudgetRepository,
  ) {}

  async execute(
    projectId: string,
    file: { buffer: Buffer; originalname?: string },
    options: { replace?: boolean } = {},
    applicationSlug = 'interiorismo',
  ) {
    if (!file.buffer?.length)
      throw new BadRequestException('Archivo Excel vacío');
    const parsed = this.spreadsheet.parse(file.buffer);
    const result = await this.repo.importRows(
      projectId,
      parsed.budget,
      options.replace ?? false,
      applicationSlug,
    );
    return {
      ...result,
      import: {
        sheetName: parsed.sheetName,
        format: parsed.format,
        warnings: parsed.warnings,
        sourceFileName: file.originalname ?? null,
      },
    };
  }
}
