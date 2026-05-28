import { VENTAS_PIPELINE_STAGES, type VentasPipelineStage } from '@domain/repositories/ventas-sales.repository';

export function pipelineStageOrder(
  orderedStages?: readonly string[],
): readonly string[] {
  if (orderedStages?.length) return orderedStages;
  return VENTAS_PIPELINE_STAGES;
}

export function pipelineStageIndex(
  stage: string,
  orderedStages?: readonly string[],
): number {
  const order = pipelineStageOrder(orderedStages);
  const idx = order.indexOf(stage);
  return idx >= 0 ? idx : 0;
}

/** Solo avance o permanecer en la misma etapa (nunca retroceder en procesos activos). */
export function isForwardPipelineStage(
  fromStage: string,
  toStage: string,
  orderedStages?: readonly string[],
): boolean {
  if (fromStage === toStage) return true;
  return pipelineStageIndex(toStage, orderedStages) >= pipelineStageIndex(fromStage, orderedStages);
}

export function assertForwardPipelineStage(
  fromStage: string,
  toStage: string,
  orderedStages?: readonly string[],
): void {
  if (!isForwardPipelineStage(fromStage, toStage, orderedStages)) {
    throw new Error(
      'No se puede retroceder de etapa. Si la venta no continúa, registre la venta como caída (perdida).',
    );
  }
}

export function isVentasPipelineStageCode(
  v: string,
  orderedStages?: readonly string[],
): v is VentasPipelineStage {
  return pipelineStageOrder(orderedStages).includes(v);
}
