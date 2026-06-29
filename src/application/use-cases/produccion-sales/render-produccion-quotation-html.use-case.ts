import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  APPLICATION_REPOSITORY,
  CLIENT_REPOSITORY,
  PRODUCCION_CONFIG_REPOSITORY,
  PRODUCCION_QUOTATION_REPOSITORY,
} from '@common/constants/injection-tokens';
import type { ApplicationRepository } from '@domain/repositories/application.repository';
import type { ClientRepository } from '@domain/repositories/client.repository';
import type { ProduccionConfigRepository } from '@domain/repositories/produccion-config.repository';
import type {
  ProduccionQuotationDetail,
  ProduccionQuotationRepository,
} from '@domain/repositories/produccion-sales.repository';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtMoney(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
};

@Injectable()
export class RenderProduccionQuotationHtmlUseCase {
  constructor(
    @Inject(PRODUCCION_QUOTATION_REPOSITORY)
    private readonly quotations: ProduccionQuotationRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepository,
    @Inject(PRODUCCION_CONFIG_REPOSITORY)
    private readonly config: ProduccionConfigRepository,
    @Inject(APPLICATION_REPOSITORY)
    private readonly applications: ApplicationRepository,
  ) {}

  async execute(id: string, applicationSlug = 'produccion'): Promise<string> {
    const quotation = await this.quotations.findById(id, applicationSlug);
    if (!quotation) throw new NotFoundException('Cotización no encontrada');

    const client = await this.clients.findById(quotation.clientId);
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const app = await this.applications.findBySlug(applicationSlug);
    if (!app) throw new NotFoundException('Aplicación no encontrada');

    await this.config.ensureDefaults(app.id);
    const settings = await this.config.getSettings(app.id);

    return this.buildHtml(quotation, client.fullName, client.documentNumber, settings.igvPercent);
  }

  private buildHtml(
    q: ProduccionQuotationDetail,
    clientName: string,
    clientDocument: string,
    igvPercent: number,
  ): string {
    const subtotal = q.totalAmount;
    const igvAmount = Math.round(subtotal * (igvPercent / 100) * 100) / 100;
    const total = Math.round((subtotal + igvAmount) * 100) / 100;

    const lineRows = q.lines
      .map(
        (line) =>
          `<tr>
            <td class="code">${escapeHtml(line.furnitureCode)}</td>
            <td class="desc">${escapeHtml(line.furnitureName)}${line.notes ? `<br/><span class="note">${escapeHtml(line.notes)}</span>` : ''}</td>
            <td class="num">${line.quantity}</td>
            <td class="num">${fmtMoney(line.unitPrice)}</td>
            <td class="num">${fmtMoney(line.lineTotal)}</td>
          </tr>`,
      )
      .join('');

    const title = `Cotización ${q.code}`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;padding:32px 40px;max-width:860px;margin:0 auto;background:#fff}
  .brand{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888;margin-bottom:28px}
  h1{font-family:system-ui,sans-serif;font-size:22px;font-weight:600;margin:0 0 6px}
  .subtitle{font-family:system-ui,sans-serif;font-size:13px;color:#555;margin:0 0 4px}
  .meta{font-family:system-ui,sans-serif;font-size:12px;color:#666;margin:0 0 20px}
  .meta span+span::before{content:" · "}
  .status{display:inline-block;font-family:system-ui,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;border:1px solid #ccc;border-radius:4px;margin-bottom:16px}
  table{border-collapse:collapse;width:100%;font-family:system-ui,sans-serif;font-size:12px;margin-top:12px}
  th,td{border-bottom:1px solid #e5e5e5;padding:8px 6px;text-align:left;vertical-align:top}
  th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#888;font-weight:600}
  td.code{font-family:ui-monospace,monospace;font-size:11px;white-space:nowrap}
  td.desc{width:100%}
  td.num{text-align:right;white-space:nowrap;font-weight:500}
  .note{font-size:11px;color:#777}
  .totals{margin-top:18px;margin-left:auto;max-width:320px;font-family:system-ui,sans-serif;font-size:13px}
  .totals div{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee}
  .totals .grand{border-top:2px solid #1a1a1a;border-bottom:none;margin-top:8px;padding-top:10px;font-size:16px;font-weight:700}
  .notes{margin-top:20px;font-family:system-ui,sans-serif;font-size:12px;color:#444;line-height:1.5}
  .footer{margin-top:36px;font-family:system-ui,sans-serif;font-size:11px;color:#888;line-height:1.5}
  @media print{body{padding:16px 20px}.footer{display:none}}
</style>
</head>
<body>
  <div class="brand">Markap Homes · Producción de muebles</div>
  <h1>${escapeHtml(title)}</h1>
  <p class="subtitle">${escapeHtml(clientName)} · ${escapeHtml(clientDocument)}</p>
  <p class="meta">
    <span>Vigencia: ${escapeHtml(fmtDate(q.validUntil))}</span>
    <span>Emitida: ${escapeHtml(fmtDate(q.sentAt ?? q.updatedAt))}</span>
  </p>
  <div class="status">${escapeHtml(STATUS_LABELS[q.status] ?? q.status)}</div>
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descripción</th>
        <th>Cant.</th>
        <th>P. unit.</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${lineRows || '<tr><td colspan="5" class="note">Sin líneas</td></tr>'}
    </tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
    <div><span>IGV (${igvPercent}%)</span><span>${fmtMoney(igvAmount)}</span></div>
    <div class="grand"><span>Total</span><span>${fmtMoney(total)}</span></div>
  </div>
  ${q.notes ? `<div class="notes"><strong>Notas:</strong> ${escapeHtml(q.notes)}</div>` : ''}
  <p class="footer">
    Documento comercial para el cliente. Precios en soles (PEN).<br/>
    Para guardar como PDF: Archivo → Imprimir → Guardar como PDF.
  </p>
</body>
</html>`;
  }
}
