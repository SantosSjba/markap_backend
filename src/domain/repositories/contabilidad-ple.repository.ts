export const CONTABILIDAD_PLE_REPOSITORY = Symbol('ContabilidadPleRepository');

export interface ContabilidadPleValidationIssue {
  severity: 'error' | 'warning';
  bookCode: string;
  code: string;
  message: string;
  context?: string;
  lineNumber?: number;
  linePreview?: string;
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
  blocked: boolean;
  exportLogId?: string;
}

export interface ContabilidadPleMandatoryProfileDto {
  taxRegime: string;
  taxRegimeLabel: string;
  mandatoryBookCodes: string[];
  optionalBookCodes: string[];
  books: { code: string; name: string; mandatory: boolean }[];
}

export interface ContabilidadPleExportLogDto {
  id: string;
  periodId: string;
  year: number;
  month: number;
  userId: string | null;
  bookCodes: string[];
  fileCount: number;
  zipHash: string;
  errorCount: number;
  warningCount: number;
  status: string;
  createdAt: string;
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

  getMandatoryProfile(
    applicationId: string,
    taxRegime: string,
  ): ContabilidadPleMandatoryProfileDto;

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
    options?: { userId?: string | null; persistLog?: boolean },
  ): Promise<ContabilidadPleGenerateResult>;

  buildZipBuffer(files: ContabilidadPleGeneratedFile[]): Promise<{ buffer: Buffer; hash: string }>;

  listExportLogs(
    applicationId: string,
    periodId?: string,
    limit?: number,
  ): Promise<ContabilidadPleExportLogDto[]>;

  getLibroMayor(
    applicationId: string,
    periodId: string,
    accountId?: string,
  ): Promise<ContabilidadLibroMayorAccountSummaryDto[]>;
}
