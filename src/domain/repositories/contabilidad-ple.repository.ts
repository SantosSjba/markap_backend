export const CONTABILIDAD_PLE_REPOSITORY = Symbol('ContabilidadPleRepository');

export interface ContabilidadPleValidationIssue {
  severity: 'error' | 'warning';
  bookCode: string;
  code: string;
  message: string;
  context?: string;
}

export interface ContabilidadPleGeneratedFile {
  bookCode: string;
  bookName: string;
  fileName: string;
  lineCount: number;
  content: string;
  issues: ContabilidadPleValidationIssue[];
}

export interface ContabilidadPleGenerateResult {
  periodId: string;
  year: number;
  month: number;
  ruc: string;
  legalName: string;
  files: ContabilidadPleGeneratedFile[];
  errors: ContabilidadPleValidationIssue[];
  warnings: ContabilidadPleValidationIssue[];
  generatedAt: string;
}

export interface ContabilidadLibroMayorLineDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  entryDate: string;
  entryNumber: number;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface ContabilidadLibroMayorAccountSummaryDto {
  accountId: string;
  accountCode: string;
  accountName: string;
  totalDebit: string;
  totalCredit: string;
  balance: string;
  lines: ContabilidadLibroMayorLineDto[];
}

export interface ContabilidadPleRepository {
  listBooks(): { books: { code: string; name: string; description: string; sunatStructure: string }[] };

  generateBook(
    applicationId: string,
    periodId: string,
    bookCode: string,
    company: { ruc: string; legalName: string },
  ): Promise<ContabilidadPleGeneratedFile>;

  generateBooks(
    applicationId: string,
    periodId: string,
    bookCodes: string[],
    company: { ruc: string; legalName: string },
  ): Promise<ContabilidadPleGenerateResult>;

  getLibroMayor(
    applicationId: string,
    periodId: string,
    accountId?: string,
  ): Promise<ContabilidadLibroMayorAccountSummaryDto[]>;
}
