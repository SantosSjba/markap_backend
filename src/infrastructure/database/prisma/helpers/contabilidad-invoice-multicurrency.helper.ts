import {
  convertForeignToPen,
  FUNCTIONAL_CURRENCY,
  normalizeCurrencyCode,
  parseExchangeRate,
} from '@domain/utils/contabilidad-multicurrency.util';
import { parsePenAmount } from '@domain/utils/contabilidad-journal-amounts';
import type { PrismaService } from '../prisma.service';

export interface InvoiceMulticurrencyInput {
  currencyCode?: string | null;
  exchangeRate?: number | string | null;
  foreignTaxableBase?: number | string | null;
  taxableBase: number | string;
  issueDate: string;
}

export interface InvoiceMulticurrencyResult {
  currencyCode: string;
  exchangeRate: number | null;
  foreignTaxableBase: number | null;
  taxableBasePen: number;
}

async function lookupExchangeRate(
  prisma: Pick<PrismaService, 'contabilidadExchangeRate'>,
  applicationId: string,
  currencyCode: string,
  rateDate: string,
): Promise<number> {
  const row = await prisma.contabilidadExchangeRate.findUnique({
    where: {
      applicationId_rateDate_currencyCode: {
        applicationId,
        rateDate: new Date(`${rateDate}T12:00:00.000Z`),
        currencyCode,
      },
    },
  });
  if (!row) {
    throw new Error(`No hay tipo de cambio registrado para ${currencyCode} en ${rateDate}`);
  }
  return parseExchangeRate(Number(row.sellRate));
}

export async function resolveInvoiceTaxableBaseInPen(
  prisma: Pick<PrismaService, 'contabilidadExchangeRate'>,
  applicationId: string,
  input: InvoiceMulticurrencyInput,
): Promise<InvoiceMulticurrencyResult> {
  const currencyCode = normalizeCurrencyCode(input.currencyCode);

  if (currencyCode === FUNCTIONAL_CURRENCY) {
    const taxableBasePen = parsePenAmount(input.taxableBase);
    if (Number.isNaN(taxableBasePen) || taxableBasePen <= 0) {
      throw new Error('Base imponible no válida');
    }
    return {
      currencyCode,
      exchangeRate: null,
      foreignTaxableBase: null,
      taxableBasePen,
    };
  }

  const foreignTaxableBase = parsePenAmount(
    input.foreignTaxableBase != null && input.foreignTaxableBase !== ''
      ? input.foreignTaxableBase
      : input.taxableBase,
  );
  if (Number.isNaN(foreignTaxableBase) || foreignTaxableBase <= 0) {
    throw new Error('Base imponible en moneda extranjera no válida');
  }

  let exchangeRate = parseExchangeRate(input.exchangeRate);
  if (!Number.isFinite(exchangeRate)) {
    exchangeRate = await lookupExchangeRate(prisma, applicationId, currencyCode, input.issueDate);
  }

  return {
    currencyCode,
    exchangeRate,
    foreignTaxableBase,
    taxableBasePen: convertForeignToPen(foreignTaxableBase, exchangeRate),
  };
}

export async function resolveTreasuryPenAmount(
  prisma: Pick<PrismaService, 'contabilidadExchangeRate' | 'contabilidadBankAccount'>,
  applicationId: string,
  input: {
    sourceType: 'CASH' | 'BANK';
    bankAccountId?: string | null;
    amount: number | string;
    foreignAmount?: number | string | null;
    exchangeRate?: number | string | null;
    movementDate: string;
  },
): Promise<{
  currencyCode: string;
  penAmount: number;
  foreignAmount: number | null;
  exchangeRate: number | null;
}> {
  const penFromInput = parsePenAmount(input.amount);
  if (Number.isNaN(penFromInput) || penFromInput <= 0) throw new Error('Invalid amount');

  if (input.sourceType !== 'BANK' || !input.bankAccountId) {
    return {
      currencyCode: FUNCTIONAL_CURRENCY,
      penAmount: penFromInput,
      foreignAmount: null,
      exchangeRate: null,
    };
  }

  const bank = await prisma.contabilidadBankAccount.findFirst({
    where: { applicationId, id: input.bankAccountId, isActive: true },
  });
  if (!bank) throw new Error('Bank account not found');

  const currencyCode = normalizeCurrencyCode(bank.currency);
  if (currencyCode === FUNCTIONAL_CURRENCY) {
    return {
      currencyCode,
      penAmount: penFromInput,
      foreignAmount: null,
      exchangeRate: null,
    };
  }

  const foreignAmount = parsePenAmount(
    input.foreignAmount != null && input.foreignAmount !== '' ? input.foreignAmount : input.amount,
  );
  if (Number.isNaN(foreignAmount) || foreignAmount <= 0) {
    throw new Error('Importe en moneda extranjera no válido');
  }

  let exchangeRate = parseExchangeRate(input.exchangeRate);
  if (!Number.isFinite(exchangeRate)) {
    exchangeRate = await lookupExchangeRate(prisma, applicationId, currencyCode, input.movementDate);
  }

  return {
    currencyCode,
    penAmount: convertForeignToPen(foreignAmount, exchangeRate),
    foreignAmount,
    exchangeRate,
  };
}
