import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ARQUITECTURA_PROJECT_BUDGET_REPOSITORY,
  type ArquitecturaProjectBudgetRepository,
  type ProjectBudgetDetailDto,
} from '@domain/repositories/arquitectura-project-budget.repository';
import {
  ARQUITECTURA_PROJECT_REPOSITORY,
  type ArquitecturaProjectRepository,
} from '@domain/repositories/arquitectura-project.repository';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtMoney(amount: number, currency: string): string {
  const code = currency === 'USD' ? 'USD' : 'PEN';
  const prefix = code === 'USD' ? 'US$' : 'S/';
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
export class RenderArquitecturaProjectBudgetHtmlUseCase {
  constructor(
    @Inject(ARQUITECTURA_PROJECT_BUDGET_REPOSITORY)
    private readonly budgetRepo: ArquitecturaProjectBudgetRepository,
    @Inject(ARQUITECTURA_PROJECT_REPOSITORY)
    private readonly projectRepo: ArquitecturaProjectRepository,
  ) {}

  async execute(projectId: string, applicationSlug = 'arquitectura'): Promise<string> {
    const budget = await this.budgetRepo.getBudget(projectId, applicationSlug);
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    const project = await this.projectRepo.findById(projectId, applicationSlug);
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    return this.buildHtml(budget, project.client.fullName, project.client.documentNumber);
  }

  private buildHtml(
    budget: ProjectBudgetDetailDto,
    clientName: string,
    clientDocument: string,
  ): string {
    const title = `Presupuesto — ${budget.projectName}`;
    const intervention = budget.interventionLevel
      ? (INTERVENTION_LABELS[budget.interventionLevel] ?? budget.interventionLevel)
      : null;

    const metaParts = [
      budget.city ? escapeHtml(budget.city) : null,
      intervention ? escapeHtml(intervention) : null,
      budget.executionTimeNote ? escapeHtml(budget.executionTimeNote) : null,
    ].filter(Boolean);

    const sectionBlocks = budget.sections
      .map((section) => {
        const rows = section.lineItems
          .map(
            (item) =>
              `<tr>
                <td class="desc">${escapeHtml(item.description)}</td>
                <td class="num">${fmtMoney(item.price, budget.currency)}</td>
              </tr>`,
          )
          .join('');

        return `
          <div class="section">
            <div class="section-head">
              <h2>${escapeHtml(section.name)}</h2>
              <span class="section-total">${fmtMoney(section.sectionTotal, budget.currency)}</span>
            </div>
            <table>
              <thead>
                <tr><th>Descripción</th><th>Precio</th></tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="2" class="empty">Sin partidas</td></tr>'}
              </tbody>
            </table>
          </div>`;
      })
      .join('');

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
  <div class="brand">Markap Homes · Arquitectura</div>
  <h1>${escapeHtml(budget.projectName)}</h1>
  <p class="subtitle">${escapeHtml(clientName)} · ${escapeHtml(clientDocument)}</p>
  <p class="subtitle">${escapeHtml(budget.projectCode)}</p>
  ${metaParts.length ? `<p class="meta">${metaParts.map((p) => `<span>${p}</span>`).join('')}</p>` : ''}
  ${sectionBlocks || '<p class="meta">Sin secciones registradas.</p>'}
  <div class="grand">
    <span class="grand-label">Presupuesto total</span>
    <span class="grand-value">${fmtMoney(budget.totals.priceTotal, budget.currency)}</span>
  </div>
  <p class="footer">
    Documento para el cliente. No incluye costos internos ni datos de proveedores.<br/>
    Para guardar como PDF: Archivo → Imprimir → Guardar como PDF.
  </p>
</body>
</html>`;
  }
}
