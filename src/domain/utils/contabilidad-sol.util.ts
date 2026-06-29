import { createHash } from 'crypto';
import type { ContabilidadPdt621ExportDto } from '@domain/repositories/contabilidad-taxes.repository';

export function hashSolPackage(payload: string): string {
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

export function buildPdt621Package(
  exportData: ContabilidadPdt621ExportDto,
  legalEntity: { ruc: string; legalName: string; code: string },
): Record<string, unknown> {
  const s = exportData.igvSummary;
  return {
    form: 'PDT621',
    generator: 'MARKAP-CONTABILIDAD',
    version: '1.0',
    generatedAt: exportData.generatedAt,
    taxpayer: {
      ruc: legalEntity.ruc,
      legalName: legalEntity.legalName,
      entityCode: legalEntity.code,
    },
    period: {
      year: exportData.year,
      month: exportData.month,
      label: `${exportData.year}-${String(exportData.month).padStart(2, '0')}`,
    },
    igv: {
      igvPercent: s.igvPercent,
      purchaseCreditIgv: s.purchaseCreditIgv,
      purchaseCreditNoteIgv: s.purchaseCreditNoteIgv,
      salesDebitIgv: s.salesDebitIgv,
      salesCreditNoteIgv: s.salesCreditNoteIgv,
      retentionsIgv: s.retentionsIgv,
      perceptionsIgv: s.perceptionsIgv,
      netCreditIgv: s.netCreditIgv,
      netDebitIgv: s.netDebitIgv,
      balanceToPay: s.balanceToPay,
      balanceInFavor: s.balanceInFavor,
    },
    otherTaxes: {
      detraccionesTotal: exportData.detraccionesTotal,
      retencionesTotal: exportData.retencionesTotal,
      percepcionesTotal: exportData.percepcionesTotal,
    },
    sunatLoadHint:
      'Paquete de referencia MARKAP. Transcriba montos al PDT 621 en SOL o use envío automático cuando esté configurado.',
  };
}

export function buildPlameDraftPackage(input: {
  ruc: string;
  legalName: string;
  year: number;
  month: number;
}): Record<string, unknown> {
  return {
    form: 'PLAME',
    generator: 'MARKAP-CONTABILIDAD',
    version: '0.1-draft',
    taxpayer: { ruc: input.ruc, legalName: input.legalName },
    period: {
      year: input.year,
      month: input.month,
      label: `${input.year}-${String(input.month).padStart(2, '0')}`,
    },
    employees: [],
    totals: {
      grossRemuneration: '0.00',
      onp: '0.00',
      essalud: '0.00',
      incomeTaxWithheld: '0.00',
    },
    note: 'Borrador estructural. Integración PLAME completa requiere módulo RRHH.',
  };
}
