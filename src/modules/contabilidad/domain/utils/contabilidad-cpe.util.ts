import { createHash } from 'crypto';
import { CONTABILIDAD_CPE_DOCUMENT_KIND } from '../constants/contabilidad-cpe.defaults';

export function hashXmlContent(xml: string): string {
  return createHash('sha256').update(xml, 'utf8').digest('hex');
}

export function cpeDocumentKindFromSalesType(documentType: string): string {
  if (documentType === 'BOLETA') return CONTABILIDAD_CPE_DOCUMENT_KIND.BOLETA;
  return CONTABILIDAD_CPE_DOCUMENT_KIND.FACTURA;
}
