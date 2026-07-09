import {
  ArquitecturaNumberingSeries,
  ArquitecturaProjectStage,
} from '@domain/entities/arquitectura-config.entity';

export class ArquitecturaConfigPrismaMapper {
  static toProjectStage(r: {
    code: string;
    label: string;
    sortOrder: number;
    isActive: boolean;
  }): ArquitecturaProjectStage {
    return new ArquitecturaProjectStage(r.code, r.label, r.sortOrder, r.isActive);
  }

  static toNumberingSeries(r: {
    seriesKey: string;
    prefix: string;
    lastNumber: number;
  }): ArquitecturaNumberingSeries {
    return new ArquitecturaNumberingSeries(r.seriesKey, r.prefix, r.lastNumber);
  }
}
