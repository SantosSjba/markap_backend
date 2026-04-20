import { VentasNumberingSeries, VentasPipelineStage } from '@domain/entities/ventas-config.entity';

export class VentasConfigPrismaMapper {
  static toPipelineStage(r: {
    code: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
  }): VentasPipelineStage {
    return new VentasPipelineStage(r.code, r.label, r.sortOrder, r.isActive);
  }

  static toNumberingSeries(r: {
    seriesKey: string;
    prefix: string;
    lastNumber: number;
  }): VentasNumberingSeries {
    return new VentasNumberingSeries(r.seriesKey, r.prefix, r.lastNumber);
  }
}
