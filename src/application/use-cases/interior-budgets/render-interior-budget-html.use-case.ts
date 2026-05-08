import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { InteriorBudgetDetail } from '@domain/repositories/interior-budget.repository';
import {
  INTERIOR_BUDGET_REPOSITORY,
  type InteriorBudgetRepository,
} from '@domain/repositories/interior-budget.repository';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtSol(n: number): string {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

@Injectable()
export class RenderInteriorBudgetHtmlUseCase {
  constructor(
    @Inject(INTERIOR_BUDGET_REPOSITORY)
    private readonly repo: InteriorBudgetRepository,
  ) {}

  async execute(id: string, applicationSlug?: string): Promise<string> {
    const d = await this.repo.findById(id, applicationSlug ?? 'interiorismo');
    if (!d) throw new NotFoundException('Presupuesto no encontrado');
    return this.buildHtml(d);
  }

  private buildHtml(d: InteriorBudgetDetail): string {
    const clientLine = `${escapeHtml(d.project.client.fullName)} · ${escapeHtml(d.project.client.documentNumber)}`;
    const projLine = `${escapeHtml(d.project.code)} · ${escapeHtml(d.project.name)}`;

    const rows: string[] = [];
    for (const lvl of d.levels) {
      for (const env of lvl.environments) {
        for (const cat of env.categories) {
          for (const it of cat.items) {
            rows.push(
              `<tr>
                <td>${escapeHtml(lvl.name)}</td>
                <td>${escapeHtml(env.name)}</td>
                <td>${escapeHtml(cat.name)}</td>
                <td>${escapeHtml(it.description)}</td>
                <td>${escapeHtml(it.unit)}</td>
                <td class="num">${it.quantity}</td>
                <td class="num">${fmtSol(it.unitPrice)}</td>
                <td class="num">${it.utilityPct}%</td>
                <td class="num">${it.igvPct}%</td>
                <td class="num">${fmtSol(it.lineTotal)}</td>
              </tr>`,
            );
          }
        }
      }
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(d.code)} v${d.version}</title>
<style>
  body{font-family:system-ui,sans-serif;color:#111;padding:24px;max-width:1100px;margin:0 auto}
  h1{font-size:20px;margin:0 0 4px}
  .muted{color:#555;font-size:13px}
  table{border-collapse:collapse;width:100%;margin-top:16px;font-size:12px}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
  th{background:#f3f4f6}
  td.num{text-align:right;white-space:nowrap}
  .tot{font-weight:600;text-align:right;margin-top:12px;font-size:14px}
  @media print{body{padding:12px}}
</style>
</head>
<body>
  <h1>Presupuesto ${escapeHtml(d.code)} <span class="muted">v${d.version}</span></h1>
  <p class="muted">${projLine}</p>
  <p class="muted">${clientLine}</p>
  <p class="muted">Estado: ${escapeHtml(d.status)} · IGV por defecto: ${d.defaultIgvPct}%</p>
  ${d.title ? `<p>${escapeHtml(d.title)}</p>` : ''}
  <table>
    <thead>
      <tr>
        <th>Nivel</th><th>Ambiente</th><th>Categoría</th><th>Descripción</th><th>Unidad</th>
        <th>Cant.</th><th>Precio</th><th>Utilidad</th><th>IGV</th><th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length ? rows.join('') : '<tr><td colspan="10">Sin ítems</td></tr>'}
    </tbody>
  </table>
  <p class="tot">Base imponible: ${fmtSol(d.taxableTotal)} · IGV: ${fmtSol(d.igvTotal)} · Total: ${fmtSol(d.grandTotal)}</p>
  <p class="muted" style="margin-top:20px">Para PDF: use Impresión → Guardar como PDF en su navegador.</p>
</body>
</html>`;
  }
}
