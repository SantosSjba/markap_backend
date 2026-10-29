import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  INTERIOR_PROJECT_BUDGET_REPOSITORY,
  type BudgetSheetDto,
  type InteriorProjectBudgetRepository,
} from '../../../domain/repositories/interior-project-budget.repository';
import {
  INTERIOR_PROJECT_REPOSITORY,
  type InteriorProjectRepository,
} from '../../../domain/repositories/interior-project.repository';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: 'S/',
  USD: 'US$',
  EUR: '€',
};

function fmtMoney(amount: number, currency: string): string {
  const prefix = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${prefix} ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const INTERVENTION_LABELS: Record<string, string> = {
  I: 'Nivel I',
  II: 'Nivel II',
  III: 'Nivel III',
};

@Injectable()
export class RenderInteriorProjectBudgetHtmlUseCase {
  constructor(
    @Inject(INTERIOR_PROJECT_BUDGET_REPOSITORY)
    private readonly budgetRepo: InteriorProjectBudgetRepository,
    @Inject(INTERIOR_PROJECT_REPOSITORY)
    private readonly projectRepo: InteriorProjectRepository,
  ) {}

  async execute(
    projectId: string,
    applicationSlug = 'interiorismo',
  ): Promise<string> {
    const sheet = await this.budgetRepo.getSheet(projectId, applicationSlug);

    const project = await this.projectRepo.findById(projectId, applicationSlug);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    return this.buildHtml(sheet, {
      clientName: project.client.fullName,
      clientDocument: project.client.documentNumber,
      district: project.district?.name ?? project.city,
      interventionLevel: project.interventionLevel,
    });
  }

  private buildHtml(
    sheet: BudgetSheetDto,
    info: {
      clientName: string;
      clientDocument: string;
      district: string | null;
      interventionLevel: string | null;
    },
  ): string {
    const { budget, totals, project } = sheet;
    const money = (n: number) => fmtMoney(n, budget.currency);
    const title = `Presupuesto — ${project.name}`;
    const intervention = info.interventionLevel
      ? (INTERVENTION_LABELS[info.interventionLevel] ?? info.interventionLevel)
      : null;
    const metaParts = [
      budget.number ? `N° ${escapeHtml(budget.number)}` : null,
      budget.issuedAt ? escapeHtml(budget.issuedAt) : null,
      info.district ? escapeHtml(info.district) : null,
      intervention ? escapeHtml(intervention) : null,
      budget.executionTerm
        ? `Plazo: ${escapeHtml(budget.executionTerm)}`
        : null,
    ].filter(Boolean);

    // Por línea: precio de cada partida. Global: parcial (costo) y GG + utilidad al final.
    const perLine = budget.marginMode === 'PER_LINE';
    const bodyRows = sheet.rows
      .map((r) => {
        const pad = `style="padding-left:${4 + r.depth * 14}px"`;
        if (r.kind === 'GROUP') {
          return `<tr class="group"><td>${escapeHtml(r.code)}</td><td ${pad}>${escapeHtml(r.description)}</td><td></td><td></td><td class="num">${money(perLine ? r.price : r.cost)}</td></tr>`;
        }
        if (r.kind === 'NOTE') {
          return `<tr class="note"><td></td><td ${pad} colspan="4">${escapeHtml(r.description)}</td></tr>`;
        }
        const qty =
          r.quantity != null
            ? `${r.quantity} ${escapeHtml(r.unit ?? '')}`
            : escapeHtml(r.unit ?? '');
        return `<tr><td>${escapeHtml(r.code)}</td><td ${pad}>${escapeHtml(r.description)}</td><td class="num">${qty}</td><td class="num">${r.unitPrice != null ? money(r.unitPrice) : ''}</td><td class="num">${money(perLine ? r.price : r.cost)}</td></tr>`;
      })
      .join('');

    const totalLines = [
      perLine ? null : ['Costo directo', totals.directCost],
      !perLine || totals.overhead
        ? ['Gastos generales', totals.overhead]
        : null,
      perLine ? null : ['Utilidad', totals.utility],
      totals.igv ? ['IGV', totals.igv] : null,
    ]
      .filter(
        (x): x is [string, number] => x !== null && (x[1] !== 0 || !perLine),
      )
      .map(
        ([label, value]) =>
          `<div class="line"><span>${label}</span><span>${money(value)}</span></div>`,
      )
      .join('');
    const equivalent = totals.equivalent
      ? `<div class="line"><span>Equivalente (TC ${budget.exchangeRate})</span><span>${fmtMoney(totals.equivalent.amount, totals.equivalent.currency)}</span></div>`
      : '';
    const sectionBlocks = `
      <table>
        <thead><tr><th>Ítem</th><th>Descripción</th><th class="num">Cant.</th><th class="num">P.U.</th><th class="num">${perLine ? 'Precio' : 'Parcial'}</th></tr></thead>
        <tbody>${bodyRows || '<tr><td colspan="5" class="empty">Sin partidas</td></tr>'}</tbody>
      </table>
      <div class="totals">${totalLines}</div>`;
    const igvNote =
      budget.igvMode === 'NONE'
        ? '<p class="meta">Los montos no incluyen IGV.</p>'
        : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;padding:32px 40px;max-width:860px;margin:0 auto;background:#fff}
  .brand{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888;margin-bottom:28px}
  h1{font-family:system-ui,sans-serif;font-size:22px;font-weight:600;margin:0 0 6px;line-height:1.3}
  .subtitle{font-family:system-ui,sans-serif;font-size:13px;color:#555;margin:0 0 4px}
  .meta{font-family:system-ui,sans-serif;font-size:12px;color:#666;margin:0 0 24px}
  .meta span+span::before{content:" · "}
  tr.group td{font-weight:700;background:#f6f6f6}
  tr.note td{color:#666;font-style:italic}
  th.num{text-align:right}
  .totals{margin-top:14px;font-family:system-ui,sans-serif;font-size:12px}
  .totals .line{display:flex;justify-content:space-between;padding:3px 4px}
  .section{margin-top:22px;page-break-inside:avoid}
  .section-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;border-bottom:2px solid #1a1a1a;padding-bottom:6px;margin-bottom:8px}
  .section-head h2{font-family:system-ui,sans-serif;font-size:13px;font-weight:700;margin:0;text-transform:uppercase;letter-spacing:.04em}
  .section-total{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;white-space:nowrap}
  table{border-collapse:collapse;width:100%;font-family:system-ui,sans-serif;font-size:12px}
  th,td{border-bottom:1px solid #e5e5e5;padding:7px 4px;text-align:left;vertical-align:top}
  th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#888;font-weight:600}
  td.desc{width:100%}
  td.num{text-align:right;white-space:nowrap;font-weight:500;color:#111}
  td.empty{color:#999;font-style:italic}
  .grand{margin-top:28px;padding-top:14px;border-top:2px solid #1a1a1a;display:flex;justify-content:space-between;align-items:baseline;font-family:system-ui,sans-serif}
  .grand-label{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
  .grand-value{font-size:20px;font-weight:700}
  .footer{margin-top:36px;font-family:system-ui,sans-serif;font-size:11px;color:#888;line-height:1.5}
  @media print{
    body{padding:16px 20px}
    .footer{display:none}
  }
</style>
</head>
<body>
  <div class="brand">Markap Homes · Interiorismo</div>
  <h1>${escapeHtml(project.name)}</h1>
  <p class="subtitle">${escapeHtml(info.clientName)} · ${escapeHtml(info.clientDocument)}</p>
  <p class="subtitle">${escapeHtml(project.code)}${budget.version > 1 ? ` · versión ${budget.version}` : ''}</p>
  ${metaParts.length ? `<p class="meta">${metaParts.map((p) => `<span>${p}</span>`).join('')}</p>` : ''}
  ${sectionBlocks}
  <div class="grand">
    <span class="grand-label">Presupuesto total</span>
    <span class="grand-value">${money(totals.total)}</span>
  </div>
  <div class="totals">${equivalent}</div>
  ${igvNote}
  <p class="footer">
    Documento para el cliente. No incluye costos internos ni datos de proveedores.<br/>
    Para guardar como PDF: Archivo → Imprimir → Guardar como PDF.
  </p>
</body>
</html>`;
  }
}
