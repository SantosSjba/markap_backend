/**
 * Reglas de avance del pipeline de Ventas: se avanza una etapa a la vez y cada etapa exige su
 * documento cargado en Cumplimiento legal; retroceder es posible, pero con motivo.
 */

/** Documento de cumplimiento (docType) que respalda llegar a cada etapa */
export const STAGE_REQUIRED_DOCUMENT: Readonly<
  Record<string, { docType: string; label: string }>
> = {
  ARRAS: { docType: 'ARRAS', label: 'contrato de arras' },
  MINUTA: { docType: 'MINUTA', label: 'minuta' },
  PUBLIC_DEED: { docType: 'ESCRITURA_PUBLICA', label: 'escritura pública' },
};

export type StageChange =
  | { kind: 'same' }
  | { kind: 'backward' }
  | { kind: 'forward'; skipsStages: boolean; missingDocuments: string[] };

/**
 * Documentos que faltan para estar en `target` (de las etapas posteriores a `from` hasta `target`).
 * `order` son las etapas activas en su orden configurado.
 */
export function missingStageDocuments(
  from: string,
  target: string,
  order: readonly string[],
  uploadedDocTypes: ReadonlySet<string>,
): string[] {
  const start = order.indexOf(from);
  const end = order.indexOf(target);
  return order
    .slice(start + 1, end + 1)
    .map((stage) => STAGE_REQUIRED_DOCUMENT[stage])
    .filter((req) => req && !uploadedDocTypes.has(req.docType))
    .map((req) => req.label);
}

export function evaluateStageChange(
  from: string,
  target: string,
  order: readonly string[],
  uploadedDocTypes: ReadonlySet<string>,
): StageChange {
  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(target);
  if (fromIdx === toIdx) return { kind: 'same' };
  if (toIdx < fromIdx) return { kind: 'backward' };
  return {
    kind: 'forward',
    skipsStages: toIdx - fromIdx > 1,
    missingDocuments: missingStageDocuments(
      from,
      target,
      order,
      uploadedDocTypes,
    ),
  };
}
